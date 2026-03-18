import { getExerciseById } from "../../exercises/services/exerciseRepository";
import {
  addExerciseToSession,
  addSetEntry,
  deleteLastSetEntry,
  getActiveSessionForUser,
  getLastSessionExercise,
  getLastSetForSessionExercise,
  getSessionExerciseByExercise,
  pauseWorkoutSession,
  resumeWorkoutSession,
  startWorkoutSession,
  updateSetEntry
} from "../../sessions/services/sessionRepository";
import { parseVoiceSet } from "./voiceParser";
import {
  clearVoiceConversationState,
  getVoiceConversationState,
  setVoiceConversationState
} from "./voiceConversationStore";
import type { ExerciseCanonical } from "../../../types";
import type { ParsedVoiceSet, VoiceCommandResult, VoiceConversationState } from "../types/voice";

const normalizeVoiceText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// ---------------------------------------------------------------------------
// Quick intent detection — runs on normalizedText (apostrophes already → spaces)
// ---------------------------------------------------------------------------

type QuickIntent =
  | { type: "repeat_last_set" }
  | { type: "repeat_with_reps"; reps: number }
  | { type: "correct_last_set_reps"; reps: number }
  | { type: "correct_last_set_weight"; weight: number }
  | { type: "switch_exercise"; exerciseQuery: string }
  | { type: "close_session_pending" }
  | { type: "pause_session" }
  | { type: "resume_session" }
  | { type: "delete_last_set" };

