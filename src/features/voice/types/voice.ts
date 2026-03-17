export type ParsedVoiceSet = {
  rawText: string;
  normalizedText: string;
  canonicalExerciseId?: string;
  matchedAlias?: string;
  weight?: number;
  reps?: number;
  confidence: number;
  isValid: boolean;
  requiresConfirmation: boolean;
  feedbackMessage?: string;
  candidateExerciseIds?: string[];
};

export type SpeechCaptureState = "idle" | "listening" | "unsupported" | "error";

export type VoiceIntentType =
  | "log_set"
  | "repeat_last_set"
  | "repeat_with_reps"
  | "correct_last_set_reps"
  | "delete_last_set"
  | "unknown";

export type VoiceConversationState = {
  activeSessionId?: string;
  activeExerciseId?: string;
  activeSessionExerciseId?: string;
  lastSetEntryId?: string;
  lastWeight?: number;
  lastReps?: number;
  lastSetNumber?: number;
  lastFeedback?: string;
};

export type VoiceCommandResult = {
  success: boolean;
  feedback: string;
  requiresConfirmation?: boolean;
  parsedVoiceSet?: ParsedVoiceSet;
  candidateNames?: string[];
  conversationState?: VoiceConversationState;
};
