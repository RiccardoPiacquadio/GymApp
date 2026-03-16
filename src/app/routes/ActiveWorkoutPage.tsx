import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { getExerciseById } from "../../features/exercises/services/exerciseRepository";
import {
  addExerciseToSession,
  addSetEntry,
  completeWorkoutSession,
  getActiveSessionForUser,
  getSessionExercises,
  getSessionSummary
} from "../../features/sessions/services/sessionRepository";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { VoiceCaptureButton } from "../../features/voice/components/VoiceCaptureButton";
import { VoiceParsePreview } from "../../features/voice/components/VoiceParsePreview";
import { captureSpeechOnce, getSpeechSupportState } from "../../features/voice/services/speechCapture";
import { parseVoiceSet } from "../../features/voice/services/voiceParser";
import type { ParsedVoiceSet, SpeechCaptureState } from "../../features/voice/types/voice";

export const ActiveWorkoutPage = () => {
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const activeSession = useLiveQuery(
    async () => (activeProfileId ? await getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );
  const sessionBundles = useLiveQuery(
    async () => (activeSession ? await getSessionExercises(activeSession.id) : []),
    [activeSession?.id],
    []
  );
  const sessionSummary = useLiveQuery(
    async () => (activeSession ? await getSessionSummary(activeSession.id) : { totalExercises: 0, totalSets: 0, totalVolume: 0 }),
    [activeSession?.id],
    { totalExercises: 0, totalSets: 0, totalVolume: 0 }
  );

  const [speechState, setSpeechState] = useState<SpeechCaptureState>(getSpeechSupportState());
  const [parsedVoiceSet, setParsedVoiceSet] = useState<ParsedVoiceSet | null>(null);
  const [voiceExerciseName, setVoiceExerciseName] = useState<string>();

  const handleComplete = async () => {
    if (!activeSession) {
      return;
    }
    await completeWorkoutSession(activeSession.id);
    navigate("/history");
  };

  const handleVoiceCapture = async () => {
    try {
      setSpeechState("listening");
      const transcript = await captureSpeechOnce("it-IT");
      const parsed = await parseVoiceSet(transcript);
      setParsedVoiceSet(parsed);
      if (parsed.canonicalExerciseId) {
        const exercise = await getExerciseById(parsed.canonicalExerciseId);
        setVoiceExerciseName(exercise?.canonicalName);
      } else {
        setVoiceExerciseName(undefined);
      }
      setSpeechState(getSpeechSupportState());
    } catch {
      setSpeechState("error");
      setSpeechState(getSpeechSupportState());
    }
  };

  const handleVoiceConfirm = async () => {
    if (!activeSession || !parsedVoiceSet?.canonicalExerciseId || !parsedVoiceSet.weight || !parsedVoiceSet.reps) {
      return;
    }
    const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
    if (!exercise) {
      return;
    }
    const sessionExercise = await addExerciseToSession(activeSession.id, exercise);
    await addSetEntry({
      sessionExerciseId: sessionExercise.id,
      reps: parsedVoiceSet.reps,
      weight: parsedVoiceSet.weight,
      inputMode: "voice"
    });
    setParsedVoiceSet(null);
    setVoiceExerciseName(undefined);
  };

  if (!activeSession) {
    return (
      <div className="app-panel space-y-4 p-5">
        <p className="text-lg font-semibold">Nessuna sessione attiva</p>
        <Link className="primary-button w-full" to="/workout/start">
          Inizia allenamento
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Sessione attiva"
        subtitle="Aggiungi esercizi e serie reali, modifica al volo e chiudi quando hai finito."
        action={
          <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => void handleComplete()}>
            Chiudi
          </button>
        }
      />

      <SessionSummaryCard {...sessionSummary} />

      <div className="grid grid-cols-2 gap-3">
        <Link className="primary-button" to="/workout/active/exercises">
          Aggiungi esercizio
        </Link>
        <VoiceCaptureButton state={speechState} onStart={handleVoiceCapture} />
      </div>

      {parsedVoiceSet ? (
        <VoiceParsePreview
          parsed={parsedVoiceSet}
          exerciseName={voiceExerciseName}
          onConfirm={handleVoiceConfirm}
          onCancel={() => {
            setParsedVoiceSet(null);
            setVoiceExerciseName(undefined);
          }}
        />
      ) : null}

      <section>
        <SectionTitle title="Esercizi in sessione" subtitle="Tocca un esercizio per aggiungere o modificare le serie." />
        <div className="space-y-3">
          {sessionBundles.map((bundle) => {
            const volume = bundle.sets.reduce((total, entry) => total + entry.weight * entry.reps, 0);
            return (
              <Link key={bundle.sessionExercise.id} to={`/workout/active/exercises/${bundle.sessionExercise.id}`} className="app-panel block p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{bundle.exercise.canonicalName}</p>
                    <p className="mt-1 text-sm text-slate-500">{bundle.sets.length} serie registrate</p>
                  </div>
                  <span className="pill">{volume} vol</span>
                </div>
              </Link>
            );
          })}
          {sessionBundles.length === 0 ? <div className="app-panel p-4 text-sm text-slate-500">Aggiungi il primo esercizio della sessione.</div> : null}
        </div>
      </section>
    </div>
  );
};
