import { useCallback, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { formatVolume } from "../../lib/math";
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

export const ActiveWorkoutPage = () => {
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [voiceHelpOpen, setVoiceHelpOpen] = useState(false);
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
      <div className="app-panel space-y-4 p-5 text-center">
        <svg width="48" height="48" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="mx-auto text-ink/20">
          <rect x="1" y="6" width="3" height="8" rx="1" />
          <rect x="16" y="6" width="3" height="8" rx="1" />
          <rect x="4" y="4" width="3" height="12" rx="1" />
          <rect x="13" y="4" width="3" height="12" rx="1" />
          <line x1="7" y1="10" x2="13" y2="10" />
        </svg>
        <p className="text-lg font-semibold text-ink">Nessun workout in corso</p>
        <p className="text-sm text-ink/50">Inizia un nuovo allenamento dalla dashboard o da un template.</p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link className="primary-button" to="/dashboard">
            Vai alla dashboard
          </Link>
          <Link className="inline-flex items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-ink/[0.03] active:scale-[0.97]" to="/templates">
            I miei template
          </Link>
        </div>
      </div>
    );
  }

  const isPaused = activeSession.status === "paused";

  return (
    <div className={`space-y-5 ${flashFeedback ? "animate-flash" : ""}`}>
      <SectionTitle
        title={isPaused ? "Sessione in pausa" : "Sessione attiva"}
        subtitle={isPaused ? "Riprendi quando sei pronto." : "Aggiungi esercizi e registra le serie."}
      />

      {/* Session timer with pause/resume/close controls */}
      <SessionTimer
        session={activeSession}
        onPause={() => void pauseWorkoutSession(activeSession.id).then(() => voice.setVoiceFeedback("Sessione in pausa."))}
        onResume={() => void resumeWorkoutSession(activeSession.id).then(() => voice.setVoiceFeedback("Sessione ripresa."))}
        onClose={() => void handleComplete()}
      />

      {/* Action buttons — moved to top for quick access */}
      <div className="grid grid-cols-2 gap-3">
        <Link className="primary-button" to="/workout/active/exercises">
          Aggiungi esercizio
        </Link>
        <VoiceCaptureButton state={voice.speechState} onStart={async () => { const ok = await voice.handleVoiceCapture(); if (ok) triggerFlash(); }} />
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
            Vivavoce ON — dì &quot;GYM&quot;
            {voice.handsFreeStatus === "wake_detected" ? " — parla ora" : ""}
          </span>
        ) : (
          "Attiva vivavoce (AirPods / cuffie)"
        )}
      </button>

      {/* Voice commands guide — expandable */}
      <div className="app-panel overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between p-4"
          onClick={() => setVoiceHelpOpen((v) => !v)}
        >
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent">
              <circle cx="10" cy="10" r="8" />
              <line x1="10" y1="9" x2="10" y2="14" />
              <circle cx="10" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
            <span className="text-sm font-semibold text-ink">Come usare la voce</span>
          </div>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`text-ink/30 transition-transform ${voiceHelpOpen ? "rotate-180" : ""}`}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </button>
        {voiceHelpOpen ? (
          <div className="space-y-2.5 border-t border-ink/[0.06] px-4 pb-4 pt-3">
            <p className="text-xs leading-relaxed text-ink/60">
              Premi il <strong className="text-ink/80">microfono</strong> e pronuncia uno di questi comandi:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;panca 80 per 8&rdquo;</span><span className="text-ink/50">→ registra 80kg x 8 reps</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;squat 100x5&rdquo;</span><span className="text-ink/50">→ registra 100kg x 5 reps</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;ancora&rdquo;</span><span className="text-ink/50">→ ripeti l&apos;ultima serie</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;ancora 6&rdquo;</span><span className="text-ink/50">→ stessi kg, 6 reps</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;no 7&rdquo;</span><span className="text-ink/50">→ correggi le reps a 7</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;correggi peso 75&rdquo;</span><span className="text-ink/50">→ correggi il peso</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;cancella&rdquo;</span><span className="text-ink/50">→ elimina l&apos;ultima serie</span></div>
              <div className="flex gap-2"><span className="shrink-0 font-semibold text-accent">&ldquo;chiudi sessione&rdquo;</span><span className="text-ink/50">→ termina il workout</span></div>
            </div>
            <p className="pt-1 text-[10px] text-ink/40">
              Puoi anche dettare più serie: &ldquo;70 per 8, 50 per 7, 90 per 5&rdquo;
            </p>
          </div>
        ) : null}
      </div>

      <SessionSummaryCard {...sessionSummary} />

      {/* Voice context panel — collapsible */}
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
                  Sì, chiudi
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
                  ? "Sto elaborando..."
                  : voice.listeningPhase === "hearing"
                    ? "Ti ascolto, continua..."
                    : voice.pendingSessionClose
                      ? "Dì 'sì' per chiudere, 'no' per annullare"
                      : "In ascolto — parla pure"}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">
              si ferma dopo il silenzio
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
            <div className="app-panel space-y-2 p-5 text-center">
              <p className="text-sm text-ink/50">Nessun esercizio ancora.</p>
              <p className="text-xs text-ink/40">
                Tocca &ldquo;Aggiungi esercizio&rdquo; per cercare nella lista, oppure usa il microfono per dettare direttamente.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
