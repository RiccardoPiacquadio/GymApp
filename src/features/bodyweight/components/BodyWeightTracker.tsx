import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { addBodyWeightEntry, deleteBodyWeightEntry, getBodyWeightEntries } from "../services/bodyWeightRepository";
import { useConfirm } from "../../../hooks/useConfirm";

type BodyWeightTrackerProps = {
  userId: string;
};

export const BodyWeightTracker = ({ userId }: BodyWeightTrackerProps) => {
  const [weightStr, setWeightStr] = useState("");
  const { confirm, ConfirmDialog } = useConfirm();

  const entries = useLiveQuery(
    () => getBodyWeightEntries(userId),
    [userId],
    []
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(weightStr);
    if (!Number.isFinite(weight) || weight <= 0) return;
    await addBodyWeightEntry(userId, weight);
    setWeightStr("");
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Elimina peso",
      message: "Eliminare questa registrazione?",
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (ok) await deleteBodyWeightEntry(id);
  };

  const chartData = entries.map((e) => ({
    label: e.date.slice(5),
    weight: e.weight
  }));

  const latestWeight = entries[entries.length - 1]?.weight;
  const firstWeight = entries[0]?.weight;
  const diff = latestWeight && firstWeight ? latestWeight - firstWeight : null;

  return (
    <section className="space-y-4">
      {ConfirmDialog}
      <div className="app-panel space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Peso corporeo</h3>
          {latestWeight ? (
            <div className="text-right">
              <span className="text-lg font-bold">{latestWeight} kg</span>
              {diff !== null && diff !== 0 ? (
                <span className={`ml-2 text-xs font-medium ${diff > 0 ? "text-danger" : "text-success"}`}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <form className="flex gap-2" onSubmit={handleAdd}>
          <input
            className="field-input flex-1"
            inputMode="decimal"
            placeholder="Peso (kg)"
            value={weightStr}
            onChange={(e) => setWeightStr(e.target.value)}
          />
          <button className="primary-button px-4 text-sm" type="submit">
            Aggiungi
          </button>
        </form>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)" }}
                formatter={(value: number) => [`${value} kg`, "Peso"]}
              />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : null}

        {entries.length > 0 ? (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {[...entries].reverse().slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-ink/[0.03] px-3 py-2 text-xs">
                <span className="text-ink/50">{e.date}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{e.weight} kg</span>
                  <button
                    type="button"
                    className="text-ink/30 hover:text-danger"
                    onClick={() => void handleDelete(e.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
