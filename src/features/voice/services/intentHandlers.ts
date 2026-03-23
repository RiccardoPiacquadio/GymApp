import { getExerciseById } from "../../exercises/services/exerciseRepository";
import {
  addExerciseToSession,
  addSetEntry,
  deleteLastSetEntry,
  getActiveSessionForUser,
  getLastSetForSessionExercise,
  getSessionExerciseByExercise,
  pauseWorkoutSession,
  resumeWorkoutSession,
  startWorkoutSession,
  updateSetEntry
} from "../../sessions/services/sessionRepository";
import { parseMultiSetCommand, parseVoiceSet } from "./voiceParser";
import { setVoiceConversationState } from "./voiceConversationStore";
import type { ExerciseCanonical } from "../../../types";
import type { ParsedVoiceSet, VoiceCommandResult, VoiceConversationState } from "../types/voice";
import {
  FB_ACTIVE_EXERCISE_NOT_FOUND,
  FB_CLOSE_SESSION_CONFIRM,
  FB_COMMAND_NEEDS_CONFIRM,
  FB_EXERCISE_NOT_FOUND,
  FB_EXERCISE_NOT_RECOGNIZED,
  FB_LAST_SET_DELETED,
  FB_MULTI_SET_NO_EXERCISE,
  FB_NO_ACTIVE_EXERCISE_OR_WEIGHT,
  FB_NO_ACTIVE_EXERCISE_REPEAT,
  FB_NO_ACTIVE_SESSION_PAUSE,
  FB_NO_LAST_SET_CORRECT,
  FB_NO_LAST_SET_DELETE,
  FB_NO_LAST_SET_REPEAT,
  FB_NO_PAUSED_SESSION,
  FB_NO_SETS_TO_DELETE,
  FB_SESSION_PAUSED,
  FB_SESSION_RESUMED,
  fbActiveExercise,
  fbCorrectedReps,
  fbCorrectedWeight,
  fbMultiSetDetail,
  fbMultiSetSaved,
  fbSetSaved
} from "./voiceFeedback";

// ---------------------------------------------------------------------------
// Command context — shared across all handlers
// ---------------------------------------------------------------------------

export type QuickIntent =
  | { type: "repeat_last_set" }
  | { type: "repeat_with_reps"; reps: number }
  | { type: "correct_last_set_reps"; reps: number }
  | { type: "correct_last_set_weight"; weight: number }
  | { type: "switch_exercise"; exerciseQuery: string }
  | { type: "close_session_pending" }
  | { type: "pause_session" }
  | { type: "resume_session" }
  | { type: "delete_last_set" };

export type CommandContext = {
  rawText: string;
  normalizedText: string;
  userId: string;
  conversationState: VoiceConversationState;
  quickIntent: QuickIntent | null;
};

export type IntentHandler = (ctx: CommandContext) => Promise<VoiceCommandResult | null>;

// ---------------------------------------------------------------------------
// Quick intent detection
// ---------------------------------------------------------------------------

