import { useCallback, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useParams } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { PRBadge } from "../../features/analytics/components/PRBadge";
import { SetEntryForm } from "../../features/sessions/components/SetEntryForm";
import { SetEntryTable } from "../../features/sessions/components/SetEntryTable";
import { useConfirm } from "../../hooks/useConfirm";
import {
  addSetEntry,
  deleteSetEntry,
  getLatestExerciseSnapshot,
  getSessionExerciseDetail,
  updateSetEntry
} from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import type { SetEntry } from "../../types";

export const ExerciseLogPage = () => {
  const { sessionExerciseId } = useParams();
  const { activeProfileId } = useActiveProfile();
  const { confirm, ConfirmDialog } = useConfirm();
  const [editingEntry, setEditingEntry] = useState<SetEntry | null>(null);

  const detail = useLiveQuery(
    () => sessionExerciseId ? getSessionExerciseDetail(sessionExerciseId) : null,
    [sessionExerciseId]
  );

  const latestSnapshot = useLiveQuery(
    () =>
      activeProfileId && detail
        ? getLatestExerciseSnapshot(activeProfileId, detail.exercise.id)
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

  const handleDeleteSet = useCallback(async (setEntryId: string) => {
    const shouldDelete = await confirm({
      title: "Elimina serie",
      message: "Vuoi eliminare questa serie? L'azione non e' reversibile.",
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (shouldDelete) {
      await deleteSetEntry(setEntryId);
    }
  }, [confirm]);

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

  const isCompletedSession = detail.session.status === "completed";
  const backLink = isCompletedSession ? `/history/${detail.session.id}` : "/workout/active";
  const backLabel = isCompletedSession ? "Torna alla sessione" : "Torna sessione";
  const currentTopWeight = Math.max(...detail.sets.map((s) => s.weight), 0);

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <SectionTitle
        title={
          <span className="flex items-center gap-2">
            {detail.exercise.canonicalName}
            {activeProfileId && currentTopWeight > 0 ? (
              <PRBadge userId={activeProfileId} canonicalExerciseId={detail.exercise.id} currentWeight={currentTopWeight} />
            ) : null}
          </span>
        }
        subtitle={isCompletedSession ? "Puoi correggere anche gli allenamenti gia chiusi." : "Aggiungi serie manualmente."}
        action={
          <Link className="secondary-button px-3 py-2 text-xs" to={backLink}>
            {backLabel}
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
        onDelete={handleDeleteSet}
      />
    </div>
  );
};
