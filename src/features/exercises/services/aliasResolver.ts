import { db } from "../../../db";
import { normalizeExerciseInput } from "../../../lib/normalize";

export type AliasResolution = {
  canonicalExerciseId?: string;
  matchedAlias?: string;
  confidence: number;
};

export const resolveExerciseAlias = async (input: string): Promise<AliasResolution> => {
  const normalized = normalizeExerciseInput(input);
  if (!normalized) {
    return { confidence: 0 };
  }

  const exactAlias = await db.exerciseAliases.where("normalizedAliasText").equals(normalized).first();
  if (exactAlias) {
    return {
      canonicalExerciseId: exactAlias.canonicalExerciseId,
      matchedAlias: exactAlias.aliasText,
      confidence: 1
    };
  }

  const aliases = await db.exerciseAliases.toArray();
  const partial = aliases.find((alias) => normalized.includes(alias.normalizedAliasText));
  if (partial) {
    return {
      canonicalExerciseId: partial.canonicalExerciseId,
      matchedAlias: partial.aliasText,
      confidence: 0.72
    };
  }

  const canonicals = await db.exerciseCanonicals.toArray();
  const canonical = canonicals.find((item) =>
    normalizeExerciseInput(item.canonicalName).includes(normalized)
  );
  if (canonical) {
    return {
      canonicalExerciseId: canonical.id,
      matchedAlias: canonical.canonicalName,
      confidence: 0.66
    };
  }

  return { confidence: 0 };
};
