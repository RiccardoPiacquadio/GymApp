import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { getExerciseById } from "../../features/exercises/services/exerciseRepository";
import {
  completeWorkoutSession,
  getActiveSessionForUser,
  getSessionExercises,
  getSessionSummary,
  resumeWorkoutSession
} from "../../features/sessions/services/sessionRepository";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { VoiceCaptureButton } from "../../features/voice/components/VoiceCaptureButton";
import { VoiceParsePreview } from "../../features/voice/components/VoiceParsePreview";
import {
  hydrateConversationStateForSession,
  processVoiceCommand
} from "../../features/voice/services/voiceCommandProcessor";
import {
  captureSpeechOnce,
  getSpeechSupportState
} from "../../features/voice/services/speechCapture";
import { setVoiceConversationState } from "../../features/voice/services/voiceConversationStore";
import {
  startHandsFreeMode,
  type HandsFreeController,
  type HandsFreeStatus
} from "../../features/voice/services/handsFreeService";
import type {
  ParsedVoiceSet,
  SpeechCaptureState,
  VoiceConversationState
} from "../../features/voice/types/voice";

type ListeningPhase = "idle" | "listening" | "hearing" | "processing";

const CONFIRMATION_RE = /^(?:s[iì]|confermo|ok|chiudi|esatto|certo|vai)$/;
const CANCELLATION_RE = /^(?:no|annulla|aspetta|cancel)$/;

