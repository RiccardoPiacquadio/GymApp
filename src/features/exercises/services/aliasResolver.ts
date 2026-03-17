import { db } from "../../../db";
import { normalizeExerciseInput } from "../../../lib/normalize";

type MatchCandidate = {
  canonicalExerciseId: string;
  matchedAlias: string;
  score: number;
};

export type AliasResolution = {
  canonicalExerciseId?: string;
  matchedAlias?: string;
  confidence: number;
  isAmbiguous: boolean;
  candidateExerciseIds?: string[];
  reason?: "ambiguous" | "not_found";
};

const toLooseText = (value: string) => value.replace(/\s+/g, "");

const getEditDistance = (left: string, right: string) => {
  const matrix = Array.from({ length: left.length + 1 }, (_, rowIndex) =>
    Array.from({ length: right.length + 1 }, (_, columnIndex) =>
      rowIndex === 0 ? columnIndex : columnIndex === 0 ? rowIndex : 0
    )
  );

  for (let rowIndex = 1; rowIndex <= left.length; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= right.length; columnIndex += 1) {
      const cost = left[rowIndex - 1] === right[columnIndex - 1] ? 0 : 1;
      matrix[rowIndex][columnIndex] = Math.min(
        matrix[rowIndex - 1][columnIndex] + 1,
        matrix[rowIndex][columnIndex - 1] + 1,
        matrix[rowIndex - 1][columnIndex - 1] + cost
      );
    }
  }

  return matrix[left.length][right.length];
};

const scoreAliasMatch = (normalizedInput: string, normalizedAlias: string) => {
  if (!normalizedInput || !normalizedAlias) {
    return 0;
  }

  if (normalizedInput === normalizedAlias) {
    return 1;
  }

  const looseInput = toLooseText(normalizedInput);
  const looseAlias = toLooseText(normalizedAlias);

  if (looseInput === looseAlias) {
    return 0.96;
  }

  if (normalizedAlias.includes(normalizedInput) || normalizedInput.includes(normalizedAlias)) {
    return normalizedInput.length >= 4 ? 0.76 : 0.44;
  }

  const maxLength = Math.max(looseInput.length, looseAlias.length);
  const distance = getEditDistance(looseInput, looseAlias);

  if (maxLength >= 6 && distance <= 1) {
    return 0.87;
  }

  if (maxLength >= 9 && distance <= 2) {
    return 0.8;
  }

  return 0;
};

const getBestResolutionFromCandidates = (candidates: MatchCandidate[]): AliasResolution | null => {
  if (candidates.length === 0) {
    return null;
  }

  const sortedCandidates = [...candidates].sort((left, right) => right.score - left.score);
  const candidateExerciseIds = [...new Set(sortedCandidates.map((candidate) => candidate.canonicalExerciseId))];
  const [bestCandidate] = sortedCandidates;
  const secondCandidate = sortedCandidates[1];

  if (
    candidateExerciseIds.length === 1 ||
    (bestCandidate.score >= 0.84 && (!secondCandidate || bestCandidate.score - secondCandidate.score >= 0.12))
  ) {
    return {
      canonicalExerciseId: bestCandidate.canonicalExerciseId,
      matchedAlias: bestCandidate.matchedAlias,
      confidence: bestCandidate.score,
      isAmbiguous: false
    };
  }

  return {
    confidence: Math.max(0.25, bestCandidate.score * 0.6),
    isAmbiguous: true,
    candidateExerciseIds: candidateExerciseIds.slice(0, 5),
    reason: "ambiguous"
  };
};

export const resolveExerciseAlias = async (input: string): Promise<AliasResolution> => {
  const normalizedInput = normalizeExerciseInput(input);
  if (!normalizedInput) {
    return { confidence: 0, isAmbiguous: false, reason: "not_found" };
  }

  const aliases = await db.exerciseAliases.toArray();
  const aliasCandidates = aliases
    .map((alias) => ({
      canonicalExerciseId: alias.canonicalExerciseId,
      matchedAlias: alias.aliasText,
      score: scoreAliasMatch(normalizedInput, alias.normalizedAliasText)
    }))
    .filter((candidate) => candidate.score > 0);

  const aliasResolution = getBestResolutionFromCandidates(aliasCandidates);
  if (aliasResolution) {
    return aliasResolution;
  }

  const canonicals = await db.exerciseCanonicals.toArray();
  const canonicalCandidates = canonicals
    .map((canonical) => ({
      canonicalExerciseId: canonical.id,
      matchedAlias: canonical.canonicalName,
      score: scoreAliasMatch(normalizedInput, normalizeExerciseInput(canonical.canonicalName))
    }))
    .filter((candidate) => candidate.score > 0);

  const canonicalResolution = getBestResolutionFromCandidates(canonicalCandidates);
  if (canonicalResolution) {
    return canonicalResolution;
  }

  return {
    confidence: 0,
    isAmbiguous: false,
    reason: "not_found"
  };
};
