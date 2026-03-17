import { getExerciseById, searchExercises } from "../../exercises/services/exerciseRepository";
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

const getRepsOnlyIntent = (normalizedText: string) => {
  const sameSetPattern = /^(?:uguale|stessa|stesso|ancora)$/i;
  if (sameSetPattern.test(normalizedText)) {
    return { type: "repeat_last_set" as const };
  }

  const repeatWithReps = normalizedText.match(/^(?:ancora\s+|fatte\s+|metti\s+)?(\d+)$/i);
  if (repeatWithReps) {
    return {
      type: "repeat_with_reps" as const,
      reps: Number(repeatWithReps[1])
    };
  }

  const correctLastReps = normalizedText.match(/^(?:no|erano|sono|correggi(?:\s+l'?ultima)?\s+a)\s*(\d+)$/i);
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

export const processVoiceCommand = async (
  rawText: string,
  userId: string
): Promise<VoiceCommandResult> => {
  const activeSession = (await getActiveSessionForUser(userId)) ?? (await startWorkoutSession(userId));
  const currentConversationState = await getVoiceConversationState();
  const normalizedText = rawText
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  const quickIntent = getRepsOnlyIntent(normalizedText);

  if (quickIntent?.type === "repeat_last_set") {
    const targetSessionExerciseId = currentConversationState.activeSessionExerciseId;
    if (!targetSessionExerciseId || !currentConversationState.lastWeight || !currentConversationState.lastReps) {
      return {
        success: false,
        feedback: "Non ho un ultimo set da ripetere.",
        conversationState: currentConversationState
      };
    }

    const setEntry = await addSetEntry({
      sessionExerciseId: targetSessionExerciseId,
      weight: currentConversationState.lastWeight,
      reps: currentConversationState.lastReps,
      inputMode: "voice"
    });
    const updatedConversationState = await buildUpdatedConversationState({
      sessionId: activeSession.id,
      sessionExerciseId: targetSessionExerciseId,
      exerciseId: currentConversationState.activeExerciseId!,
      setEntryId: setEntry.id,
      lastWeight: setEntry.weight,
      lastReps: setEntry.reps,
      lastSetNumber: setEntry.setNumber,
      lastFeedback: `Serie ${setEntry.weight} kg x ${setEntry.reps} salvata.`
    });
    await setVoiceConversationState(updatedConversationState);

    return {
      success: true,
      feedback: updatedConversationState.lastFeedback!,
      conversationState: updatedConversationState
    };
  }

  if (quickIntent?.type === "repeat_with_reps") {
    const targetSessionExerciseId = currentConversationState.activeSessionExerciseId;
    if (!targetSessionExerciseId || !currentConversationState.lastWeight) {
      return {
        success: false,
        feedback: "Manca un esercizio attivo o un peso precedente.",
        conversationState: currentConversationState
      };
    }

    const setEntry = await addSetEntry({
      sessionExerciseId: targetSessionExerciseId,
      weight: currentConversationState.lastWeight,
      reps: quickIntent.reps,
      inputMode: "voice"
    });
    const updatedConversationState = await buildUpdatedConversationState({
      sessionId: activeSession.id,
      sessionExerciseId: targetSessionExerciseId,
      exerciseId: currentConversationState.activeExerciseId!,
      setEntryId: setEntry.id,
      lastWeight: setEntry.weight,
      lastReps: setEntry.reps,
      lastSetNumber: setEntry.setNumber,
      lastFeedback: `Serie ${setEntry.weight} kg x ${setEntry.reps} salvata.`
    });
    await setVoiceConversationState(updatedConversationState);

    return {
      success: true,
      feedback: updatedConversationState.lastFeedback!,
      conversationState: updatedConversationState
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

  if (!parsedVoiceSet.isValid || !parsedVoiceSet.canonicalExerciseId || !parsedVoiceSet.weight || !parsedVoiceSet.reps) {
    const candidateNames = parsedVoiceSet.candidateExerciseIds
      ? (await Promise.all(parsedVoiceSet.candidateExerciseIds.map((exerciseId) => getExerciseById(exerciseId))))
          .filter(Boolean)
          .map((exercise) => exercise!.canonicalName)
      : [];

    return {
      success: false,
      feedback: parsedVoiceSet.feedbackMessage ?? "Comando da confermare.",
      requiresConfirmation: true,
      parsedVoiceSet,
      candidateNames,
      conversationState: currentConversationState
    };
  }

  const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
  if (!exercise) {
    return {
      success: false,
      feedback: "Esercizio non trovato.",
      conversationState: currentConversationState
    };
  }

  const sessionExercise = await addExerciseToSession(activeSession.id, exercise);
  const setEntry = await addSetEntry({
    sessionExerciseId: sessionExercise.id,
    reps: parsedVoiceSet.reps,
    weight: parsedVoiceSet.weight,
    inputMode: "voice"
  });

  const updatedConversationState = await buildUpdatedConversationState({
    sessionId: activeSession.id,
    sessionExerciseId: sessionExercise.id,
    exerciseId: exercise.id,
    setEntryId: setEntry.id,
    lastWeight: setEntry.weight,
    lastReps: setEntry.reps,
    lastSetNumber: setEntry.setNumber,
    lastFeedback: `${exercise.canonicalName}, ${setEntry.weight} kg x ${setEntry.reps}, salvato.`
  });
  await setVoiceConversationState(updatedConversationState);

  return {
    success: true,
    feedback: updatedConversationState.lastFeedback!,
    conversationState: updatedConversationState
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