const normalizeForConfirmation = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

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

  // -- speech / voice state --
  const [speechState, setSpeechState] = useState<SpeechCaptureState>(getSpeechSupportState());
  const [parsedVoiceSet, setParsedVoiceSet] = useState<ParsedVoiceSet | null>(null);
  const [voiceExerciseName, setVoiceExerciseName] = useState<string>();
  const [voiceCandidateNames, setVoiceCandidateNames] = useState<string[]>([]);
  const [voiceFeedback, setVoiceFeedback] = useState<string>();
  const [conversationState, setConversationStateLocal] = useState<VoiceConversationState>();
  const [activeExerciseName, setActiveExerciseName] = useState<string>();
  const [liveTranscript, setLiveTranscript] = useState("");
  const [listeningPhase, setListeningPhase] = useState<ListeningPhase>("idle");
  const [pendingSessionClose, setPendingSessionClose] = useState(false);

  // -- hands-free state --
  const [handsFreeEnabled, setHandsFreeEnabled] = useState(false);
  const [handsFreeStatus, setHandsFreeStatus] = useState<HandsFreeStatus>("off");
  const handsFreeRef = useRef<HandsFreeController | null>(null);

  // Hydrate voice context from actual session state
  useEffect(() => {
    const loadConversationState = async () => {
      if (!activeSession) return;
      const state = await hydrateConversationStateForSession(activeSession.id);
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

  // Cleanup hands-free on unmount
  useEffect(() => {
    return () => {
      handsFreeRef.current?.stop();
    };
  }, []);

  // -----------------------------------------------------------------------
  // Core: process a transcript and update all UI state
  // -----------------------------------------------------------------------

  const processTranscript = async (transcript: string) => {
    if (!activeProfileId) return;

    // Handle pending session close
    if (pendingSessionClose) {
      const normalized = normalizeForConfirmation(transcript);
      if (CONFIRMATION_RE.test(normalized)) {
        await handleComplete();
        setPendingSessionClose(false);
        return;
      }
      if (CANCELLATION_RE.test(normalized)) {
        setPendingSessionClose(false);
        setVoiceFeedback("Chiusura annullata.");
        return;
      }
      setPendingSessionClose(false);
    }

    const result = await processVoiceCommand(transcript, activeProfileId);
    setVoiceFeedback(result.feedback);

    if (result.sessionAction === "close_session_pending") {
      setPendingSessionClose(true);
    }

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
  };

  // Stable ref so the hands-free callback never uses a stale closure
  const processTranscriptRef = useRef(processTranscript);
  processTranscriptRef.current = processTranscript;

  // -----------------------------------------------------------------------
  // Session actions
  // -----------------------------------------------------------------------

  const handleComplete = async () => {
    if (!activeSession) return;
    handsFreeRef.current?.stop();
    handsFreeRef.current = null;
    setHandsFreeEnabled(false);
    setHandsFreeStatus("off");
    await completeWorkoutSession(activeSession.id);
    await setVoiceConversationState({ lastFeedback: "Sessione chiusa." });
    navigate("/history");
  };

  const handleResume = async () => {
    if (!activeSession) return;
    await resumeWorkoutSession(activeSession.id);
    setVoiceFeedback("Sessione ripresa.");
  };

  // -----------------------------------------------------------------------
  // Manual voice capture (button tap)
  // -----------------------------------------------------------------------

  const handleVoiceCapture = async () => {
    if (!activeProfileId) return;

    // Pause wake word listener so it doesn't compete for the mic
    handsFreeRef.current?.pauseListening();

    try {
      setSpeechState("listening");
      setListeningPhase("listening");
      setLiveTranscript("");

      const transcript = await captureSpeechOnce({
        lang: "it-IT",
        silenceMs: 4000,
        onTranscriptChange: (value) => setLiveTranscript(value),
        onStateChange: (state) => setListeningPhase(state)
      });

      await processTranscript(transcript);
    } catch (error) {
      setSpeechState("error");
      setVoiceFeedback(
        error instanceof Error && error.message === "Nessun testo riconosciuto"
          ? "Non ho sentito niente di utile. Riprova o correggi a mano."
          : "Errore durante il riconoscimento vocale."
      );
    } finally {
      setSpeechState(getSpeechSupportState());
      setListeningPhase("idle");

      // Resume wake word listener if still enabled
      if (handsFreeEnabled) {
        handsFreeRef.current?.resumeListening();
      }
    }
  };

  // -----------------------------------------------------------------------
  // Hands-free toggle
  // -----------------------------------------------------------------------

  const toggleHandsFree = () => {
    if (handsFreeEnabled) {
      handsFreeRef.current?.stop();
      handsFreeRef.current = null;
      setHandsFreeEnabled(false);
      setHandsFreeStatus("off");
    } else {
      const controller = startHandsFreeMode({
        wakePhrase: "gym",
        lang: "it-IT",
        onCommand: (t) => processTranscriptRef.current(t),
        onStatusChange: setHandsFreeStatus,
        onWakeDetected: () => setVoiceFeedback("GYM rilevato — dimmi il comando.")
      });
      handsFreeRef.current = controller;
      setHandsFreeEnabled(true);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

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

  const isPaused = activeSession.status === "paused";

  return (
    <div className="space-y-5">
      <SectionTitle
        title={isPaused ? "Sessione in pausa" : "Sessione attiva"}
        subtitle="Voice-first: puoi dettare comandi naturali come squat 100 per 8, ancora 8 rep, no 7 colpi, cancella ultima, adesso lat machine."
        action={
          <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => void handleComplete()}>
            Chiudi
          </button>
        }
      />

      {/* Paused banner */}
      {isPaused ? (
        <div className="dark-panel flex items-center justify-between gap-4 p-4">
          <p className="text-sm font-semibold text-white">Sessione in pausa</p>
          <button
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
            type="button"
            onClick={() => void handleResume()}
          >
            Riprendi
          </button>
        </div>
      ) : null}

      <SessionSummaryCard {...sessionSummary} />

      {/* Voice context panel */}
      <div className="dark-panel space-y-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-chrome">Contesto vocale</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {activeExerciseName ?? "Nessun esercizio attivo"}
            </p>
            <p className="mt-1 text-sm text-white/75">
              Ultimo set: {conversationState?.lastWeight ?? "-"} kg x {conversationState?.lastReps ?? "-"}
            </p>
          </div>
          {conversationState?.lastSetNumber ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
              Serie {conversationState.lastSetNumber}
            </span>
          ) : null}
        </div>
        {voiceFeedback ? (
          <p className={`text-sm ${pendingSessionClose ? "font-semibold text-accent" : "text-white/90"}`}>
            {voiceFeedback}
          </p>
        ) : null}
        {/* Pending close confirmation */}
        {pendingSessionClose ? (
          <div className="flex gap-3 pt-1">
            <button
              className="flex-1 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white"
              type="button"
              onClick={() => void handleComplete().then(() => setPendingSessionClose(false))}
            >
              Sì, chiudi
            </button>
            <button
              className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
              type="button"
              onClick={() => {
                setPendingSessionClose(false);
                setVoiceFeedback("Chiusura annullata.");
              }}
            >
              Annulla
            </button>
          </div>
        ) : null}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Link className="primary-button" to="/workout/active/exercises">
          Aggiungi esercizio
        </Link>
        <VoiceCaptureButton state={speechState} onStart={handleVoiceCapture} />
      </div>

      {/* Hands-free toggle */}
      <button
        type="button"
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
          handsFreeEnabled
            ? "bg-accent text-white"
            : "bg-ink/5 text-ink/70"
        }`}
        onClick={toggleHandsFree}
      >
        {handsFreeEnabled ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Vivavoce ON — dì &quot;GYM&quot;
            {handsFreeStatus === "wake_detected" ? " — parla ora" : ""}
          </span>
        ) : (
          "Vivavoce OFF — attiva per AirPods e parola chiave"
        )}
      </button>

      {/* Live listening indicator (manual capture) */}
      {speechState === "listening" ? (
        <div className={`dark-panel space-y-3 p-4 ${listeningPhase === "hearing" ? "ring-2 ring-accent" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  listeningPhase === "hearing" ? "bg-accent animate-pulse" : "bg-white/70 animate-pulse"
                }`}
              />
              <p className="text-sm font-semibold text-white">
                {listeningPhase === "processing"
                  ? "Sto chiudendo l'ascolto..."
                  : listeningPhase === "hearing"
                    ? "Ti sto sentendo"
                    : pendingSessionClose
                      ? "Dimmi: sì per confermare, no per annullare"
                      : "In ascolto"}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
              stop dopo 4s di silenzio
            </span>
          </div>
          <p
            className={`min-h-[3rem] rounded-2xl border px-3 py-3 text-sm ${
              liveTranscript
                ? "border-accent/40 bg-[#111111] text-white"
                : "border-white/15 bg-[#0b0b0b] text-chrome"
            }`}
          >
            {liveTranscript || "Parla pure. Appena sente parole, qui sotto vedrai il testo che sta arrivando."}
          </p>
        </div>
      ) : null}

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

      {/* Exercise list */}
      <section>
        <SectionTitle title="Esercizi in sessione" subtitle="Tocca un esercizio per aggiungere o modificare le serie." />
        <div className="space-y-3">
          {sessionBundles.map((bundle) => {
            const volume = bundle.sets.reduce((total, entry) => total + entry.weight * entry.reps, 0);
            return (
              <Link
                key={bundle.sessionExercise.id}
                to={`/workout/active/exercises/${bundle.sessionExercise.id}`}
                className="app-panel block p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold">{bundle.exercise.canonicalName}</p>
                    <p className="mt-1 text-sm text-ink/70">{bundle.sets.length} serie registrate</p>
                  </div>
                  <span className="pill">{volume} vol</span>
                </div>
              </Link>
            );
          })}
          {sessionBundles.length === 0 ? (
            <div className="app-panel p-4 text-sm text-ink/70">Aggiungi il primo esercizio della sessione.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
