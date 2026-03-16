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
  const exerciseIds = new Set(sessionExercises.map((item) => item.id));
  const sets = await db.setEntries.toArray();
  return sum(
    sets
      .filter((entry) => exerciseIds.has(entry.sessionExerciseId))
      .map((entry) => getSetVolume(entry.weight, entry.reps))
  );
};

export const getSessionTotalSets = async (sessionId: string) => {
  const sessionExercises = await db.sessionExercises.where("sessionId").equals(sessionId).toArray();
  const exerciseIds = new Set(sessionExercises.map((item) => item.id));
  const sets = await db.setEntries.toArray();
  return sets.filter((entry) => exerciseIds.has(entry.sessionExerciseId)).length;
};

export const getExerciseHistory = async (
  userId: string,
  canonicalExerciseId: string
): Promise<ExerciseHistoryPoint[]> => {
  const sessions = await getCompletedSessions(userId);
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const sessionExercises = await db.sessionExercises.where("canonicalExerciseId").equals(canonicalExerciseId).toArray();
  const filtered = sessionExercises.filter((item) => sessionMap.has(item.sessionId));
  const sets = await db.setEntries.toArray();

  return filtered
    .map((item) => {
      const linkedSets = sets.filter((entry) => entry.sessionExerciseId === item.id);
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

export const getExerciseFrequency = async (
  userId: string,
  canonicalExerciseId: string,
  days: number
): Promise<number> => {
  const history = await getExerciseHistory(userId, canonicalExerciseId);
  const threshold = daysAgoIso(days);
  return history.filter((item) => item.sessionDate >= threshold).length;
};

export const getExerciseFrequencySeries = async (
  userId: string,
  canonicalExerciseId: string
): Promise<FrequencyPoint[]> => [
  { label: "30 giorni", value: await getExerciseFrequency(userId, canonicalExerciseId, 30) },
  { label: "90 giorni", value: await getExerciseFrequency(userId, canonicalExerciseId, 90) }
];

export const getSessionVolumeSeries = async (userId: string): Promise<SessionVolumePoint[]> => {
  const sessions = await getCompletedSessions(userId);
  return (
    await Promise.all(
      sessions.map(async (session) => ({
        sessionId: session.id,
        sessionDate: session.startedAt,
        totalVolume: await getSessionTotalVolume(session.id)
      }))
    )
  ).sort((left, right) => +new Date(left.sessionDate) - +new Date(right.sessionDate));
};
