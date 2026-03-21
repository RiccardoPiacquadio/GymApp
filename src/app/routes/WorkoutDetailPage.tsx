import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatDateTime } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { useConfirm } from "../../hooks/useConfirm";
import {
  deleteSessionExercise,
  deleteWorkoutSession,
  getSessionExercises,
  getSessionSummary,
  getWorkoutSessionById
} from "../../features/sessions/services/sessionRepository";

export const WorkoutDetailPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();

  const session = useLiveQuery(
    () => (sessionId ? getWorkoutSessionById(sessionId) : undefined),
    [sessionId]
  );
  const bundles = useLiveQuery(
    () => (sessionId ? getSessionExercises(sessionId) : []),
    [sessionId],
    []
  );
  const summary = useLiveQuery(
    () => (sessionId ? getSessionSummary(sessionId) : { totalExercises: 0, totalSets: 0, totalVolume: 0 }),
    [sessionId],
    { totalExercises: 0, totalSets: 0, totalVolume: 0 }
  );

  const handleDeleteSession = useCallback(async () => {
    if (!sessionId) return;
    const ok = await confirm({
      title: "Elimina allenamento",
      message: "Vuoi eliminare questo allenamento? Tutti gli esercizi e le serie verranno cancellati.",
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (ok) {
      await deleteWorkoutSession(sessionId);
      navigate("/history");
    }
  }, [sessionId, confirm, navigate]);

  const handleDeleteExercise = useCallback(async (exerciseId: string, exerciseName: string) => {
    const ok = await confirm({
      title: "Elimina esercizio",
      message: `Vuoi eliminare ${exerciseName} da questa sessione? Tutte le serie verranno cancellate.`,
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (ok) await deleteSessionExercise(exerciseId);
  }, [confirm]);

  if (!session) {
    return <div className="app-panel p-4 text-sm text-ink/70">Sessione non trovata.</div>;
  }

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <SectionTitle
        title="Dettaglio sessione"
        subtitle={formatDateTime(session.startedAt)}
        action={
          <div className="flex gap-2">
            <Link className="primary-button px-3 py-2 text-xs" to={`/history/${session.id}/exercises`}>
              Aggiungi esercizio
            </Link>
            <button
              type="button"
              className="danger-button px-3 py-2 text-xs"
              onClick={() => void handleDeleteSession()}
            >
              Elimina
            </button>
            <Link className="secondary-button px-3 py-2 text-xs" to="/history">
              Indietro
            </Link>
          </div>
        }
      />
      <SessionSummaryCard {...summary} />
      <div className="space-y-3">
        {bundles.map((bundle) => (
          <div key={bundle.sessionExercise.id} className="app-panel flex items-center gap-3 p-4">
            <Link
              to={`/history/${session.id}/exercises/${bundle.sessionExercise.id}`}
              className="min-w-0 flex-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{bundle.exercise.canonicalName}</p>
                  <p className="mt-1 text-sm text-ink/70">{bundle.sets.length} serie</p>
                </div>
                <span className="pill">max {Math.max(...bundle.sets.map((entry) => entry.weight), 0)} kg</span>
              </div>
            </Link>
            <button
              type="button"
              className="shrink-0 rounded-xl p-2 text-ink/40 transition hover:bg-danger/10 hover:text-danger"
              onClick={() => void handleDeleteExercise(bundle.sessionExercise.id, bundle.exercise.canonicalName)}
              aria-label="Elimina esercizio"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        {bundles.length === 0 ? <div className="app-panel p-4 text-sm text-ink/70">Nessun esercizio in questa sessione.</div> : null}
      </div>
    </div>
  );
};
