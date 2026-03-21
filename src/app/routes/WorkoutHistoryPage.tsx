import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { formatDate } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { getCompletedSessionsForUser } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

export const WorkoutHistoryPage = () => {
  const { activeProfileId } = useActiveProfile();
  const sessions = useLiveQuery(
    () => (activeProfileId ? getCompletedSessionsForUser(activeProfileId) : []),
    [activeProfileId],
    []
  );

  return (
    <div className="space-y-5">
      <SectionTitle title="Storico allenamenti" subtitle="Sessioni completate." />
      <div className="space-y-3">
        {sessions.map((session) => (
          <Link key={session.id} to={`/history/${session.id}`} className="app-panel block p-4">
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
        ))}
        {sessions.length === 0 ? <div className="app-panel p-4 text-sm text-ink/70">Nessuna sessione completata.</div> : null}
      </div>
    </div>
  );
};

