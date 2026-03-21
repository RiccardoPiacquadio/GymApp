import type { SetEntry } from "../../../types";

type SetEntryTableProps = {
  setEntries: SetEntry[];
  editingId?: string;
  onEdit: (setEntry: SetEntry) => void;
  onDelete: (setEntryId: string) => Promise<void>;
};

const setTypeLabel: Record<string, string> = {
  warmup: "W",
  dropset: "D",
  amrap: "A",
  failure: "F",
};

export const SetEntryTable = ({ setEntries, editingId, onEdit, onDelete }: SetEntryTableProps) => (
  <div className="app-panel overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-ink/70">
        <tr>
          <th className="px-3 py-3 text-left font-medium">Serie</th>
          <th className="px-3 py-3 text-left font-medium">Peso</th>
          <th className="px-3 py-3 text-left font-medium">Reps</th>
          <th className="px-3 py-3 text-left font-medium">RPE</th>
          <th className="px-3 py-3 text-right font-medium">Azioni</th>
        </tr>
      </thead>
      <tbody>
        {setEntries.map((entry) => (
          <tr key={entry.id} className={editingId === entry.id ? "bg-amber-50" : "bg-white"}>
            <td className="px-3 py-3 font-medium">
              <div className="flex items-center gap-1.5">
                {entry.setType && entry.setType !== "working" ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-ink/[0.08] text-[9px] font-bold text-ink/60">
                    {setTypeLabel[entry.setType] ?? ""}
                  </span>
                ) : null}
                {entry.setNumber}
              </div>
            </td>
            <td className="px-3 py-3">{entry.weight} kg</td>
            <td className="px-3 py-3">{entry.reps}</td>
            <td className="px-3 py-3 text-ink/50">{entry.rpe ?? ""}</td>
            <td className="px-3 py-3">
              <div className="flex justify-end gap-2">
                <button className="secondary-button px-3 py-2 text-xs" type="button" onClick={() => onEdit(entry)}>
                  Modifica
                </button>
                <button className="danger-button px-3 py-2 text-xs" type="button" onClick={() => void onDelete(entry.id)}>
                  Elimina
                </button>
              </div>
            </td>
          </tr>
        ))}
        {setEntries.some((e) => e.note) ? (
          <tr>
            <td colSpan={5} className="px-3 pb-3 pt-1">
              {setEntries.filter((e) => e.note).map((e) => (
                <p key={e.id} className="text-[10px] text-ink/40">
                  Serie {e.setNumber}: {e.note}
                </p>
              ))}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  </div>
);
