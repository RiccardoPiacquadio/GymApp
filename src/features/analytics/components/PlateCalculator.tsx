import { useState, useMemo } from "react";

const STANDARD_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_WEIGHTS = [20, 15, 10];

const calculatePlates = (targetWeight: number, barWeight: number): number[] => {
  let remaining = (targetWeight - barWeight) / 2;
  if (remaining <= 0) return [];

  const plates: number[] = [];
  for (const plate of STANDARD_PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining -= plate;
    }
  }
  return plates;
};

export const PlateCalculator = () => {
  const [targetStr, setTargetStr] = useState("");
  const [barWeight, setBarWeight] = useState(20);

  const target = Number(targetStr);
  const plates = useMemo(
    () => (Number.isFinite(target) && target > barWeight ? calculatePlates(target, barWeight) : []),
    [target, barWeight]
  );
  const achievedWeight = barWeight + plates.reduce((s, p) => s + p, 0) * 2;

  return (
    <section className="app-panel space-y-4 p-5">
      <h3 className="text-sm font-semibold">Calcolatore dischi</h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink/60">Peso target (kg)</span>
          <input
            className="field-input"
            inputMode="decimal"
            placeholder="es. 100"
            value={targetStr}
            onChange={(e) => setTargetStr(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink/60">Bilanciere (kg)</span>
          <div className="flex rounded-xl bg-ink/[0.04] p-0.5">
            {BAR_WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                className={`flex-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all ${
                  barWeight === w ? "bg-ink text-white shadow-sm" : "text-ink/40"
                }`}
                onClick={() => setBarWeight(w)}
              >
                {w}
              </button>
            ))}
          </div>
        </label>
      </div>

      {plates.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-ink/50">Per lato ({achievedWeight} kg totale):</p>
          <div className="flex flex-wrap gap-2">
            {plates.map((plate, i) => {
              const size = Math.max(28, Math.min(56, plate * 2.2));
              return (
                <div
                  key={i}
                  className="flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-flare font-bold text-white shadow-sm"
                  style={{ width: size, height: size, fontSize: size > 36 ? 12 : 10 }}
                >
                  {plate}
                </div>
              );
            })}
          </div>
        </div>
      ) : target > barWeight ? (
        <p className="text-xs text-ink/40">Nessuna combinazione trovata.</p>
      ) : null}
    </section>
  );
};
