import { db } from "../../../db";
import { daysAgoIso, formatDate } from "../../../lib/dates";
import { getSetVolume, sum } from "../../../lib/math";
import type {
  ExerciseHistoryPoint,
  FrequencyPoint,
  SessionVolumePoint,
  TimeSeriesPoint
} from "../types/analytics";

const getCompletedSessions = async (userId: string) =>
  db.workoutSessions.where({ userId, status: "completed" }).toArray();

export const getSessionTotalVolume = async (sessionId: string) => {
  const sessionExercises = await db.sessionExercises.where("sessionId").equals(sessionId).toArray();
  const ids = sessionExercises.map((item) => item.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(ids).toArray();
  return sum(sets.map((entry) => getSetVolume(entry.weight, entry.reps)));
};

export const getSessionTotalSets = async (sessionId: string) => {
  const sessionExercises = await db.sessionExercises.where("sessionId").equals(sessionId).toArray();
  const ids = sessionExercises.map((item) => item.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(ids).toArray();
  return sets.length;
};

export const getExerciseHistory = async (
  userId: string,
  canonicalExerciseId: string
): Promise<ExerciseHistoryPoint[]> => {
  const sessions = await getCompletedSessions(userId);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const sessionExercises = await db.sessionExercises.where("canonicalExerciseId").equals(canonicalExerciseId).toArray();
  const filtered = sessionExercises.filter((item) => sessionMap.has(item.sessionId));
  const filteredIds = filtered.map((item) => item.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(filteredIds).toArray();
  const setsByExercise = new Map<string, typeof sets>();
  for (const entry of sets) {
    const arr = setsByExercise.get(entry.sessionExerciseId) ?? [];
    arr.push(entry);
    setsByExercise.set(entry.sessionExerciseId, arr);
  }

  return filtered
    .map((item) => {
      const linkedSets = setsByExercise.get(item.id) ?? [];
      const session = sessionMap.get(item.sessionId)!;
      return {
        sessionId: session.id,
        sessionDate: session.startedAt,
        volume: sum(linkedSets.map((entry) => getSetVolume(entry.weight, entry.reps))),
        topWeight: Math.max(...linkedSets.map((entry) => entry.weight), 0),
        totalSets: linkedSets.length,
        totalReps: sum(linkedSets.map((entry) => entry.reps))
      };
    })
    .sort((left, right) => +new Date(left.sessionDate) - +new Date(right.sessionDate));
};

export const getExerciseVolumeSeries = async (
  userId: string,
  canonicalExerciseId: string
): Promise<TimeSeriesPoint[]> => {
  const history = await getExerciseHistory(userId, canonicalExerciseId);
  return history.map((item) => ({
    label: formatDate(item.sessionDate),
    value: item.volume,
    date: item.sessionDate
  }));
};

export const getExerciseTopWeightSeries = async (
  userId: string,
  canonicalExerciseId: string
): Promise<TimeSeriesPoint[]> => {
  const history = await getExerciseHistory(userId, canonicalExerciseId);
  return history.map((item) => ({
    label: formatDate(item.sessionDate),
    value: item.topWeight,
    date: item.sessionDate
  }));
};

export const getExerciseFrequencySeries = async (
  userId: string,
  canonicalExerciseId: string
): Promise<FrequencyPoint[]> => {
  const history = await getExerciseHistory(userId, canonicalExerciseId);
  const threshold30 = daysAgoIso(30);
  const threshold90 = daysAgoIso(90);
  return [
    { label: "30 giorni", value: history.filter((item) => item.sessionDate >= threshold30).length },
    { label: "90 giorni", value: history.filter((item) => item.sessionDate >= threshold90).length }
  ];
};

export const getExercisePersonalRecord = async (
  userId: string,
  canonicalExerciseId: string
): Promise<number> => {
  const history = await getExerciseHistory(userId, canonicalExerciseId);
  return Math.max(...history.map((item) => item.topWeight), 0);
};

export const getSessionVolumeSeries = async (userId: string): Promise<SessionVolumePoint[]> => {
  const sessions = await getCompletedSessions(userId);
  const sessionIds = sessions.map((s) => s.id);
  const allSessionExercises = await db.sessionExercises.where("sessionId").anyOf(sessionIds).toArray();
  const allExerciseIds = allSessionExercises.map((item) => item.id);
  const allSets = await db.setEntries.where("sessionExerciseId").anyOf(allExerciseIds).toArray();

  const exercisesBySession = new Map<string, string[]>();
  for (const item of allSessionExercises) {
    const arr = exercisesBySession.get(item.sessionId) ?? [];
    arr.push(item.id);
    exercisesBySession.set(item.sessionId, arr);
  }

  const setsByExercise = new Map<string, typeof allSets>();
  for (const entry of allSets) {
    const arr = setsByExercise.get(entry.sessionExerciseId) ?? [];
    arr.push(entry);
    setsByExercise.set(entry.sessionExerciseId, arr);
  }

  return sessions
    .map((session) => {
      const exerciseIds = exercisesBySession.get(session.id) ?? [];
      const linkedSets = exerciseIds.flatMap((id) => setsByExercise.get(id) ?? []);
      return {
        sessionId: session.id,
        sessionDate: session.startedAt,
        totalVolume: sum(linkedSets.map((entry) => getSetVolume(entry.weight, entry.reps)))
      };
    })
    .sort((left, right) => +new Date(left.sessionDate) - +new Date(right.sessionDate));
};
