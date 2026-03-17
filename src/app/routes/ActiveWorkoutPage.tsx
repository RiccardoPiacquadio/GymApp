import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { getExerciseById } from "../../features/exercises/services/exerciseRepository";
import {
  completeWorkoutSession,
  getActiveSessionForUser,
  getSessionExercises,
  getSessionSummary
} from "../../features/sessions/services/sessionRepository";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { VoiceCaptureButton } from "../../features/voice/components/VoiceCaptureButton";
import { VoiceParsePreview } from "../../features/voice/components/VoiceParsePreview";
import { processVoiceCommand } from "../../features/voice/services/voiceCommandProcessor";
import {
  captureSpeechOnce,
  getSpeechSupportState
} from "../../features/voice/services/speechCapture";
import {
  getVoiceConversationState,
  setVoiceConversationState
} from "../../features/voice/services/voiceConversationStore";
import type {
  ParsedVoiceSet,
  SpeechCaptureState,
  VoiceConversationState
} from "../../features/voice/types/voice";

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
    async () =>
      activeSession ? await getSessionSummary(activeSession.id) : { totalExercises: 0, totalSets: 0, totalVolume: 0 },
    [activeSession?.id],
    { totalExercises: 0, totalSets: 0, totalVolume: 0 }
  );

  const [speechState, setSpeechState] = useState<SpeechCaptureState>(getSpeechSupportState());
  const [parsedVoiceSet, setParsedVoiceSet] = useState<ParsedVoiceSet | null>(null);
  const [voiceExerciseName, setVoiceExerciseName] = useState<string>();
  const [voiceCandidateNames, setVoiceCandidateNames] = useState<string[]>([]);
  const [voiceFeedback, setVoiceFeedback] = useState<string>();
  const [conversationState, setConversationStateLocal] = useState<VoiceConversationState>();
  const [activeExerciseName, setActiveExerciseName] = useState<string>();

  useEffect(() => {
    const loadConversationState = async () => {
      const state = await getVoiceConversationState();
      setConversationStateLocal(state);
      if (state.activeExerciseId) {
        const exercise = await getExerciseById(state.activeExerciseId);
        setActiveExerciseName(exercise?.canonicalName);
      } else {
        setActiveExerciseName(undefined);
      }
      setVoiceFeedback(state.lastFeedback);
    };

    void loadConversationState();
  }, [activeSession?.id]);

  const handleComplete = async () => {
    if (!activeSession) {
      return;
    }
    await completeWorkoutSession(activeSession.id);
    await setVoiceConversationState({ lastFeedback: "Sessione chiusa." });
    navigate("/history");
  };

  const handleVoiceCapture = async () => {
    if (!activeProfileId) {
      return;
    }

    try {
      setSpeechState("listening");
      const transcript = await captureSpeechOnce("it-IT");
      const result = await processVoiceCommand(transcript, activeProfileId);
      setVoiceFeedback(result.feedback);

      if (result.conversationState) {
        setConversationStateLocal(result.conversationState);
        if (result.conversationState.activeExerciseId) {
          const exercise = await getExerciseById(result.conversationState.activeExerciseId);
          setActiveExerciseName(exercise?.canonicalName);
        } else {
          setActiveExerciseName(undefined);
        }
      }

      if (result.parsedVoiceSet) {
        setParsedVoiceSet(result.parsedVoiceSet);
        if (result.parsedVoiceSet.canonicalExerciseId) {
          const exercise = await getExerciseById(result.parsedVoiceSet.canonicalExerciseId);
          setVoiceExerciseName(exercise?.canonicalName);
        } else {
          setVoiceExerciseName(undefined);
        }
        setVoiceCandidateNames(result.candidateNames ?? []);
      } else {
        setParsedVoiceSet(null);
        setVoiceExerciseName(undefined);
        setVoiceCandidateNames([]);
      }

      setSpeechState(getSpeechSupportState());
    } catch {
      setSpeechState("error");
      setVoiceFeedback("Errore durante il riconoscimento vocale.");
      setSpeechState(getSpeechSupportState());
    }
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
        subtitle="Voice-first: puoi dettare set completi o usare comandi contestuali come uguale, ancora 8, no 7, cancella ultima."
        action={
          <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => void handleComplete()}>
            Chiudi
          </button>
        }
      />

      <SessionSummaryCard {...sessionSummary} />

      <div className="dark-panel space-y-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-orange-300">Contesto vocale</p>
            <p className="mt-1 text-lg font-semibold text-white">{activeExerciseName ?? "Nessun esercizio attivo"}</p>
            <p className="mt-1 text-sm text-white/75">
              Ultimo set: {conversationState?.lastWeight ?? "-"} kg x {conversationState?.lastReps ?? "-"}
            </p>
          </div>
          {conversationState?.lastSetNumber ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">Serie {conversationState.lastSetNumber}</span>
          ) : null}
        </div>
        {voiceFeedback ? <p className="text-sm text-white/90">{voiceFeedback}</p> : null}
      </div>

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
          candidateNames={voiceCandidateNames}
          onConfirm={async () => {
            setParsedVoiceSet(null);
            setVoiceExerciseName(undefined);
            setVoiceCandidateNames([]);
          }}
          onCancel={() => {
            setParsedVoiceSet(null);
            setVoiceExerciseName(undefined);
            setVoiceCandidateNames([]);
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
