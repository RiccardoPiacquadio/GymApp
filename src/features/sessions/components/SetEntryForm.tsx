import { useState } from "react";

type SetEntryFormProps = {
  defaultValues?: {
    reps?: number;
    weight?: number;
  };
  submitLabel?: string;
  onSubmit: (payload: { reps: number; weight: number }) => Promise<void>;
};

export const SetEntryForm = ({ defaultValues, submitLabel = "Aggiungi serie", onSubmit }: SetEntryFormProps) => {
  const [weight, setWeight] = useState(String(defaultValues?.weight ?? ""));
  const [reps, setReps] = useState(String(defaultValues?.reps ?? ""));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const weightNumber = Number(weight);
    const repsNumber = Number(reps);
    if (!Number.isFinite(weightNumber) || !Number.isFinite(repsNumber) || weightNumber <= 0 || repsNumber <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reps: repsNumber, weight: weightNumber });
      setWeight(String(weightNumber));
      setReps(String(repsNumber));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="app-panel space-y-4 p-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Peso (kg)</span>
          <input
            className="field-input"
            inputMode="decimal"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Ripetizioni</span>
          <input
            className="field-input"
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
        </label>
      </div>
      <button className="primary-button w-full" disabled={isSubmitting} type="submit">
        {submitLabel}
      </button>
    </form>
  );
};