export const getQuickIntent = (normalizedText: string): QuickIntent | null => {
  if (/^(?:uguale|stessa|stesso|ancora|di nuovo|stessa cosa|uguale uguale|come prima|ripeti|un altra)$/.test(normalizedText)) {
    return { type: "repeat_last_set" };
  }

  // Match "ancora 8", "di nuovo 10", "8 reps" — but NOT bare large numbers like "80" (likely weight, not reps)
  const repeatWithExplicitReps = normalizedText.match(
    /^(?:ancora\s+|di nuovo\s+|fatte\s+|metti\s+)?(\d+)\s+(?:rep|reps|rip|ripetizioni|colpo|colpi)$/
  );
  if (repeatWithExplicitReps) {
    return { type: "repeat_with_reps", reps: Number(repeatWithExplicitReps[1]) };
  }
  const repeatWithBareNumber = normalizedText.match(
    /^(?:ancora\s+|di nuovo\s+|fatte\s+|metti\s+)(\d+)$/
  );
  if (repeatWithBareNumber) {
    const val = Number(repeatWithBareNumber[1]);
    if (val <= 30) return { type: "repeat_with_reps", reps: val };
  }
  // Bare single number without prefix — only treat as reps if <= 30 (likely reps, not weight)
  const bareNumber = normalizedText.match(/^(\d+)$/);
  if (bareNumber) {
    const val = Number(bareNumber[1]);
    if (val <= 30) return { type: "repeat_with_reps", reps: val };
    // val > 30 → fall through to full parser (could be weight)
  }

  const correctionMatch = normalizedText.match(
    /^(?:no|erano|sono|anzi|correggi(?:\s+(?:l\s+)?ultima)?\s+a|(?:in realta|veramente)\s+(?:erano|sono)?)\s*(\d+(?:[.,]\d+)?)(?:\s+(kg|chilogrammi|chili|kili|kilo|rep|reps|rip|ripetizioni|colpo|colpi))?$/
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

  if (
    /^(?:cancella\s+(?:l\s+)?ultima(?:\s+serie)?|rimuovi\s+(?:l\s+)?ultima(?:\s+serie)?|annulla)$/.test(
      normalizedText
    )
  ) {
    return { type: "delete_last_set" };
  }

  const switchMatch = normalizedText.match(
    /^(?:adesso(?:\s+faccio)?|ora(?:\s+faccio)?|faccio|passa(?:re)?\s+a|passiamo\s+a|cambia(?:\s+(?:a|con))?|cambio(?:\s+(?:a|con))?|passo\s+a|vado\s+(?:a|con)|andiamo\s+(?:a|con)|sto\s+facendo|iniziamo(?:\s+con)?|inizio(?:\s+con)?)\s+(.+)$/
  );
  if (switchMatch) {
    return { type: "switch_exercise", exerciseQuery: switchMatch[1].trim() };
  }

  if (
    /^(?:chiudi(?:\s+allenamento)?|termina(?:\s+allenamento)?|fine(?:\s+allenamento)?|finisco|ho\s+finito|chiudo)$/.test(
      normalizedText
    )
  ) {
    return { type: "close_session_pending" };
  }

  if (
    /^(?:pausa(?:\s+allenamento)?|metti\s+in\s+pausa|mi\s+fermo)$/.test(normalizedText)
  ) {
    return { type: "pause_session" };
  }

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
// Shared helpers
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
      ? fbMultiSetSaved(params.exerciseName, params.count, params.weight, params.reps)
      : fbSetSaved(params.exerciseName, params.weight, params.reps);

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

  const feedback = fbActiveExercise(exercise.canonicalName);
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

const fail = (feedback: string, state: VoiceConversationState): VoiceCommandResult => ({
  success: false,
  feedback,
  conversationState: state
});

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

export const handleRepeatLastSet: IntentHandler = async (ctx) => {
  const { conversationState: state, userId, quickIntent: intent } = ctx;
  if (intent?.type !== "repeat_last_set") return null;

  if (!state.activeSessionExerciseId || !state.lastWeight || !state.lastReps) {
    return fail(FB_NO_LAST_SET_REPEAT, state);
  }

  const exercise = state.activeExerciseId ? await getExerciseById(state.activeExerciseId) : undefined;
  if (!exercise) return fail(FB_NO_ACTIVE_EXERCISE_REPEAT, state);

  const activeSession = await ensureActiveSession(userId);
  return {
    success: true,
    ...(await saveSetBatch({
      sessionId: activeSession.id,
      sessionExerciseId: state.activeSessionExerciseId,
      exerciseId: exercise.id,
      exerciseName: exercise.canonicalName,
      weight: state.lastWeight,
      reps: state.lastReps,
      count: 1
    }))
  };
};

export const handleRepeatWithReps: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "repeat_with_reps") return null;

  const { conversationState: state, userId } = ctx;
  if (!state.activeSessionExerciseId || !state.lastWeight || !state.activeExerciseId) {
    return fail(FB_NO_ACTIVE_EXERCISE_OR_WEIGHT, state);
  }

  const exercise = await getExerciseById(state.activeExerciseId);
  if (!exercise) return fail(FB_ACTIVE_EXERCISE_NOT_FOUND, state);

  const activeSession = await ensureActiveSession(userId);
  return {
    success: true,
    ...(await saveSetBatch({
      sessionId: activeSession.id,
      sessionExerciseId: state.activeSessionExerciseId,
      exerciseId: exercise.id,
      exerciseName: exercise.canonicalName,
      weight: state.lastWeight,
      reps: intent.reps,
      count: 1
    }))
  };
};

export const handleCorrectReps: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "correct_last_set_reps") return null;

  const { conversationState: state } = ctx;
  if (!state.lastSetEntryId || !state.lastWeight) {
    return fail(FB_NO_LAST_SET_CORRECT, state);
  }

  await updateSetEntry(state.lastSetEntryId, { weight: state.lastWeight, reps: intent.reps });
  const updated: VoiceConversationState = {
    ...state,
    lastReps: intent.reps,
    lastFeedback: fbCorrectedReps(state.lastWeight, intent.reps)
  };
  await setVoiceConversationState(updated);
  return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
};

