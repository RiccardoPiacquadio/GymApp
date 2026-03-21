import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getMuscleGroupFrequency } from "../services/analyticsService";

const PERIOD_OPTIONS = [
  { label: "7g", days: 7 },
  { label: "14g", days: 14 },
  { label: "30g", days: 30 },
] as const;

export const MuscleGroupCard = ({ userId }: { userId: string }) => {
  const [days, setDays] = useState(7);

  const data = useLiveQuery(
    () => getMuscleGroupFrequency(userId, days),
    [userId, days],
    []
  );

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <section className="app-panel space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Esercizi per gruppo muscolare</h3>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                days === opt.days
                  ? "bg-ink text-white"
                  : "bg-mist text-ink/70 hover:bg-ink/10"
              }`}
              onClick={() => setDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.group} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-ink/70">{item.group}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-mist">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-accent transition-all duration-300"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right text-xs font-semibold tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
