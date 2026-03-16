import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { FrequencyChart } from "../../features/analytics/components/FrequencyChart";
import { TopWeightChart } from "../../features/analytics/components/TopWeightChart";
import { VolumeChart } from "../../features/analytics/components/VolumeChart";
import {
  getExerciseFrequencySeries,
  getExerciseHistory,
  getExerciseTopWeightSeries,
  getExerciseVolumeSeries
} from "../../features/analytics/services/analyticsService";
import { getExerciseById } from "../../features/exercises/services/exerciseRepository";
import { formatDate } from "../../lib/dates";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

export const ExerciseDetailPage = () => {
  const { exerciseId } = useParams();
  const { activeProfileId } = useActiveProfile();
  const exercise = useLiveQuery(async () => (exerciseId ? await getExerciseById(exerciseId) : undefined), [exerciseId]);
  const volumeSeries = useLiveQuery(
    async () => (activeProfileId && exerciseId ? await getExerciseVolumeSeries(activeProfileId, exerciseId) : []),
    [activeProfileId, exerciseId],
    []
  );
  const topWeightSeries = useLiveQuery(
    async () => (activeProfileId && exerciseId ? await getExerciseTopWeightSeries(activeProfileId, exerciseId) : []),
    [activeProfileId, exerciseId],
    []
  );
  const frequencySeries = useLiveQuery(
    async () => (activeProfileId && exerciseId ? await getExerciseFrequencySeries(activeProfileId, exerciseId) : []),
    [activeProfileId, exerciseId],
    []
  );
  const history = useLiveQuery(
    async () => (activeProfileId && exerciseId ? await getExerciseHistory(activeProfileId, exerciseId) : []),
    [activeProfileId, exerciseId],
    []
  );

  if (!exercise) {
    return <div className="app-panel p-4 text-sm text-slate-500">Esercizio non trovato.</div>;
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={exercise.canonicalName}
        subtitle="Analytics esercizio per il profilo selezionato."
        action={
          <Link className="secondary-button px-3 py-2 text-xs" to="/history">
            Torna allo storico
          </Link>
        }
      />

      {volumeSeries.length > 0 ? <VolumeChart data={volumeSeries} /> : null}
      {topWeightSeries.length > 0 ? <TopWeightChart data={topWeightSeries} /> : null}
      {frequencySeries.length > 0 ? <FrequencyChart data={frequencySeries} /> : null}

      <div className="app-panel p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Storico sessioni</p>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.sessionId} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{formatDate(item.sessionDate)}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.totalSets} serie • {item.totalReps} reps</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{item.volume} vol</p>
                  <p className="text-slate-500">max {item.topWeight} kg</p>
                </div>
              </div>
            </div>
          ))}
          {history.length === 0 ? <p className="text-sm text-slate-500">Nessun dato disponibile.</p> : null}
        </div>
      </div>
    </div>
  );
};
