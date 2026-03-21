import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";

type TrainingCalendarProps = {
  userId: string;
};

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];

const getTrainingDates = async (userId: string): Promise<Set<string>> => {
  const sessions = await db.workoutSessions
    .where({ userId, status: "completed" })
    .toArray();
  return new Set(sessions.map((s) => s.startedAt.slice(0, 10)));
};

export const TrainingCalendar = ({ userId }: TrainingCalendarProps) => {
  const trainingDates = useLiveQuery(
    () => getTrainingDates(userId),
    [userId],
    new Set<string>()
  );

  const { weeks, monthLabel, totalThisMonth } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday=0 based offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: Array<{ date: string; day: number; trained: boolean } | null> = [];
    // Fill empty cells before first day
    for (let i = 0; i < startOffset; i++) days.push(null);

    let count = 0;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const trained = trainingDates.has(dateStr);
      if (trained) count++;
      days.push({ date: dateStr, day: d, trained });
    }

    // Fill rest of last week
    while (days.length % 7 !== 0) days.push(null);

    const w: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7));
    }

    const monthNames = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    return {
      weeks: w,
      monthLabel: `${monthNames[month]} ${year}`,
      totalThisMonth: count
    };
  }, [trainingDates]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="app-panel space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{monthLabel}</h3>
        <span className="text-xs font-medium text-accent">{totalThisMonth} allenamenti</span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="text-[10px] font-medium text-ink/40">{label}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <div
                key={ci}
                className={`flex h-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  !cell
                    ? ""
                    : cell.trained
                      ? "bg-accent text-white shadow-sm"
                      : cell.date === today
                        ? "bg-ink/[0.08] text-ink font-bold ring-1 ring-accent/30"
                        : "text-ink/40"
                }`}
              >
                {cell?.day ?? ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};
