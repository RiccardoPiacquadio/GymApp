/** Scoring thresholds for alias matching. */
export const SCORE_EXACT = 1.0;
export const SCORE_NO_SPACES = 0.96;
export const SCORE_SUBSTRING_LONG = 0.76;
export const SCORE_SUBSTRING_SHORT = 0.44;
export const SCORE_EDIT_DISTANCE_1 = 0.87;
export const SCORE_EDIT_DISTANCE_2 = 0.8;

/** Minimum input length to qualify for substring matching with high score. */
export const SUBSTRING_MIN_LENGTH = 4;

/** Minimum string length to allow edit distance matching. */
export const EDIT_DISTANCE_1_MIN_LENGTH = 6;
export const EDIT_DISTANCE_2_MIN_LENGTH = 9;

/** Disambiguation thresholds. */
export const DISAMBIGUATION_MIN_SCORE = 0.84;
export const DISAMBIGUATION_SCORE_GAP = 0.12;
export const AMBIGUOUS_CONFIDENCE_MULTIPLIER = 0.6;
export const AMBIGUOUS_CONFIDENCE_FLOOR = 0.25;
export const MAX_CANDIDATE_RESULTS = 5;
