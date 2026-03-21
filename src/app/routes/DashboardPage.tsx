import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { VolumeChart } from "../../features/analytics/components/VolumeChart";
import { getSessionVolumeSeries } from "../../features/analytics/services/analyticsService";
import {
  getActiveSessionForUser,
  getCompletedSessionsForUser,
  startWorkoutSession
} from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

const formatVolume = (vol: number) =>
  vol >= 1000 ? `${(vol / 1000).toFixed(1)} t` : `${vol} kg`;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { activeProfileId, profile } = useActiveProfile();
  const activeSession = useLiveQuery(
    () => (activeProfileId ? getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );
  const sessions = useLiveQuery(
    () => (activeProfileId ? getCompletedSessionsForUser(activeProfileId) : []),
    [activeProfileId],
    []
  );
  const sessionVolumeSeries = useLiveQuery(
    () => {
      if (!activeProfileId) return [];
      return getSessionVolumeSeries(activeProfileId).then((series) =>
        series.map((item) => ({ label: formatDate(item.sessionDate), value: item.totalVolume, date: item.sessionDate }))
      );
    },
    [activeProfileId],
    []
  );

  const handleStartWorkout = async () => {
    if (!activeProfileId) return;
    await startWorkoutSession(activeProfileId);
    navigate("/workout/active");
  };

  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0);
  const avgExercises = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.totalExercises, 0) / totalSessions)
    : 0;

  return (
    <div className="space-y-5">
      <section className="hero-panel space-y-5 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-chrome">Profilo attivo</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{profile?.displayName ?? "Nessun profilo"}</h2>
          <p className="mt-3 max-w-[26ch] text-sm text-white/85">
            Registra carichi, serie e reps via voce o manualmente.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {activeSession ? (
            <Link className="primary-button" to="/workout/active">Continua workout</Link>
          ) : (
            <button className="primary-button" type="button" onClick={() => void handleStartWorkout()}>
              Inizia allenamento
            </button>
          )}
          <Link className="rounded-2xl border border-white bg-white px-4 py-3 text-center text-sm font-semibold text-ink transition hover:bg-mist" to="/history">
            Vedi storico
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-white/12 bg-accent px-3 py-3 text-white">
            <p className="text-white/80">Sessioni</p>
            <p className="mt-1 text-lg font-semibold text-white">{totalSessions}</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-3 text-ink">
            <p className="text-ink/70">Volume tot.</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatVolume(totalVolume)}</p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-[#1f1f1f] p-3 text-white">
            <p className="text-chrome">Media esercizi</p>
            <p className="mt-1 text-lg font-semibold text-white">{avgExercises}/sessione</p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Ultime sessioni" subtitle="Le sessioni completate piu' recenti." />
        <div className="space-y-3">
          {sessions.slice(0, 4).map((session) => (
            <Link key={session.id} to={`/history/${session.id}`} className="app-panel block p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-ink">{formatDate(session.startedAt)}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {session.totalExercises} esercizi &middot; {session.totalSets} serie
                  </p>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">{formatVolume(session.totalVolume)}</span>
              </div>
            </Link>
          ))}
          {sessions.length === 0 ? <div className="app-panel p-4 text-sm text-ink/70">Nessuna sessione completata.</div> : null}
        </div>
      </section>

      {sessionVolumeSeries.length > 0 ? <VolumeChart data={sessionVolumeSeries} title="Volume sessione nel tempo" /> : null}
    </div>
  );
};
