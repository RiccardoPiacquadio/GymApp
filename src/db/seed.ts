import { seedExercises } from "./seedExercises";
import type { ExerciseAlias, ExerciseCanonical } from "../types";
import { toIsoNow } from "../lib/dates";
import { createId } from "../lib/ids";
import { normalizeExerciseInput } from "../lib/normalize";
import { db } from "./schema";
import { invalidateAliasCache } from "../features/exercises/services/aliasResolver";

const italianHints = new Set([
  "addominali",
  "alzate",
  "bilanciere",
  "bulgari",
  "cavi",
  "con",
  "curl",
  "manubri",
  "multipower",
  "panca",
  "polpacci",
  "presa",
  "pulley",
  "rematore",
  "scrollate",
  "smith",
  "spalle",
  "stacco",
  "squat",
  "trazioni",
  "tricipiti"
]);

const englishHints = new Set([
  "abs",
  "barbell",
  "bench",
  "biceps",
  "cable",
  "calf",
  "chin",
  "chest",
  "close",
  "crossover",
  "curl",
  "deadlift",
  "dip",
  "dumbbell",
  "face",
  "french",
  "hammer",
  "high",
  "incline",
  "lat",
  "lateral",
  "leg",
  "low",
  "machine",
  "military",
  "overhead",
  "press",
  "pull",
  "pulldown",
  "push",
  "raise",
  "rear",
  "romanian",
  "row",
  "seal",
  "seated",
  "shoulder",
  "skull",
  "smith",
  "spider",
  "sumo",
  "supported",
  "triceps"
]);

const detectAliasLanguage = (aliasText: string): "it" | "en" => {
  const tokens = normalizeExerciseInput(aliasText).split(" ");
  if (tokens.some((token) => italianHints.has(token))) {
    return "it";
  }
  if (tokens.some((token) => englishHints.has(token))) {
    return "en";
  }
  return "en";
};

export const seedDatabase = async () => {
  const now = toIsoNow();
  const [existingCanonicals, existingAliases] = await Promise.all([
    db.exerciseCanonicals.toArray(),
    db.exerciseAliases.toArray()
  ]);

  const existingCanonicalsBySlug = new Map(existingCanonicals.map((canonical) => [canonical.slug, canonical]));
  const existingCanonicalsById = new Map(existingCanonicals.map((canonical) => [canonical.id, canonical]));
  const activeSlugs = new Set(seedExercises.map((exercise) => exercise.slug));

  const canonicalsToPut: ExerciseCanonical[] = [];
  const aliasesToAdd: ExerciseAlias[] = [];
  const aliasIdsToDelete: string[] = [];

  const canonicalIdBySlug = new Map<string, string>();
  const expectedAliasesBySlug = new Map<string, Map<string, string>>();

  for (const exercise of seedExercises) {
    const existingCanonical = existingCanonicalsBySlug.get(exercise.slug);
    const canonicalId = existingCanonical?.id ?? createId();
    canonicalIdBySlug.set(exercise.slug, canonicalId);

    canonicalsToPut.push({
      id: canonicalId,
      canonicalName: exercise.canonicalName,
      slug: exercise.slug,
      isSelectable: true,
      createdAt: existingCanonical?.createdAt ?? now,
      updatedAt: now
    });

    const uniqueAliases = new Map<string, string>();
    for (const aliasText of exercise.aliases) {
      const normalizedAliasText = normalizeExerciseInput(aliasText);
      if (!normalizedAliasText || uniqueAliases.has(normalizedAliasText)) {
        continue;
      }
      uniqueAliases.set(normalizedAliasText, aliasText);
    }

    expectedAliasesBySlug.set(exercise.slug, uniqueAliases);
  }

  for (const canonical of existingCanonicals) {
    if (activeSlugs.has(canonical.slug)) {
      continue;
    }

    canonicalsToPut.push({
      ...canonical,
      isSelectable: false,
      updatedAt: now
    });
  }

  const existingAliasKeys = new Set(
    existingAliases.map((alias) => `${alias.canonicalExerciseId}:${alias.normalizedAliasText}`)
  );

  for (const exercise of seedExercises) {
    const canonicalId = canonicalIdBySlug.get(exercise.slug);
    const aliasesForSlug = expectedAliasesBySlug.get(exercise.slug);
    if (!canonicalId || !aliasesForSlug) {
      continue;
    }

    for (const [normalizedAliasText, aliasText] of aliasesForSlug.entries()) {
      const aliasKey = `${canonicalId}:${normalizedAliasText}`;
      if (existingAliasKeys.has(aliasKey)) {
        continue;
      }

      aliasesToAdd.push({
        id: createId(),
        canonicalExerciseId: canonicalId,
        aliasText,
        normalizedAliasText,
        language: detectAliasLanguage(aliasText),
        createdAt: now
      });
    }
  }

  for (const alias of existingAliases) {
    const canonical = existingCanonicalsById.get(alias.canonicalExerciseId);
    if (!canonical) {
      aliasIdsToDelete.push(alias.id);
      continue;
    }

    if (!activeSlugs.has(canonical.slug)) {
      aliasIdsToDelete.push(alias.id);
      continue;
    }

    const aliasesForSlug = expectedAliasesBySlug.get(canonical.slug);
    if (!aliasesForSlug?.has(alias.normalizedAliasText)) {
      aliasIdsToDelete.push(alias.id);
    }
  }

  await db.transaction("rw", db.exerciseCanonicals, db.exerciseAliases, async () => {
    await db.exerciseCanonicals.bulkPut(canonicalsToPut);
    if (aliasIdsToDelete.length > 0) {
      await db.exerciseAliases.bulkDelete(aliasIdsToDelete);
    }
    if (aliasesToAdd.length > 0) {
      await db.exerciseAliases.bulkAdd(aliasesToAdd);
    }
  });

  invalidateAliasCache();
};
