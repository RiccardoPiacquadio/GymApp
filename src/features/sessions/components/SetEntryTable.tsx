import type { SetEntry } from "../../../types";

type SetEntryTableProps = {
  setEntries: SetEntry[];
  editingId?: string;
  onEdit: (setEntry: SetEntry) => void;
  onDelete: (setEntryId: string) => Promise<void>;
};

export const SetEntryTable = ({ setEntries, editingId, onEdit, onDelete }: SetEntryTableProps) => (
  <div className="app-panel overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-4 py-3 text-left font-medium">Serie</th>
          <th className="px-4 py-3 text-left font-medium">Peso</th>
          <th className="px-4 py-3 text-left font-medium">Reps</th>
          <th className="px-4 py-3 text-right font-medium">Azioni</th>
        </tr>
      </thead>
      <tbody>
        {setEntries.map((entry) => (
          <tr key={entry.id} className={editingId === entry.id ? "bg-amber-50" : "bg-white"}>
            <td className="px-4 py-3 font-medium">{entry.setNumber}</td>
            <td className="px-4 py-3">{entry.weight} kg</td>
            <td className="px-4 py-3">{entry.reps}</td>
            <td className="px-4 py-3">
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
      </tbody>
    </table>
  </div>
);
