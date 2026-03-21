import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/dates";
import { SectionTitle } from "../../components/common/SectionTitle";
import { MuscleGroupCard } from "../../features/analytics/components/MuscleGroupCard";
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
      {/* Hero panel */}
      <section className="hero-panel space-y-5 p-6">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">Profilo attivo</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{profile?.displayName ?? "Nessun profilo"}</h2>
          <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/60">
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
          <Link className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-ink shadow-sm transition-all duration-200 hover:bg-white/90 active:scale-[0.97]" to="/history">
            Vedi storico
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-white/[0.08] bg-accent/90 px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">Sessioni</p>
            <p className="mt-1 text-xl font-bold text-white">{totalSessions}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-3 py-3 backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">Volume</p>
            <p className="mt-1 text-xl font-bold text-white">{formatVolume(totalVolume)}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.06] px-3 py-3 backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">Media</p>
            <p className="mt-1 text-xl font-bold text-white">{avgExercises}<span className="text-xs font-normal text-white/40">/sess</span></p>
          </div>
        </div>
      </section>

      {/* Recent sessions */}
      <section>
        <SectionTitle title="Ultime sessioni" subtitle="Le sessioni completate piu' recenti." />
        <div className="space-y-2.5">
          {sessions.slice(0, 4).map((session) => (
            <Link key={session.id} to={`/history/${session.id}`} className="app-panel block p-4 transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{formatDate(session.startedAt)}</p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {session.totalExercises} esercizi &middot; {session.totalSets} serie
                  </p>
                </div>
                <span className="pill">{formatVolume(session.totalVolume)}</span>
              </div>
            </Link>
          ))}
          {sessions.length === 0 ? (
            <div className="app-panel p-5 text-center text-sm text-ink/40">
              Nessuna sessione completata.
            </div>
          ) : null}
        </div>
      </section>

      {/* Muscle group card */}
      {activeProfileId ? <MuscleGroupCard userId={activeProfileId} /> : null}

      {/* Volume chart */}
      {sessionVolumeSeries.length > 0 ? <VolumeChart data={sessionVolumeSeries} title="Volume sessione nel tempo" /> : null}
    </div>
  );
};
