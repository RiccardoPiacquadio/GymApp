import { db } from "../../../db";
import { formatDateTime, toIsoNow } from "../../../lib/dates";
import { createId } from "../../../lib/ids";
import { getSetVolume, sum } from "../../../lib/math";
import type {
  ExerciseCanonical,
  SessionExercise,
  SessionExerciseBundle,
  SetEntry,
  SetEntryInputMode,
  SetType,
  WorkoutSession,
  WorkoutSessionWithSummary
} from "../../../types";

export const getActiveSessionForUser = (userId: string) =>
  db.workoutSessions
    .where("userId")
    .equals(userId)
    .filter((s) => s.status === "active" || s.status === "paused")
    .first();

export const startWorkoutSession = async (userId: string) => {
  const existing = await getActiveSessionForUser(userId);
  if (existing) {
    return existing;
  }

  const now = toIsoNow();
  const session: WorkoutSession = {
    id: createId(),
    userId,
    startedAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now
  };

  await db.workoutSessions.add(session);
  return session;
};

export const pauseWorkoutSession = async (sessionId: string) => {
  const now = toIsoNow();
  await db.workoutSessions.update(sessionId, {
    status: "paused",
    pausedAt: now,
    updatedAt: now
  });
};

export const resumeWorkoutSession = async (sessionId: string) => {
  const session = await db.workoutSessions.get(sessionId);
  if (!session) return;

  const now = toIsoNow();
  const additionalPause = session.pausedAt
    ? Date.now() - new Date(session.pausedAt).getTime()
    : 0;

  await db.workoutSessions.update(sessionId, {
    status: "active",
    pausedAt: undefined,
    totalPausedMs: (session.totalPausedMs ?? 0) + additionalPause,
    updatedAt: now
  });
};

export const completeWorkoutSession = async (sessionId: string) => {
  const current = await db.workoutSessions.get(sessionId);
  if (!current) {
    return;
  }

  const now = toIsoNow();
  // If session was paused, accumulate the final pause segment before completing
  const finalPausedMs =
    current.status === "paused" && current.pausedAt
      ? (current.totalPausedMs ?? 0) + (Date.now() - new Date(current.pausedAt).getTime())
      : current.totalPausedMs;

  await db.workoutSessions.update(sessionId, {
    status: "completed",
    endedAt: now,
    totalPausedMs: finalPausedMs,
    pausedAt: undefined,
    updatedAt: now
  });
};

export const addExerciseToSession = async (
  sessionId: string,
  exercise: ExerciseCanonical
): Promise<SessionExercise> => {
  const existing = await db.sessionExercises
    .where({ sessionId, canonicalExerciseId: exercise.id })
    .first();
  if (existing) {
    return existing;
  }

  const exerciseOrder = await db.sessionExercises.where("sessionId").equals(sessionId).count();
  const record: SessionExercise = {
    id: createId(),
    sessionId,
    canonicalExerciseId: exercise.id,
    displayNameAtLogTime: exercise.canonicalName,
    exerciseOrder: exerciseOrder + 1,
    createdAt: toIsoNow()
  };

  await db.sessionExercises.add(record);
  return record;
};

export const getSessionExerciseById = (sessionExerciseId: string) =>
  db.sessionExercises.get(sessionExerciseId);

export const getSessionExerciseDetail = async (sessionExerciseId: string) => {
  const sessionExercise = await db.sessionExercises.get(sessionExerciseId);
  if (!sessionExercise) return null;

  const [session, exercise, sets] = await Promise.all([
    db.workoutSessions.get(sessionExercise.sessionId),
    db.exerciseCanonicals.get(sessionExercise.canonicalExerciseId),
    db.setEntries.where("sessionExerciseId").equals(sessionExercise.id).sortBy("setNumber")
  ]);

  return session && exercise ? { sessionExercise, session, exercise, sets } : null;
};

export const getSessionExerciseByExercise = (sessionId: string, exerciseId: string) =>
  db.sessionExercises.where({ sessionId, canonicalExerciseId: exerciseId }).first();

export const getSessionExercises = async (sessionId: string): Promise<SessionExerciseBundle[]> => {
  const sessionExercises = await db.sessionExercises
    .where("sessionId")
    .equals(sessionId)
    .sortBy("exerciseOrder");
  const exerciseIds = sessionExercises.map((item) => item.canonicalExerciseId);
  const exercises = await db.exerciseCanonicals.bulkGet(exerciseIds);
  const exerciseMap = new Map(exercises.filter(Boolean).map((item) => [item!.id, item!]));

  // Indexed query per session exercise — avoids loading ALL set entries
  const sessionExerciseIds = sessionExercises.map((item) => item.id);
  const sets = await db.setEntries
    .where("sessionExerciseId")
    .anyOf(sessionExerciseIds)
    .toArray();
  const setsByExercise = new Map<string, SetEntry[]>();
  for (const entry of sets) {
    const arr = setsByExercise.get(entry.sessionExerciseId) ?? [];
    arr.push(entry);
    setsByExercise.set(entry.sessionExerciseId, arr);
  }

  return sessionExercises
    .filter((sessionExercise) => exerciseMap.has(sessionExercise.canonicalExerciseId))
    .map((sessionExercise) => ({
    sessionExercise,
    exercise: exerciseMap.get(sessionExercise.canonicalExerciseId)!,
    sets: (setsByExercise.get(sessionExercise.id) ?? []).sort(
      (left, right) => left.setNumber - right.setNumber
    )
  }));
};

export const getLastSessionExercise = async (sessionId: string) => {
  const sessionExercises = await db.sessionExercises
    .where("sessionId")
    .equals(sessionId)
    .sortBy("exerciseOrder");
  return sessionExercises[sessionExercises.length - 1];
};

