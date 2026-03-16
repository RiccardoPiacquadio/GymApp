import type { ExerciseCanonical } from "../../../types";

type ExerciseListProps = {
  exercises: ExerciseCanonical[];
  aliasMap?: Record<string, string[]>;
  onSelect: (exercise: ExerciseCanonical) => void | Promise<void>;
};

export const ExerciseList = ({ exercises, aliasMap, onSelect }: ExerciseListProps) => (
  <div className="space-y-3">
    {exercises.map((exercise) => (
      <button
        key={exercise.id}
        type="button"
        onClick={() => onSelect(exercise)}
        className="app-panel w-full p-4 text-left transition hover:border-slate-300"
      >
        <p className="text-base font-semibold">{exercise.canonicalName}</p>
        <p className="mt-1 text-sm text-slate-500">
          {(aliasMap?.[exercise.id] ?? []).slice(0, 3).join(" • ") || exercise.slug}
        </p>
      </button>
    ))}
  </div>
);
