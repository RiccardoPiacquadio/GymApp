import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { db } from "../../db";
import { SectionTitle } from "../../components/common/SectionTitle";
import { SetEntryForm } from "../../features/sessions/components/SetEntryForm";
import { SetEntryTable } from "../../features/sessions/components/SetEntryTable";
import {
  addSetEntry,
  deleteSetEntry,
  getLatestExerciseSnapshot,
  updateSetEntry
} from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import type { SetEntry } from "../../types";

export const ExerciseLogPage = () => {
  const { sessionExerciseId } = useParams();
  const { activeProfileId } = useActiveProfile();
  const [editingEntry, setEditingEntry] = useState<SetEntry | null>(null);

  const detail = useLiveQuery(
    async () => {
      if (!sessionExerciseId) {
        return null;
      }
      const sessionExercise = await db.sessionExercises.get(sessionExerciseId);
      if (!sessionExercise) {
        return null;
      }
      const [exercise, sets] = await Promise.all([
        db.exerciseCanonicals.get(sessionExercise.canonicalExerciseId),
        db.setEntries.where("sessionExerciseId").equals(sessionExercise.id).sortBy("setNumber")
      ]);
      return exercise ? { sessionExercise, exercise, sets } : null;
    },
    [sessionExerciseId]
  );

  const latestSnapshot = useLiveQuery(
    async () =>
      activeProfileId && detail
        ? await getLatestExerciseSnapshot(activeProfileId, detail.exercise.id)
        : null,
    [activeProfileId, detail?.exercise.id],
    null
  );

  const defaultValues = useMemo(() => {
    if (editingEntry) {
      return { weight: editingEntry.weight, reps: editingEntry.reps };
    }
    const latestCurrentSet = detail?.sets[detail.sets.length - 1];
    if (latestCurrentSet) {
      return { weight: latestCurrentSet.weight, reps: latestCurrentSet.reps };
    }
    if (latestSnapshot) {
      return { weight: latestSnapshot.lastWeight, reps: latestSnapshot.lastReps };
    }
    return undefined;
  }, [detail?.sets, editingEntry, latestSnapshot]);

  const handleSubmit = async (payload: { reps: number; weight: number }) => {
    if (!detail) {
      return;
    }
    if (editingEntry) {
      await updateSetEntry(editingEntry.id, payload);
      setEditingEntry(null);
      return;
    }
    await addSetEntry({
      sessionExerciseId: detail.sessionExercise.id,
      reps: payload.reps,
      weight: payload.weight,
      inputMode: "manual"
    });
  };

  if (!detail) {
    return <div className="app-panel p-4 text-sm text-ink/70">Esercizio non trovato.</div>;
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={detail.exercise.canonicalName}
        subtitle="Aggiungi serie manualmente. Le ultime performance vengono usate come suggerimento."
        action={
          <Link className="secondary-button px-3 py-2 text-xs" to="/workout/active">
            Torna sessione
          </Link>
        }
      />

      {latestSnapshot ? (
        <div className="app-panel flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-semibold">Ultimo storico</p>
            <p className="mt-1 text-sm text-ink/70">{latestSnapshot.lastPerformedAt}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{latestSnapshot.lastWeight} kg x {latestSnapshot.lastReps}</p>
          </div>
        </div>
      ) : null}

      {editingEntry ? (
        <div className="app-panel flex items-center justify-between gap-4 p-4 text-sm">
          <p>Stai modificando la serie {editingEntry.setNumber}.</p>
          <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => setEditingEntry(null)}>
            Annulla modifica
          </button>
        </div>
      ) : null}

      <SetEntryForm
        key={`${editingEntry?.id ?? "new"}-${defaultValues?.weight ?? ""}-${defaultValues?.reps ?? ""}`}
        defaultValues={defaultValues}
        submitLabel={editingEntry ? "Salva modifica" : "Aggiungi serie"}
        onSubmit={handleSubmit}
      />

      <SetEntryTable
        setEntries={detail.sets}
        editingId={editingEntry?.id}
        onEdit={setEditingEntry}
        onDelete={deleteSetEntry}
      />
    </div>
  );
};

