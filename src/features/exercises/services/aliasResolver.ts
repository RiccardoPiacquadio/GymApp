import { db } from "../../../db";
import { normalizeExerciseInput } from "../../../lib/normalize";
import type { ExerciseAlias, ExerciseCanonical } from "../../../types";
import {
  AMBIGUOUS_CONFIDENCE_FLOOR,
  AMBIGUOUS_CONFIDENCE_MULTIPLIER,
  DISAMBIGUATION_MIN_SCORE,
  DISAMBIGUATION_SCORE_GAP,
  EDIT_DISTANCE_1_MIN_LENGTH,
  EDIT_DISTANCE_2_MIN_LENGTH,
  MAX_CANDIDATE_RESULTS,
  SCORE_EDIT_DISTANCE_1,
  SCORE_EDIT_DISTANCE_2,
  SCORE_EXACT,
  SCORE_NO_SPACES,
  SCORE_SUBSTRING_LONG,
  SCORE_SUBSTRING_SHORT,
  SUBSTRING_MIN_LENGTH
} from "./aliasResolverConstants";

// In-memory cache — exercises change only on seed, so cache is nearly always valid.
let cachedAliases: ExerciseAlias[] | null = null;
let cachedCanonicals: ExerciseCanonical[] | null = null;

const getAliases = async (): Promise<ExerciseAlias[]> => {
  if (!cachedAliases) cachedAliases = await db.exerciseAliases.toArray();
  return cachedAliases;
};

const getCanonicals = async (): Promise<ExerciseCanonical[]> => {
  if (!cachedCanonicals) cachedCanonicals = await db.exerciseCanonicals.toArray();
  return cachedCanonicals;
};

/** Call after seeding or adding exercises to invalidate the cache. */
export const invalidateAliasCache = () => {
  cachedAliases = null;
  cachedCanonicals = null;
};

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
    return SCORE_EXACT;
  }

  const looseInput = toLooseText(normalizedInput);
  const looseAlias = toLooseText(normalizedAlias);

  if (looseInput === looseAlias) {
    return SCORE_NO_SPACES;
  }

  if (normalizedAlias.includes(normalizedInput) || normalizedInput.includes(normalizedAlias)) {
    return normalizedInput.length >= SUBSTRING_MIN_LENGTH ? SCORE_SUBSTRING_LONG : SCORE_SUBSTRING_SHORT;
  }

  const maxLength = Math.max(looseInput.length, looseAlias.length);
  const distance = getEditDistance(looseInput, looseAlias);

  if (maxLength >= EDIT_DISTANCE_1_MIN_LENGTH && distance <= 1) {
    return SCORE_EDIT_DISTANCE_1;
  }

  if (maxLength >= EDIT_DISTANCE_2_MIN_LENGTH && distance <= 2) {
    return SCORE_EDIT_DISTANCE_2;
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
    (bestCandidate.score >= DISAMBIGUATION_MIN_SCORE && (!secondCandidate || bestCandidate.score - secondCandidate.score >= DISAMBIGUATION_SCORE_GAP))
  ) {
    return {
      canonicalExerciseId: bestCandidate.canonicalExerciseId,
      matchedAlias: bestCandidate.matchedAlias,
      confidence: bestCandidate.score,
      isAmbiguous: false
    };
  }

  return {
    confidence: Math.max(AMBIGUOUS_CONFIDENCE_FLOOR, bestCandidate.score * AMBIGUOUS_CONFIDENCE_MULTIPLIER),
    isAmbiguous: true,
    candidateExerciseIds: candidateExerciseIds.slice(0, MAX_CANDIDATE_RESULTS),
    reason: "ambiguous"
  };
};

export const resolveExerciseAlias = async (input: string): Promise<AliasResolution> => {
  const normalizedInput = normalizeExerciseInput(input);
  if (!normalizedInput) {
    return { confidence: 0, isAmbiguous: false, reason: "not_found" };
  }

  const aliases = await getAliases();
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

  const canonicals = await getCanonicals();
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
