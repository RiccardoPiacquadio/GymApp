import { useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import {
  completeWorkoutSession,
  getActiveSessionForUser,
  getSessionExercises,
  getSessionSummary,
  pauseWorkoutSession,
  resumeWorkoutSession
} from "../../features/sessions/services/sessionRepository";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { SessionTimer } from "../../features/sessions/components/SessionTimer";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { VoiceCaptureButton } from "../../features/voice/components/VoiceCaptureButton";
import { VoiceParsePreview } from "../../features/voice/components/VoiceParsePreview";
import { setVoiceConversationState } from "../../features/voice/services/voiceConversationStore";
import { useVoiceSession } from "../../features/voice/hooks/useVoiceSession";
import { VoiceErrorBoundary } from "../../components/common/VoiceErrorBoundary";

const formatVolume = (vol: number) =>
  vol >= 1000 ? `${(vol / 1000).toFixed(1)} t` : `${vol} kg`;

export const ActiveWorkoutPage = () => {
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState(false);

  const activeSession = useLiveQuery(
    () => (activeProfileId ? getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );
  const sessionBundles = useLiveQuery(
    () => (activeSession ? getSessionExercises(activeSession.id) : []),
    [activeSession?.id],
    []
  );
  const sessionSummary = useLiveQuery(
    () => activeSession ? getSessionSummary(activeSession.id) : { totalExercises: 0, totalSets: 0, totalVolume: 0 },
    [activeSession?.id],
    { totalExercises: 0, totalSets: 0, totalVolume: 0 }
  );

  // -----------------------------------------------------------------------
  // Session actions
  // -----------------------------------------------------------------------

  const handleComplete = useCallback(async () => {
    if (!activeSession) return;
    voice.stopHandsFree();
    await completeWorkoutSession(activeSession.id);
    await setVoiceConversationState({ lastFeedback: "Sessione chiusa." });
    navigate("/history");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id, navigate]);

  // -----------------------------------------------------------------------
  // Voice session hook
  // -----------------------------------------------------------------------

  const voice = useVoiceSession({
    activeProfileId,
    sessionId: activeSession?.id,
    onComplete: handleComplete
  });

  // Flash + haptic on successful voice save
  const triggerFlash = useCallback(() => {
    setFlashFeedback(true);
    if ("vibrate" in navigator) navigator.vibrate(80);
    setTimeout(() => setFlashFeedback(false), 600);
  }, []);

  // Auto-open voice panel when voice is active
  const effectiveVoicePanelOpen = voicePanelOpen || voice.speechState === "listening" || voice.handsFreeEnabled || voice.pendingSessionClose;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (!activeSession) {
    return (
      <div className="app-panel space-y-4 p-5">
        <p className="text-lg font-semibold">Nessuna sessione attiva</p>
        <Link className="primary-button w-full" to="/dashboard">
          Inizia allenamento
        </Link>
      </div>
    );
  }

  const isPaused = activeSession.status === "paused";

  return (
    <div className={`space-y-5 ${flashFeedback ? "animate-flash" : ""}`}>
      <SectionTitle
        title={isPaused ? "Sessione in pausa" : "Sessione attiva"}
        subtitle="Comandi vocali: squat 100x8, ancora, no 7, cancella."
      />

      {/* Session timer with pause/resume/close controls */}
      <SessionTimer
        session={activeSession}
        onPause={() => void pauseWorkoutSession(activeSession.id).then(() => voice.setVoiceFeedback("Sessione in pausa."))}
        onResume={() => void resumeWorkoutSession(activeSession.id).then(() => voice.setVoiceFeedback("Sessione ripresa."))}
        onClose={() => void handleComplete()}
      />

      {/* Action buttons â€” moved to top for quick access */}
      <div className="grid grid-cols-2 gap-3">
        <Link className="primary-button" to="/workout/active/exercises">
          Aggiungi esercizio
        </Link>
        <VoiceCaptureButton state={voice.speechState} onToggle={async () => { const didSave = await voice.handleVoiceCapture(); if (didSave) triggerFlash(); }} />
      </div>

      {/* Hands-free toggle */}
      <button
        type="button"
        className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
          voice.handsFreeEnabled
            ? "bg-accent text-white"
            : "bg-ink/5 text-ink/70"
        }`}
        onClick={voice.toggleHandsFree}
      >
        {voice.handsFreeEnabled ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
            Vivavoce ON â€” dÃ¬ &quot;GYM&quot;
            {voice.handsFreeStatus === "wake_detected" ? " â€” parla ora" : ""}
          </span>
        ) : (
          "Vivavoce OFF â€” attiva per AirPods e parola chiave"
        )}
      </button>

      <SessionSummaryCard {...sessionSummary} />

      {/* Voice context panel â€” collapsible */}
      <VoiceErrorBoundary>
      <div className="dark-panel overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3"
          onClick={() => setVoicePanelOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-3 text-left">
            <span className={`h-2 w-2 rounded-full ${voice.conversationState?.activeExerciseId ? "bg-accent" : "bg-white/30"}`} />
            <span className="text-sm font-semibold text-white">
              {voice.activeExerciseName ?? "Nessun esercizio attivo"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {voice.conversationState?.lastSetNumber ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink">
                S{voice.conversationState.lastSetNumber}
              </span>
            ) : null}
            <svg
              className={`h-4 w-4 text-white/60 transition-transform ${effectiveVoicePanelOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        {effectiveVoicePanelOpen ? (
          <div className="space-y-3 px-4 pb-4">
            <p className="text-sm text-white/75">
              Ultimo set: {voice.conversationState?.lastWeight ?? "-"} kg x {voice.conversationState?.lastReps ?? "-"}
            </p>
            {voice.voiceFeedback ? (
              <p className={`text-sm ${voice.pendingSessionClose ? "font-semibold text-accent" : "text-white/90"}`}>
                {voice.voiceFeedback}
              </p>
            ) : null}
            {voice.pendingSessionClose ? (
              <div className="flex gap-3 pt-1">
                <button
                  className="flex-1 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white"
                  type="button"
                  onClick={() => void handleComplete().then(() => voice.setPendingSessionClose(false))}
                >
                  SÃ¬, chiudi
                </button>
                <button
                  className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white"
                  type="button"
                  onClick={() => {
                    voice.setPendingSessionClose(false);
                    voice.setVoiceFeedback("Chiusura annullata.");
                  }}
                >
                  Annulla
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Live listening indicator */}
      {voice.speechState === "listening" ? (
        <div className={`dark-panel space-y-3 p-4 ${voice.listeningPhase === "hearing" ? "ring-2 ring-accent" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-3 w-3 rounded-full ${
                  voice.listeningPhase === "hearing" ? "bg-accent animate-pulse" : "bg-white/70 animate-pulse"
                }`}
              />
              <p className="text-sm font-semibold text-white">
                {voice.listeningPhase === "processing"
                  ? "Sto chiudendo l'ascolto..."
                  : voice.listeningPhase === "hearing"
                    ? "Ti sto sentendo"
                    : voice.pendingSessionClose
                      ? "Dimmi: sÃ¬ per confermare, no per annullare"
                      : "In ascolto"}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
              stop dopo 4s di silenzio
            </span>
          </div>
          <p
            className={`min-h-[3rem] rounded-2xl border px-3 py-3 text-sm ${
              voice.liveTranscript
                ? "border-accent/40 bg-[#111111] text-white"
                : "border-white/15 bg-[#0b0b0b] text-chrome"
            }`}
          >
            {voice.liveTranscript || "Parla pure..."}
          </p>
        </div>
      ) : null}

      {voice.parsedVoiceSet ? (
        <VoiceParsePreview
          parsed={voice.parsedVoiceSet}
          exerciseName={voice.voiceExerciseName}
          candidateNames={voice.voiceCandidateNames}
          onConfirm={async () => voice.clearParsedVoiceSet()}
          onCancel={() => voice.clearParsedVoiceSet()}
        />
      ) : null}
      </VoiceErrorBoundary>

      {/* Exercise list */}
      <section>
        <SectionTitle title="Esercizi in sessione" subtitle="Tocca un esercizio per modificare le serie." />
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
                  <span className="pill">{formatVolume(volume)}</span>
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
