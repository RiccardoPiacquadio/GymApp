import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { formatDateTime } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { SessionSummaryCard } from "../../features/sessions/components/SessionSummaryCard";
import { getSessionExercises, getSessionSummary, getWorkoutSessionById } from "../../features/sessions/services/sessionRepository";

export const WorkoutDetailPage = () => {
  const { sessionId } = useParams();
  const session = useLiveQuery(async () => (sessionId ? await getWorkoutSessionById(sessionId) : undefined), [sessionId]);
  const bundles = useLiveQuery(async () => (sessionId ? await getSessionExercises(sessionId) : []), [sessionId], []);
  const summary = useLiveQuery(
    async () => (sessionId ? await getSessionSummary(sessionId) : { totalExercises: 0, totalSets: 0, totalVolume: 0 }),
    [sessionId],
    { totalExercises: 0, totalSets: 0, totalVolume: 0 }
  );

  if (!session) {
    return <div className="app-panel p-4 text-sm text-ink/70">Sessione non trovata.</div>;
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Dettaglio sessione"
        subtitle={formatDateTime(session.startedAt)}
        action={
          <div className="flex gap-2">
            <Link className="primary-button px-3 py-2 text-xs" to={`/history/${session.id}/exercises`}>
              Modifica allenamento
            </Link>
            <Link className="secondary-button px-3 py-2 text-xs" to="/history">
              Torna allo storico
            </Link>
          </div>
        }
      />
      <SessionSummaryCard {...summary} />
      <div className="space-y-3">
        {bundles.map((bundle) => (
          <Link key={bundle.sessionExercise.id} to={`/history/${session.id}/exercises/${bundle.sessionExercise.id}`} className="app-panel block p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold">{bundle.exercise.canonicalName}</p>
                <p className="mt-1 text-sm text-ink/70">{bundle.sets.length} serie</p>
              </div>
              <span className="pill">max {Math.max(...bundle.sets.map((entry) => entry.weight), 0)} kg</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
