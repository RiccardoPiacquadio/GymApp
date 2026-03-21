import { db } from "../../../db";
import type { SetEntry } from "../../../types";

/** Epley formula: 1RM = weight × (1 + reps / 30) */
export const estimateOneRepMax = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
};

export type OneRepMaxDataPoint = {
  date: string;
  estimated1RM: number;
  weight: number;
  reps: number;
};

/**
 * Get the estimated 1RM history for an exercise across all completed sessions.
 * Returns the best estimated 1RM per session date.
 */
export const getOneRepMaxHistory = async (
  userId: string,
  canonicalExerciseId: string
): Promise<OneRepMaxDataPoint[]> => {
  const sessions = await db.workoutSessions
    .where({ userId, status: "completed" })
    .toArray();
  if (sessions.length === 0) return [];

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const sessionIds = sessions.map((s) => s.id);

  const sessionExercises = (
    await db.sessionExercises
      .where("canonicalExerciseId")
      .equals(canonicalExerciseId)
      .toArray()
  ).filter((se) => sessionMap.has(se.sessionId));

  if (sessionExercises.length === 0) return [];

  const seIds = sessionExercises.map((se) => se.id);
  const sets = await db.setEntries
    .where("sessionExerciseId")
    .anyOf(seIds)
    .toArray();

  // Group sets by session
  const setsBySession = new Map<string, SetEntry[]>();
  const seToSession = new Map(sessionExercises.map((se) => [se.id, se.sessionId]));
  for (const set of sets) {
    const sessionId = seToSession.get(set.sessionExerciseId);
    if (!sessionId) continue;
    const arr = setsBySession.get(sessionId) ?? [];
    arr.push(set);
    setsBySession.set(sessionId, arr);
  }

  // For each session, find the best estimated 1RM
  const results: OneRepMaxDataPoint[] = [];
  for (const [sessionId, sessionSets] of setsBySession) {
    const session = sessionMap.get(sessionId);
    if (!session) continue;

    let best = { e1rm: 0, weight: 0, reps: 0 };
    for (const s of sessionSets) {
      const e1rm = estimateOneRepMax(s.weight, s.reps);
      if (e1rm > best.e1rm) {
        best = { e1rm, weight: s.weight, reps: s.reps };
      }
    }

    if (best.e1rm > 0) {
      results.push({
        date: session.startedAt.slice(0, 10),
        estimated1RM: best.e1rm,
        weight: best.weight,
        reps: best.reps
      });
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
};
