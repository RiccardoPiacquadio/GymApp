import { db } from "../../../db";
import type { VoiceConversationState } from "../types/voice";

const VOICE_STATE_KEY = "voice.conversationState";

const emptyConversationState = (): VoiceConversationState => ({
  lastFeedback: "Pronto per il prossimo comando vocale."
});

export const getVoiceConversationState = async (): Promise<VoiceConversationState> => {
  const record = await db.appSettings.get(VOICE_STATE_KEY);
  if (!record?.value) {
    return emptyConversationState();
  }

  try {
    return JSON.parse(record.value) as VoiceConversationState;
  } catch {
    return emptyConversationState();
  }
};

export const setVoiceConversationState = async (state: VoiceConversationState) => {
  await db.appSettings.put({
    key: VOICE_STATE_KEY,
    value: JSON.stringify(state)
  });
};

export const clearVoiceConversationState = async () => {
  await setVoiceConversationState(emptyConversationState());
};
