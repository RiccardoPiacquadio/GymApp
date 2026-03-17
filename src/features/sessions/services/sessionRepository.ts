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
  WorkoutSession,
  WorkoutSessionWithSummary
} from "../../../types";

export const getActiveSessionForUser = (userId: string) =>
  db.workoutSessions.where({ userId, status: "active" }).first();

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

export const completeWorkoutSession = async (sessionId: string) => {
  const current = await db.workoutSessions.get(sessionId);
  if (!current) {
    return;
  }

  const now = toIsoNow();
  await db.workoutSessions.update(sessionId, {
    status: "completed",
    endedAt: now,
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

export const getSessionExercises = async (sessionId: string): Promise<SessionExerciseBundle[]> => {
  const sessionExercises = await db.sessionExercises
    .where("sessionId")
    .equals(sessionId)
    .sortBy("exerciseOrder");
  const exerciseIds = sessionExercises.map((item) => item.canonicalExerciseId);
  const exercises = await db.exerciseCanonicals.bulkGet(exerciseIds);
  const exerciseMap = new Map(exercises.filter(Boolean).map((item) => [item!.id, item!]));
  const sets = await db.setEntries.toArray();

  return sessionExercises.map((sessionExercise) => ({
    sessionExercise,
    exercise: exerciseMap.get(sessionExercise.canonicalExerciseId)!,
    sets: sets
      .filter((entry) => entry.sessionExerciseId === sessionExercise.id)
      .sort((left, right) => left.setNumber - right.setNumber)
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
    createdAt: now,
    updatedAt: now
  };

  await db.setEntries.add(record);
  return record;
};

export const updateSetEntry = async (
  setEntryId: string,
  payload: Pick<SetEntry, "reps" | "weight">
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
  const sessionExercises = await db.sessionExercises.toArray();
  const sets = await db.setEntries.toArray();

  return sessions
    .sort((left, right) => +new Date(right.startedAt) - +new Date(left.startedAt))
    .map((session) => {
      const linkedExercises = sessionExercises.filter((item) => item.sessionId === session.id);
      const linkedExerciseIds = new Set(linkedExercises.map((item) => item.id));
      const linkedSets = sets.filter((entry) => linkedExerciseIds.has(entry.sessionExerciseId));

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
