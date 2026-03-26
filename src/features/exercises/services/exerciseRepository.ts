import { db } from "../../../db";
import { normalizeExerciseInput } from "../../../lib/normalize";
import type { ExerciseCanonical } from "../../../types";

const isSelectableExercise = (exercise: ExerciseCanonical) => exercise.isSelectable !== false;

export const getExerciseById = (exerciseId: string) => db.exerciseCanonicals.get(exerciseId);

export const getAllExercises = async () => {
  const exercises = await db.exerciseCanonicals.orderBy("canonicalName").toArray();
  return exercises.filter(isSelectableExercise);
};

export const getAllAliases = async () => {
  const [aliases, canonicals] = await Promise.all([
    db.exerciseAliases.toArray(),
    db.exerciseCanonicals.toArray()
  ]);
  const selectableIds = new Set(canonicals.filter(isSelectableExercise).map((exercise) => exercise.id));
  return aliases.filter((alias) => selectableIds.has(alias.canonicalExerciseId));
};

export const getAliasesForExercise = (canonicalExerciseId: string) =>
  db.exerciseAliases.where("canonicalExerciseId").equals(canonicalExerciseId).toArray();

export const searchExercises = async (query: string) => {
  const normalizedQuery = normalizeExerciseInput(query);
  const [canonicals, aliases] = await Promise.all([
    db.exerciseCanonicals.toArray(),
    db.exerciseAliases.toArray()
  ]);

  const selectableCanonicals = canonicals.filter(isSelectableExercise);
  const selectableIds = new Set(selectableCanonicals.map((exercise) => exercise.id));
  const selectableAliases = aliases.filter((alias) => selectableIds.has(alias.canonicalExerciseId));

  if (!normalizedQuery) {
    return selectableCanonicals.sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
  }

  const aliasMatchIds = new Set(
    selectableAliases
      .filter((alias) => alias.normalizedAliasText.includes(normalizedQuery))
      .map((alias) => alias.canonicalExerciseId)
  );

  return selectableCanonicals
    .filter(
      (exercise) =>
        normalizeExerciseInput(exercise.canonicalName).includes(normalizedQuery) ||
        aliasMatchIds.has(exercise.id)
    )
    .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
};