export const handleCorrectWeight: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "correct_last_set_weight") return null;

  const { conversationState: state } = ctx;
  if (!state.lastSetEntryId || !state.lastReps) {
    return fail(FB_NO_LAST_SET_CORRECT, state);
  }

  await updateSetEntry(state.lastSetEntryId, { weight: intent.weight, reps: state.lastReps });
  const updated: VoiceConversationState = {
    ...state,
    lastWeight: intent.weight,
    lastFeedback: fbCorrectedWeight(intent.weight, state.lastReps)
  };
  await setVoiceConversationState(updated);
  return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
};

export const handleDeleteLastSet: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "delete_last_set") return null;

  const { conversationState: state } = ctx;
  if (!state.activeSessionExerciseId) {
    return fail(FB_NO_LAST_SET_DELETE, state);
  }

  const deletedSet = await deleteLastSetEntry(state.activeSessionExerciseId);
  if (!deletedSet) return fail(FB_NO_SETS_TO_DELETE, state);

  const newLastSet = await getLastSetForSessionExercise(state.activeSessionExerciseId);
  const updated: VoiceConversationState = {
    ...state,
    lastSetEntryId: newLastSet?.id,
    lastWeight: newLastSet?.weight,
    lastReps: newLastSet?.reps,
    lastSetNumber: newLastSet?.setNumber,
    lastFeedback: FB_LAST_SET_DELETED
  };
  await setVoiceConversationState(updated);
  return { success: true, feedback: updated.lastFeedback!, conversationState: updated };
};

export const handleSwitchExercise: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "switch_exercise") return null;

  const parsed = await parseVoiceSet(intent.exerciseQuery);
  if (!parsed.canonicalExerciseId) {
    return fail(FB_EXERCISE_NOT_RECOGNIZED, ctx.conversationState);
  }

  const exercise = await getExerciseById(parsed.canonicalExerciseId);
  if (!exercise) return fail(FB_EXERCISE_NOT_FOUND, ctx.conversationState);
  return applySwitchExercise(exercise, ctx.conversationState);
};

export const handleCloseSession: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "close_session_pending") return null;

  const updated: VoiceConversationState = {
    ...ctx.conversationState,
    lastFeedback: FB_CLOSE_SESSION_CONFIRM
  };
  await setVoiceConversationState(updated);
  return {
    success: false,
    feedback: FB_CLOSE_SESSION_CONFIRM,
    conversationState: updated,
    sessionAction: "close_session_pending"
  };
};

export const handlePauseSession: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "pause_session") return null;

  const activeSession = await getActiveSessionForUser(ctx.userId);
  if (!activeSession || activeSession.status !== "active") {
    return fail(FB_NO_ACTIVE_SESSION_PAUSE, ctx.conversationState);
  }

  await pauseWorkoutSession(activeSession.id);
  const updated: VoiceConversationState = { ...ctx.conversationState, lastFeedback: FB_SESSION_PAUSED };
  await setVoiceConversationState(updated);
  return { success: true, feedback: FB_SESSION_PAUSED, conversationState: updated, sessionAction: "pause_session" };
};

export const handleResumeSession: IntentHandler = async (ctx) => {
  const { quickIntent: intent } = ctx;
  if (intent?.type !== "resume_session") return null;

  const session = await getActiveSessionForUser(ctx.userId);
  if (!session || session.status !== "paused") {
    return fail(FB_NO_PAUSED_SESSION, ctx.conversationState);
  }

  await resumeWorkoutSession(session.id);
  const updated: VoiceConversationState = { ...ctx.conversationState, lastFeedback: FB_SESSION_RESUMED };
  await setVoiceConversationState(updated);
  return { success: true, feedback: FB_SESSION_RESUMED, conversationState: updated, sessionAction: "resume_session" };
};