export const getLastSetForSessionExercise = async (sessionExerciseId: string) => {
  const sets = await db.setEntries
    .where("sessionExerciseId")
    .equals(sessionExerciseId)
    .sortBy("setNumber");
  return sets[sets.length - 1];
};

export const addSetEntry = async (params: {
  sessionExerciseId: string;
  reps: number;
  weight: number;
  inputMode: SetEntryInputMode;
  setType?: SetType;
  rpe?: number;
  note?: string;
}) => {
  const now = toIsoNow();
  const currentSets = await db.setEntries
    .where("sessionExerciseId")
    .equals(params.sessionExerciseId)
    .sortBy("setNumber");
  const record: SetEntry = {
    id: createId(),
    sessionExerciseId: params.sessionExerciseId,
    setNumber: currentSets.length + 1,
    reps: params.reps,
    weight: params.weight,
    inputMode: params.inputMode,
    setType: params.setType,
    rpe: params.rpe,
    note: params.note,
    createdAt: now,
    updatedAt: now
  };

  await db.setEntries.add(record);
  return record;
};

export const updateSetEntry = async (
  setEntryId: string,
  payload: Pick<SetEntry, "reps" | "weight"> & { setType?: SetType; rpe?: number; note?: string }
) => {
  await db.setEntries.update(setEntryId, {
    ...payload,
    updatedAt: toIsoNow()
  });
};

export const deleteSetEntry = async (setEntryId: string) => {
  const setEntry = await db.setEntries.get(setEntryId);
  if (!setEntry) {
    return;
  }

  await db.transaction("rw", db.setEntries, async () => {
    await db.setEntries.delete(setEntryId);
    const remaining = await db.setEntries
      .where("sessionExerciseId")
      .equals(setEntry.sessionExerciseId)
      .sortBy("setNumber");

    await Promise.all(
      remaining.map((entry, index) =>
        db.setEntries.update(entry.id, {
          setNumber: index + 1,
          updatedAt: toIsoNow()
        })
      )
    );
  });
};

export const deleteLastSetEntry = async (sessionExerciseId: string) => {
  const lastSet = await getLastSetForSessionExercise(sessionExerciseId);
  if (!lastSet) {
    return null;
  }

  await deleteSetEntry(lastSet.id);
  return lastSet;
};

export const getCompletedSessionsForUser = async (
  userId: string
): Promise<WorkoutSessionWithSummary[]> => {
  const sessions = await db.workoutSessions.where({ userId, status: "completed" }).toArray();
  const sessionIds = sessions.map((s) => s.id);
  const sessionExercises = await db.sessionExercises.where("sessionId").anyOf(sessionIds).toArray();
  const exerciseIds = sessionExercises.map((item) => item.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(exerciseIds).toArray();

  const exercisesBySession = new Map<string, typeof sessionExercises>();
  for (const item of sessionExercises) {
    const arr = exercisesBySession.get(item.sessionId) ?? [];
    arr.push(item);
    exercisesBySession.set(item.sessionId, arr);
  }

  const setsByExercise = new Map<string, SetEntry[]>();
  for (const entry of sets) {
    const arr = setsByExercise.get(entry.sessionExerciseId) ?? [];
    arr.push(entry);
    setsByExercise.set(entry.sessionExerciseId, arr);
  }

  return sessions
    .sort((left, right) => +new Date(right.startedAt) - +new Date(left.startedAt))
    .map((session) => {
      const linkedExercises = exercisesBySession.get(session.id) ?? [];
      const linkedSets = linkedExercises.flatMap((item) => setsByExercise.get(item.id) ?? []);

      return {
        ...session,
        totalExercises: linkedExercises.length,
        totalSets: linkedSets.length,
        totalVolume: sum(linkedSets.map((entry) => getSetVolume(entry.weight, entry.reps)))
      };
    });
};

export const getSessionSummary = async (sessionId: string) => {
  const bundles = await getSessionExercises(sessionId);
  const allSets = bundles.flatMap((bundle) => bundle.sets);

  return {
    totalExercises: bundles.length,
    totalSets: allSets.length,
    totalVolume: sum(allSets.map((entry) => getSetVolume(entry.weight, entry.reps)))
  };
};

export const getLatestExerciseSnapshot = async (userId: string, canonicalExerciseId: string) => {
  const sessions = await db.workoutSessions.where({ userId, status: "completed" }).toArray();
  const sessionIds = new Set(sessions.map((session) => session.id));
  const sessionExercises = (
    await db.sessionExercises.where("canonicalExerciseId").equals(canonicalExerciseId).toArray()
  ).filter((item) => sessionIds.has(item.sessionId));

  const latestSessionExercise = sessionExercises.sort((left, right) => {
    const leftSession = sessions.find((session) => session.id === left.sessionId);
    const rightSession = sessions.find((session) => session.id === right.sessionId);
    return +new Date(rightSession?.startedAt ?? 0) - +new Date(leftSession?.startedAt ?? 0);
  })[0];

  if (!latestSessionExercise) {
    return null;
  }

  const linkedSets = await db.setEntries
    .where("sessionExerciseId")
    .equals(latestSessionExercise.id)
    .sortBy("setNumber");
  const lastSet = linkedSets[linkedSets.length - 1];
  const session = sessions.find((item) => item.id === latestSessionExercise.sessionId);

  if (!lastSet || !session) {
    return null;
  }

  return {
    lastPerformedAt: formatDateTime(session.startedAt),
    lastWeight: lastSet.weight,
    lastReps: lastSet.reps
  };
};

export const getWorkoutSessionById = (sessionId: string) => db.workoutSessions.get(sessionId);
