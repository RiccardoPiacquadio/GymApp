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
    <section className="app-panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Gruppi muscolari</h3>
        <div className="flex rounded-xl bg-ink/[0.04] p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              className={`rounded-lg px-3 py-1 text-[10px] font-semibold transition-all duration-200 ${
                days === opt.days
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/40 hover:text-ink/60"
              }`}
              onClick={() => setDays(opt.days)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((item) => (
          <div key={item.group} className="flex items-center gap-3">
            <span className="w-[60px] shrink-0 text-[11px] font-medium text-ink/50">{item.group}</span>
            <div className="relative h-[18px] flex-1 overflow-hidden rounded-full bg-ink/[0.04]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-flare transition-all duration-500 ease-out"
                style={{ width: `${Math.max((item.count / max) * 100, item.count > 0 ? 8 : 0)}%` }}
              />
            </div>
            <span className="w-5 text-right text-[11px] font-bold tabular-nums text-ink/70">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