export const handleMultiSet: IntentHandler = async (ctx) => {
  const multiSet = await parseMultiSetCommand(ctx.rawText);
  if (!multiSet || multiSet.entries.length < 2) return null;

  const exerciseId = multiSet.canonicalExerciseId ?? ctx.conversationState.activeExerciseId;
  if (!exerciseId) {
    return fail(FB_MULTI_SET_NO_EXERCISE, ctx.conversationState);
  }

  const exercise = await getExerciseById(exerciseId);
  if (!exercise) return fail(FB_EXERCISE_NOT_FOUND, ctx.conversationState);

  const activeSession = await ensureActiveSession(ctx.userId);
  const sessionExercise = await addExerciseToSession(activeSession.id, exercise);

  let lastSet: Awaited<ReturnType<typeof addSetEntry>> | undefined;
  for (const entry of multiSet.entries) {
    lastSet = await addSetEntry({
      sessionExerciseId: sessionExercise.id,
      weight: entry.weight,
      reps: entry.reps,
      inputMode: "voice"
    });
  }

  const detail = multiSet.entries.map((e) => `${e.weight}x${e.reps}`).join(", ");
  const feedback = fbMultiSetDetail(exercise.canonicalName, multiSet.entries.length, detail);

  const updated = buildUpdatedConversationState({
    sessionId: activeSession.id,
    sessionExerciseId: sessionExercise.id,
    exerciseId: exercise.id,
    setEntryId: lastSet?.id,
    lastWeight: lastSet?.weight,
    lastReps: lastSet?.reps,
    lastSetNumber: lastSet?.setNumber,
    lastFeedback: feedback
  });
  await setVoiceConversationState(updated);
  return { success: true, feedback, conversationState: updated };
};

export const handleFullParse: IntentHandler = async (ctx) => {
  const { rawText, userId, conversationState: state } = ctx;
  const parsedVoiceSet: ParsedVoiceSet = await parseVoiceSet(rawText);
  const candidateNames = parsedVoiceSet.candidateExerciseIds
    ? (await Promise.all(parsedVoiceSet.candidateExerciseIds.map((id) => getExerciseById(id))))
        .filter(Boolean)
        .map((ex) => ex!.canonicalName)
    : [];

  if (parsedVoiceSet.canonicalExerciseId && !parsedVoiceSet.weight && !parsedVoiceSet.reps && !parsedVoiceSet.setCount) {
    const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
    if (exercise) return applySwitchExercise(exercise, state);
  }

  if (
    parsedVoiceSet.setCount &&
    !parsedVoiceSet.weight &&
    !parsedVoiceSet.reps &&
    state.activeSessionExerciseId &&
    state.activeExerciseId &&
    state.lastWeight !== undefined &&
    state.lastReps !== undefined
  ) {
    const activeSession = await ensureActiveSession(userId);
    const exercise = await getExerciseById(state.activeExerciseId);
    if (!exercise) return fail(FB_ACTIVE_EXERCISE_NOT_FOUND, state);
    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: state.activeSessionExerciseId,
        exerciseId: exercise.id,
        exerciseName: exercise.canonicalName,
        weight: state.lastWeight,
        reps: state.lastReps,
        count: parsedVoiceSet.setCount
      }))
    };
  }

  if (
    parsedVoiceSet.weight !== undefined &&
    parsedVoiceSet.reps !== undefined &&
    !parsedVoiceSet.canonicalExerciseId &&
    state.activeSessionExerciseId &&
    state.activeExerciseId
  ) {
    const activeSession = await ensureActiveSession(userId);
    const exercise = await getExerciseById(state.activeExerciseId);
    if (!exercise) return fail(FB_ACTIVE_EXERCISE_NOT_FOUND, state);
    return {
      success: true,
      ...(await saveSetBatch({
        sessionId: activeSession.id,
        sessionExerciseId: state.activeSessionExerciseId,
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
      feedback: parsedVoiceSet.feedbackMessage ?? FB_COMMAND_NEEDS_CONFIRM,
      requiresConfirmation: true,
      parsedVoiceSet,
      candidateNames,
      conversationState: state
    };
  }

  const activeSession = await ensureActiveSession(userId);
  const exercise = await getExerciseById(parsedVoiceSet.canonicalExerciseId);
  if (!exercise) return fail(FB_EXERCISE_NOT_FOUND, state);

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
// Handler pipeline — order matters: quick intents first, then multi-set, then full parse
// ---------------------------------------------------------------------------

export const intentHandlers: IntentHandler[] = [
  handleRepeatLastSet,
  handleRepeatWithReps,
  handleCorrectReps,
  handleCorrectWeight,
  handleDeleteLastSet,
  handleSwitchExercise,
  handleCloseSession,
  handlePauseSession,
  handleResumeSession,
  handleMultiSet,
  handleFullParse
];
