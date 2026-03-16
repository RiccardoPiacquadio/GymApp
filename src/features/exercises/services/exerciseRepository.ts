import { db } from "../../../db";
import { normalizeExerciseInput } from "../../../lib/normalize";

export const getExerciseById = (exerciseId: string) => db.exerciseCanonicals.get(exerciseId);

export const getAllExercises = () => db.exerciseCanonicals.orderBy("canonicalName").toArray();

export const getAliasesForExercise = (canonicalExerciseId: string) =>
  db.exerciseAliases.where("canonicalExerciseId").equals(canonicalExerciseId).toArray();

export const searchExercises = async (query: string) => {
  const normalizedQuery = normalizeExerciseInput(query);
  const [canonicals, aliases] = await Promise.all([
    db.exerciseCanonicals.toArray(),
    db.exerciseAliases.toArray()
  ]);

  if (!normalizedQuery) {
    return canonicals.sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
  }

  const aliasMatchIds = new Set(
    aliases
      .filter((alias) => alias.normalizedAliasText.includes(normalizedQuery))
      .map((alias) => alias.canonicalExerciseId)
  );

  return canonicals
    .filter(
      (exercise) =>
        normalizeExerciseInput(exercise.canonicalName).includes(normalizedQuery) ||
        aliasMatchIds.has(exercise.id)
    )
    .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));
};
