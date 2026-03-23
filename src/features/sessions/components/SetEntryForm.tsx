import { useState } from "react";
import type { SetType } from "../../../types";

const SET_TYPES: { value: SetType; label: string }[] = [
  { value: "working", label: "Lavoro" },
  { value: "warmup", label: "Riscaldamento" },
  { value: "dropset", label: "Drop set" },
  { value: "amrap", label: "AMRAP" },
  { value: "failure", label: "Cedimento" },
];

type SetEntryFormProps = {
  defaultValues?: {
    reps?: number;
    weight?: number;
    setType?: SetType;
    rpe?: number;
    note?: string;
  };
  /** Ghost text showing previous session's values */
  previousPerformance?: {
    weight: number;
    reps: number;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: { reps: number; weight: number; setType?: SetType; rpe?: number; note?: string }) => Promise<void>;
};

export const SetEntryForm = ({ defaultValues, previousPerformance, submitLabel = "Aggiungi serie", onSubmit }: SetEntryFormProps) => {
  const [weight, setWeight] = useState(String(defaultValues?.weight ?? ""));
  const [reps, setReps] = useState(String(defaultValues?.reps ?? ""));
  const [setType, setSetType] = useState<SetType>(defaultValues?.setType ?? "working");
  const [rpe, setRpe] = useState(String(defaultValues?.rpe ?? ""));
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const weightNumber = Number(weight);
    const repsNumber = Number(reps);
    if (!Number.isFinite(weightNumber) || !Number.isFinite(repsNumber) || weightNumber <= 0 || repsNumber <= 0) {
      setValidationError("Inserisci peso e ripetizioni validi (> 0).");
      return;
    }
    setValidationError(null);

    const rpeNumber = rpe ? Number(rpe) : undefined;

    setIsSubmitting(true);
    try {
      await onSubmit({
        reps: repsNumber,
        weight: weightNumber,
        setType: setType !== "working" ? setType : undefined,
        rpe: rpeNumber && rpeNumber >= 1 && rpeNumber <= 10 ? rpeNumber : undefined,
        note: note.trim() || undefined
      });
      setWeight(String(weightNumber));
      setReps(String(repsNumber));
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="app-panel space-y-3 p-4" onSubmit={handleSubmit}>
      {/* Previous performance hint */}
      {previousPerformance && !defaultValues?.weight ? (
        <div className="flex items-center gap-2 rounded-xl bg-accent/[0.06] px-3 py-2 text-xs text-ink/60">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0">
            <circle cx="10" cy="10" r="8" />
            <polyline points="10,5 10,10 13.5,13.5" />
          </svg>
          Ultima volta: {previousPerformance.weight} kg x {previousPerformance.reps} rep
        </div>
      ) : null}

      {/* Weight & Reps */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink/80">Peso (kg)</span>
          <input
            className="field-input"
            inputMode="decimal"
            placeholder={previousPerformance ? String(previousPerformance.weight) : ""}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink/80">Ripetizioni</span>
          <input
            className="field-input"
            inputMode="numeric"
            placeholder={previousPerformance ? String(previousPerformance.reps) : ""}
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
        </label>
      </div>

      {/* Set type pills */}
      <div className="flex gap-1.5">
        {SET_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
              setType === t.value
                ? "bg-ink text-white shadow-sm"
                : "bg-ink/[0.04] text-ink/40 hover:text-ink/60"
            }`}
            onClick={() => setSetType(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Extra fields toggle */}
      <button
        type="button"
        className="text-[11px] font-medium text-ink/40 hover:text-ink/60"
        onClick={() => setShowExtra(!showExtra)}
      >
        {showExtra ? "Nascondi RPE e note" : "RPE e note..."}
      </button>

      {showExtra ? (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink/60">RPE (1-10)</span>
            <div className="flex gap-1">
              {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all ${
                    rpe === String(v)
                      ? "bg-accent text-white"
                      : "bg-ink/[0.04] text-ink/50"
                  }`}
                  onClick={() => setRpe(rpe === String(v) ? "" : String(v))}
                >
                  {v}
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-ink/60">Note</span>
            <input
              className="field-input text-sm"
              placeholder="es. Usato cintura, ginocchio dolente..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {validationError ? (
        <p className="text-xs font-medium text-red-500">{validationError}</p>
      ) : null}
      <button className="primary-button w-full" disabled={isSubmitting} type="submit">
        {submitLabel}
      </button>
    </form>
  );
};
