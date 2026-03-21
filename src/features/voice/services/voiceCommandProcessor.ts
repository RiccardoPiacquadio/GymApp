import {
  getLastSessionExercise,
  getLastSetForSessionExercise
} from "../../sessions/services/sessionRepository";
import {
  clearVoiceConversationState,
  getVoiceConversationState,
  setVoiceConversationState
} from "./voiceConversationStore";
import { normalizeText } from "../../../lib/normalize";
import type { VoiceCommandResult, VoiceConversationState } from "../types/voice";
import { FB_COMMAND_NOT_RECOGNIZED, FB_CONTEXT_UPDATED } from "./voiceFeedback";
import { getQuickIntent, intentHandlers, type CommandContext } from "./intentHandlers";

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export const processVoiceCommand = async (
  rawText: string,
  userId: string
): Promise<VoiceCommandResult> => {
  const conversationState = await getVoiceConversationState();
  const normalizedText = normalizeText(rawText);
  const ctx: CommandContext = {
    rawText,
    normalizedText,
    userId,
    conversationState,
    quickIntent: getQuickIntent(normalizedText)
  };

  for (const handler of intentHandlers) {
    const result = await handler(ctx);
    if (result) return result;
  }

  return {
    success: false,
    feedback: FB_COMMAND_NOT_RECOGNIZED,
    conversationState
  };
};

// ---------------------------------------------------------------------------
// Hydration — rebuilds voice context from current session state
// ---------------------------------------------------------------------------

export const hydrateConversationStateForSession = async (sessionId: string) => {
  const lastSessionExercise = await getLastSessionExercise(sessionId);
  if (!lastSessionExercise) {
    await clearVoiceConversationState();
    return await getVoiceConversationState();
  }

  const lastSet = await getLastSetForSessionExercise(lastSessionExercise.id);
  const updatedConversationState: VoiceConversationState = {
    activeSessionId: sessionId,
    activeExerciseId: lastSessionExercise.canonicalExerciseId,
    activeSessionExerciseId: lastSessionExercise.id,
    lastSetEntryId: lastSet?.id,
    lastWeight: lastSet?.weight,
    lastReps: lastSet?.reps,
    lastSetNumber: lastSet?.setNumber,
    lastFeedback: FB_CONTEXT_UPDATED
  };
  await setVoiceConversationState(updatedConversationState);
  return updatedConversationState;
};
