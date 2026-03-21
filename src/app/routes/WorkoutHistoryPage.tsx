import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { formatDate } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { useConfirm } from "../../hooks/useConfirm";
import {
  deleteWorkoutSession,
  getCompletedSessionsForUser
} from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

export const WorkoutHistoryPage = () => {
  const { activeProfileId } = useActiveProfile();
  const { confirm, ConfirmDialog } = useConfirm();
  const sessions = useLiveQuery(
    () => (activeProfileId ? getCompletedSessionsForUser(activeProfileId) : []),
    [activeProfileId],
    []
  );

  const handleDelete = useCallback(async (sessionId: string, label: string) => {
    const ok = await confirm({
      title: "Elimina allenamento",
      message: `Vuoi eliminare l'allenamento del ${label}? Tutti gli esercizi e le serie verranno cancellati.`,
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (ok) await deleteWorkoutSession(sessionId);
  }, [confirm]);

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <SectionTitle title="Storico allenamenti" subtitle="Sessioni completate." />
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="app-panel flex items-center gap-3 p-4">
            <Link to={`/history/${session.id}`} className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{formatDate(session.startedAt)}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {session.totalExercises} esercizi &middot; {session.totalSets} serie
                  </p>
                </div>
                <span className="pill">{session.totalVolume >= 1000 ? `${(session.totalVolume / 1000).toFixed(1)}t` : `${session.totalVolume} kg`}</span>
              </div>
            </Link>
            <button
              type="button"
              className="shrink-0 rounded-xl p-2 text-ink/40 transition hover:bg-danger/10 hover:text-danger"
              onClick={() => void handleDelete(session.id, formatDate(session.startedAt))}
              aria-label="Elimina sessione"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        {sessions.length === 0 ? <div className="app-panel p-4 text-sm text-ink/70">Nessuna sessione completata.</div> : null}
      </div>
    </div>
  );
};