const getQuickIntent = (normalizedText: string): QuickIntent | null => {
  // Same set (repeat identical)
  if (/^(?:uguale|stessa|stesso|ancora|di nuovo)$/.test(normalizedText)) {
    return { type: "repeat_last_set" };
  }

  // Repeat with different reps (bare number or "ancora N")
  const repeatWithReps = normalizedText.match(
    /^(?:ancora\s+|di nuovo\s+|fatte\s+|metti\s+)?(\d+)(?:\s+(?:rep|reps|rip|ripetizioni|colpo|colpi))?$/
  );
  if (repeatWithReps) {
    return { type: "repeat_with_reps", reps: Number(repeatWithReps[1]) };
  }

  // Correction — disambiguate weight vs reps:
  //   explicit "kg/chilo" suffix or value > 30 → weight correction
  //   explicit "rep/rip" suffix or value ≤ 30 → reps correction
  // Note: after normalizeVoiceText, "l'ultima" → "l ultima"
  const correctionMatch = normalizedText.match(
    /^(?:no|erano|sono|correggi(?:\s+(?:l\s+)?ultima)?\s+a)\s*(\d+(?:[.,]\d+)?)(?:\s+(kg|chilogrammi|chili|kili|rep|reps|rip|ripetizioni|colpo|colpi))?$/
  );
  if (correctionMatch) {
    const value = Number(correctionMatch[1].replace(",", "."));
    const unit = (correctionMatch[2] ?? "").toLowerCase();
    const isWeightUnit = /^(?:kg|chilo)/.test(unit);
    const isRepUnit = /^(?:rep|rip|colpo|colpi)/.test(unit);
    if (isWeightUnit || (!isRepUnit && value > 30)) {
      return { type: "correct_last_set_weight", weight: value };
    }
    return { type: "correct_last_set_reps", reps: value };
  }

  // Delete last set
  // After normalization: "l'ultima" → "l ultima"
  if (
    /^(?:cancella\s+(?:l\s+)?ultima(?:\s+serie)?|rimuovi\s+(?:l\s+)?ultima(?:\s+serie)?|annulla)$/.test(
      normalizedText
    )
  ) {
    return { type: "delete_last_set" };
  }

  // Exercise switch with explicit prefix keyword
  const switchMatch = normalizedText.match(
    /^(?:adesso(?:\s+faccio)?|ora(?:\s+faccio)?|faccio|passa\s+a|passiamo\s+a|cambia(?:\s+a)?|cambio(?:\s+a)?|passo\s+a)\s+(.+)$/
  );
  if (switchMatch) {
    return { type: "switch_exercise", exerciseQuery: switchMatch[1].trim() };
  }

  // Session: close
  if (
    /^(?:chiudi(?:\s+allenamento)?|termina(?:\s+allenamento)?|fine(?:\s+allenamento)?|finisco|ho\s+finito|chiudo)$/.test(
      normalizedText
    )
  ) {
    return { type: "close_session_pending" };
  }

  // Session: pause
  if (
    /^(?:pausa(?:\s+allenamento)?|metti\s+in\s+pausa|mi\s+fermo)$/.test(normalizedText)
  ) {
    return { type: "pause_session" };
  }

  // Session: resume
  // "l'allenamento" → "l allenamento" after normalization
  if (
    /^(?:riprendi(?:\s+(?:l\s+)?allenamento)?|riprendo(?:\s+(?:l\s+)?allenamento)?|fine\s+pausa|sono\s+tornato|sono\s+di\s+nuovo\s+qui)$/.test(
      normalizedText
    )
  ) {
    return { type: "resume_session" };
  }

  return null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildUpdatedConversationState = (params: {
  sessionId: string;
  sessionExerciseId: string;
  exerciseId: string;
  setEntryId?: string;
  lastWeight?: number;
  lastReps?: number;
  lastSetNumber?: number;
  lastFeedback: string;
}): VoiceConversationState => ({
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

  const updatedConversationState = buildUpdatedConversationState({
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

  return { feedback, conversationState: updatedConversationState };
};

/**
 * Updates voice context to a different exercise (lazy: does NOT create sessionExercise).
 * If the exercise already has a sessionExercise in the current session, loads last set data.
 */
const applySwitchExercise = async (
  exercise: ExerciseCanonical,
  currentState: VoiceConversationState
): Promise<VoiceCommandResult> => {
  let activeSessionExerciseId: string | undefined;
  let lastWeight: number | undefined;
  let lastReps: number | undefined;
  let lastSetNumber: number | undefined;
  let lastSetEntryId: string | undefined;

  if (currentState.activeSessionId) {
    const existing = await getSessionExerciseByExercise(currentState.activeSessionId, exercise.id);
    if (existing) {
      activeSessionExerciseId = existing.id;
      const lastSet = await getLastSetForSessionExercise(existing.id);
      lastWeight = lastSet?.weight;
      lastReps = lastSet?.reps;
      lastSetNumber = lastSet?.setNumber;
      lastSetEntryId = lastSet?.id;
    }
  }

  const feedback = `Esercizio attivo: ${exercise.canonicalName}.`;
  const updated: VoiceConversationState = {
    ...currentState,
    activeExerciseId: exercise.id,
    activeSessionExerciseId,
    lastSetEntryId,
    lastWeight,
    lastReps,
    lastSetNumber,
    lastFeedback: feedback
  };
  await setVoiceConversationState(updated);

  return { success: true, feedback, conversationState: updated };
};

// ---------------------------------------------------------------------------
// Main command processor
// ---------------------------------------------------------------------------

export const processVoiceCommand = async (
  rawText: string,
  userId: string
): Promise<VoiceCommandResult> => {
  const currentConversationState = await getVoiceConversationState();
  const normalizedText = normalizeVoiceText(rawText);
  const quickIntent = getQuickIntent(normalizedText);

  // ---- repeat_last_set ----
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

  // ---- repeat_with_reps ----
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

  // ---- correct_last_set_reps ----
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

    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastReps: quickIntent.reps,
      lastFeedback: `Ultima serie corretta a ${currentConversationState.lastWeight} kg x ${quickIntent.reps}.`
    };
    await setVoiceConversationState(updated);

    return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
  }

  // ---- correct_last_set_weight ----
  if (quickIntent?.type === "correct_last_set_weight") {
    if (!currentConversationState.lastSetEntryId || !currentConversationState.lastReps) {
      return {
        success: false,
        feedback: "Non ho un ultimo set da correggere.",
        conversationState: currentConversationState
      };
    }

    await updateSetEntry(currentConversationState.lastSetEntryId, {
      weight: quickIntent.weight,
      reps: currentConversationState.lastReps
    });

    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastWeight: quickIntent.weight,
      lastFeedback: `Ultima serie corretta a ${quickIntent.weight} kg x ${currentConversationState.lastReps}.`
    };
    await setVoiceConversationState(updated);

    return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
  }

  // ---- delete_last_set ----
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
    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastSetEntryId: newLastSet?.id,
      lastWeight: newLastSet?.weight,
      lastReps: newLastSet?.reps,
      lastSetNumber: newLastSet?.setNumber,
      lastFeedback: "Ultima serie eliminata."
    };
    await setVoiceConversationState(updated);

    return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
  }

  // ---- switch_exercise (prefixed command) ----
  if (quickIntent?.type === "switch_exercise") {
    const parsed = await parseVoiceSet(quickIntent.exerciseQuery);
    if (!parsed.canonicalExerciseId) {
      return {
        success: false,
        feedback: "Esercizio non riconosciuto.",
        conversationState: currentConversationState
      };
    }
    if (parsed.candidateExerciseIds && parsed.candidateExerciseIds.length > 1 && !parsed.canonicalExerciseId) {
      return {
        success: false,
        feedback: "Nome ambiguo: specifica meglio l'esercizio.",
        requiresConfirmation: true,
        conversationState: currentConversationState
      };
    }
    const exercise = await getExerciseById(parsed.canonicalExerciseId);
    if (!exercise) {
      return { success: false, feedback: "Esercizio non trovato.", conversationState: currentConversationState };
    }
    return applySwitchExercise(exercise, currentConversationState);
  }

  // ---- close_session_pending ----
  if (quickIntent?.type === "close_session_pending") {
    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastFeedback: "Stai per chiudere la sessione. Confermi?"
    };
    await setVoiceConversationState(updated);
    return {
      success: false,
      feedback: "Stai per chiudere la sessione. Confermi?",
      conversationState: updated,
      sessionAction: "close_session_pending"
    };
  }

  // ---- pause_session ----
  if (quickIntent?.type === "pause_session") {
    const activeSession = await getActiveSessionForUser(userId);
    if (!activeSession || activeSession.status !== "active") {
      return {
        success: false,
        feedback: "Nessuna sessione attiva da mettere in pausa.",
        conversationState: currentConversationState
      };
    }
    await pauseWorkoutSession(activeSession.id);
    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastFeedback: "Sessione in pausa."
    };
    await setVoiceConversationState(updated);
    return {
      success: true,
      feedback: "Sessione in pausa.",
      conversationState: updated,
      sessionAction: "pause_session"
    };
  }

  // ---- resume_session ----
  if (quickIntent?.type === "resume_session") {
    const session = await getActiveSessionForUser(userId);
    if (!session || session.status !== "paused") {
      return {
        success: false,
        feedback: "Nessuna sessione in pausa da riprendere.",
        conversationState: currentConversationState
      };
    }
    await resumeWorkoutSession(session.id);
    const updated: VoiceConversationState = {
      ...currentConversationState,
      lastFeedback: "Sessione ripresa."
    };
    await setVoiceConversationState(updated);
    return {
      success: true,
      feedback: "Sessione ripresa.",
      conversationState: updated,
      sessionAction: "resume_session"
    };
  }

  // ---- Full parse ----
  const parsedVoiceSet: ParsedVoiceSet = await parseVoiceSet(rawText);
  const candidateNames = parsedVoiceSet.candidateExerciseIds
    ? (await Promise.all(parsedVoiceSet.candidateExerciseIds.map((id) => getExerciseById(id))))
        .filter(Boolean)
        .map((ex) => ex!.canonicalName)
    : [];

  // Exercise-only (no numbers, no set count) → switch active exercise
  if (
    parsedVoiceSet.canonicalExerciseId &&
    !parsedVoiceSet.weight &&
    !parsedVoiceSet.reps &&
    !parsedVoiceSet.setCount
  ) {
    const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
    if (exercise) {
      return applySwitchExercise(exercise, currentConversationState);
    }
  }

  // setCount only, no numbers → repeat last set N times
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
      return { success: false, feedback: "Esercizio attivo non trovato.", conversationState: currentConversationState };
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

  // weight+reps without exercise → use active exercise context
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
      return { success: false, feedback: "Esercizio attivo non trovato.", conversationState: currentConversationState };
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

  // Incomplete/ambiguous parse → ask for confirmation
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

  // Full valid parse → log set
  const activeSession = await ensureActiveSession(userId);
  const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
  if (!exercise) {
    return { success: false, feedback: "Esercizio non trovato.", conversationState: currentConversationState };
  }

  const sessionExercise = await addExerciseToSession(activeSession.id, exercise);
  return {
    success: true,
    ...(await saveSetBatch({
      sessionId: activeSession.id,
      sessionExerciseId: sessionExercise.id,
      exerciseId: exercise.id,
      exerciseName: exercise.canonicalName,
      weight: parsedVoiceSet.weight,
      reps: parsedVoiceSet.reps,
      count: parsedVoiceSet.setCount ?? 1
    }))
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
    lastFeedback: "Contesto sessione aggiornato."
  };
  await setVoiceConversationState(updatedConversationState);
  return updatedConversationState;
};
