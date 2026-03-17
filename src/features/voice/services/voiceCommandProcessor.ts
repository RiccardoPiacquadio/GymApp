import { getExerciseById } from "../../exercises/services/exerciseRepository";
import {
  addExerciseToSession,
  addSetEntry,
  deleteLastSetEntry,
  getActiveSessionForUser,
  getLastSessionExercise,
  getLastSetForSessionExercise,
  startWorkoutSession,
  updateSetEntry
} from "../../sessions/services/sessionRepository";
import { parseVoiceSet } from "./voiceParser";
import {
  clearVoiceConversationState,
  getVoiceConversationState,
  setVoiceConversationState
} from "./voiceConversationStore";
import type { ParsedVoiceSet, VoiceCommandResult, VoiceConversationState } from "../types/voice";

const normalizeVoiceText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const getQuickIntent = (normalizedText: string) => {
  const sameSetPattern = /^(?:uguale|stessa|stesso|ancora|di nuovo)$/i;
  if (sameSetPattern.test(normalizedText)) {
    return { type: "repeat_last_set" as const };
  }

  const repeatWithReps = normalizedText.match(/^(?:ancora\s+|di nuovo\s+|fatte\s+|metti\s+)?(\d+)(?:\s+(?:rep|reps|rip|ripetizioni|colpo|colpi))?$/i);
  if (repeatWithReps) {
    return {
      type: "repeat_with_reps" as const,
      reps: Number(repeatWithReps[1])
    };
  }

  const correctLastReps = normalizedText.match(/^(?:no|erano|sono|correggi(?:\s+l'?ultima)?\s+a)\s*(\d+)(?:\s+(?:rep|reps|rip|ripetizioni|colpo|colpi))?$/i);
  if (correctLastReps) {
    return {
      type: "correct_last_set_reps" as const,
      reps: Number(correctLastReps[1])
    };
  }

  if (/^(?:cancella l'?ultima(?: serie)?|rimuovi l'?ultima(?: serie)?|annulla)$/i.test(normalizedText)) {
    return { type: "delete_last_set" as const };
  }

  return null;
};

const buildUpdatedConversationState = async (params: {
  sessionId: string;
  sessionExerciseId: string;
  exerciseId: string;
  setEntryId?: string;
  lastWeight?: number;
  lastReps?: number;
  lastSetNumber?: number;
  lastFeedback: string;
}): Promise<VoiceConversationState> => ({
  activeSessionId: params.sessionId,
  activeExerciseId: params.exerciseId,
  activeSessionExerciseId: params.sessionExerciseId,
  lastSetEntryId: params.setEntryId,
  lastWeight: params.lastWeight,
  lastReps: params.lastReps,
  lastSetNumber: params.lastSetNumber,
  lastFeedback: params.lastFeedback
});

const ensureActiveSession = async (userId: string) =>
  (await getActiveSessionForUser(userId)) ?? (await startWorkoutSession(userId));

const saveSetBatch = async (params: {
  sessionId: string;
  sessionExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  count: number;
}) => {
  let lastSet = undefined as Awaited<ReturnType<typeof addSetEntry>> | undefined;

  for (let index = 0; index < params.count; index += 1) {
    lastSet = await addSetEntry({
      sessionExerciseId: params.sessionExerciseId,
      weight: params.weight,
      reps: params.reps,
      inputMode: "voice"
    });
  }

  const feedback =
    params.count > 1
      ? `${params.exerciseName}, ${params.count} serie da ${params.weight} kg x ${params.reps}, salvate.`
      : `${params.exerciseName}, ${params.weight} kg x ${params.reps}, salvato.`;

  const updatedConversationState = await buildUpdatedConversationState({
    sessionId: params.sessionId,
    sessionExerciseId: params.sessionExerciseId,
    exerciseId: params.exerciseId,
    setEntryId: lastSet?.id,
    lastWeight: lastSet?.weight,
    lastReps: lastSet?.reps,
    lastSetNumber: lastSet?.setNumber,
    lastFeedback: feedback
  });
  await setVoiceConversationState(updatedConversationState);

  return {
    feedback,
    conversationState: updatedConversationState
  };
};

export const processVoiceCommand = async (
  rawText: string,
  userId: string
): Promise<VoiceCommandResult> => {
  const currentConversationState = await getVoiceConversationState();
  const normalizedText = normalizeVoiceText(rawText);
  const quickIntent = getQuickIntent(normalizedText);

  if (quickIntent?.type === "repeat_last_set") {
    const targetSessionExerciseId = currentConversationState.activeSessionExerciseId;
    if (!targetSessionExerciseId || !currentConversationState.lastWeight || !currentConversationState.lastReps) {
      return {
        success: false,
        feedback: "Non ho un ultimo set da ripetere.",
        conversationState: currentConversationState
      };
    }

    const activeSession = await ensureActiveSession(userId);
    const exercise = currentConversationState.activeExerciseId
      ? await getExerciseById(currentConversationState.activeExerciseId)
      : undefined;

    if (!exercise) {
      return {
        success: false,
        feedback: "Manca l'esercizio attivo per ripetere la serie.",
        conversationState: currentConversationState
      };
    }

    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: targetSessionExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.canonicalName,
        weight: currentConversationState.lastWeight,
        reps: currentConversationState.lastReps,
        count: 1
      }))
    };
  }

  if (quickIntent?.type === "repeat_with_reps") {
    const targetSessionExerciseId = currentConversationState.activeSessionExerciseId;
    if (!targetSessionExerciseId || !currentConversationState.lastWeight || !currentConversationState.activeExerciseId) {
      return {
        success: false,
        feedback: "Manca un esercizio attivo o un peso precedente.",
        conversationState: currentConversationState
      };
    }

    const activeSession = await ensureActiveSession(userId);
    const exercise = await getExerciseById(currentConversationState.activeExerciseId);
    if (!exercise) {
      return {
        success: false,
        feedback: "Esercizio attivo non trovato.",
        conversationState: currentConversationState
      };
    }

    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: targetSessionExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.canonicalName,
        weight: currentConversationState.lastWeight,
        reps: quickIntent.reps,
        count: 1
      }))
    };
  }

  if (quickIntent?.type === "correct_last_set_reps") {
    if (!currentConversationState.lastSetEntryId || !currentConversationState.lastWeight) {
      return {
        success: false,
        feedback: "Non ho un ultimo set da correggere.",
        conversationState: currentConversationState
      };
    }

    await updateSetEntry(currentConversationState.lastSetEntryId, {
      weight: currentConversationState.lastWeight,
      reps: quickIntent.reps
    });

    const updatedConversationState: VoiceConversationState = {
      ...currentConversationState,
      lastReps: quickIntent.reps,
      lastFeedback: `Ultima serie corretta a ${currentConversationState.lastWeight} kg x ${quickIntent.reps}.`
    };
    await setVoiceConversationState(updatedConversationState);

    return {
      success: true,
      feedback: updatedConversationState.lastFeedback!,
      conversationState: updatedConversationState
    };
  }

  if (quickIntent?.type === "delete_last_set") {
    if (!currentConversationState.activeSessionExerciseId) {
      return {
        success: false,
        feedback: "Non ho un ultimo set da cancellare.",
        conversationState: currentConversationState
      };
    }

    const deletedSet = await deleteLastSetEntry(currentConversationState.activeSessionExerciseId);
    if (!deletedSet) {
      return {
        success: false,
        feedback: "Non ci sono serie da cancellare.",
        conversationState: currentConversationState
      };
    }

    const newLastSet = await getLastSetForSessionExercise(currentConversationState.activeSessionExerciseId);
    const updatedConversationState: VoiceConversationState = {
      ...currentConversationState,
      lastSetEntryId: newLastSet?.id,
      lastWeight: newLastSet?.weight,
      lastReps: newLastSet?.reps,
      lastSetNumber: newLastSet?.setNumber,
      lastFeedback: "Ultima serie eliminata."
    };
    await setVoiceConversationState(updatedConversationState);

    return {
      success: true,
      feedback: updatedConversationState.lastFeedback!,
      conversationState: updatedConversationState
    };
  }

  const parsedVoiceSet: ParsedVoiceSet = await parseVoiceSet(rawText);
  const candidateNames = parsedVoiceSet.candidateExerciseIds
    ? (await Promise.all(parsedVoiceSet.candidateExerciseIds.map((exerciseId) => getExerciseById(exerciseId))))
        .filter(Boolean)
        .map((exercise) => exercise!.canonicalName)
    : [];

  if (
    parsedVoiceSet.setCount &&
    !parsedVoiceSet.weight &&
    !parsedVoiceSet.reps &&
    currentConversationState.activeSessionExerciseId &&
    currentConversationState.activeExerciseId &&
    currentConversationState.lastWeight !== undefined &&
    currentConversationState.lastReps !== undefined
  ) {
    const activeSession = await ensureActiveSession(userId);
    const exercise = await getExerciseById(currentConversationState.activeExerciseId);
    if (!exercise) {
      return {
        success: false,
        feedback: "Esercizio attivo non trovato.",
        conversationState: currentConversationState
      };
    }

    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: currentConversationState.activeSessionExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.canonicalName,
        weight: currentConversationState.lastWeight,
        reps: currentConversationState.lastReps,
        count: parsedVoiceSet.setCount
      }))
    };
  }

  if (
    parsedVoiceSet.weight !== undefined &&
    parsedVoiceSet.reps !== undefined &&
    !parsedVoiceSet.canonicalExerciseId &&
    currentConversationState.activeSessionExerciseId &&
    currentConversationState.activeExerciseId
  ) {
    const activeSession = await ensureActiveSession(userId);
    const exercise = await getExerciseById(currentConversationState.activeExerciseId);
    if (!exercise) {
      return {
        success: false,
        feedback: "Esercizio attivo non trovato.",
        conversationState: currentConversationState
      };
    }

    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: currentConversationState.activeSessionExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.canonicalName,
        weight: parsedVoiceSet.weight,
        reps: parsedVoiceSet.reps,
        count: parsedVoiceSet.setCount ?? 1
      }))
    };
  }

  if (!parsedVoiceSet.isValid || !parsedVoiceSet.canonicalExerciseId || parsedVoiceSet.weight === undefined || parsedVoiceSet.reps === undefined) {
    return {
      success: false,
      feedback: parsedVoiceSet.feedbackMessage ?? "Comando da confermare.",
      requiresConfirmation: true,
      parsedVoiceSet,
      candidateNames,
      conversationState: currentConversationState
    };
  }

  const activeSession = await ensureActiveSession(userId);
  const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
  if (!exercise) {
    return {
      success: false,
      feedback: "Esercizio non trovato.",
      conversationState: currentConversationState
    };
  }

  const sessionExercise = await addExerciseToSession(activeSession.id, exercise);
  const batchResult = await saveSetBatch({
    sessionId: activeSession.id,
    sessionExerciseId: sessionExercise.id,
    exerciseId: exercise.id,
    exerciseName: exercise.canonicalName,
    weight: parsedVoiceSet.weight,
    reps: parsedVoiceSet.reps,
    count: parsedVoiceSet.setCount ?? 1
  });

  return {
    success: true,
    ...batchResult
  };
};

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
    lastFeedback: "Contesto sessione aggiornato."
  };
  await setVoiceConversationState(updatedConversationState);
  return updatedConversationState;
};

