export type ParsedVoiceSet = {
  rawText: string;
  normalizedText: string;
  canonicalExerciseId?: string;
  matchedAlias?: string;
  weight?: number;
  reps?: number;
  confidence: number;
  isValid: boolean;
};

export type SpeechCaptureState = "idle" | "listening" | "unsupported" | "error";
