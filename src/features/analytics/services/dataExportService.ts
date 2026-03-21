import { db } from "../../../db";

/**
 * Export all workout data for a user as a JSON blob.
 */
export const exportUserDataAsJson = async (userId: string): Promise<string> => {
  const [sessions, sessionExercises, bodyWeight] = await Promise.all([
    db.workoutSessions.where("userId").equals(userId).toArray(),
    db.sessionExercises.toArray(),
    db.bodyWeightEntries.where("userId").equals(userId).toArray()
  ]);

  const sessionIds = new Set(sessions.map((s) => s.id));
  const filteredExercises = sessionExercises.filter((se) => sessionIds.has(se.sessionId));
  const seIds = filteredExercises.map((se) => se.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(seIds).toArray();

  const canonicals = await db.exerciseCanonicals.toArray();
  const canonicalMap = new Map(canonicals.map((c) => [c.id, c.canonicalName]));

  const data = {
    exportedAt: new Date().toISOString(),
    sessions: sessions.map((s) => ({
      id: s.id,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      status: s.status,
      exercises: filteredExercises
        .filter((se) => se.sessionId === s.id)
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
        .map((se) => ({
          name: canonicalMap.get(se.canonicalExerciseId) ?? se.displayNameAtLogTime,
          order: se.exerciseOrder,
          sets: sets
            .filter((set) => set.sessionExerciseId === se.id)
            .sort((a, b) => a.setNumber - b.setNumber)
            .map((set) => ({
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              setType: set.setType ?? "working",
              rpe: set.rpe,
              note: set.note
            }))
        }))
    })),
    bodyWeight: bodyWeight.map((e) => ({ date: e.date, weight: e.weight }))
  };

  return JSON.stringify(data, null, 2);
};

/**
 * Export all workout data as CSV.
 */
export const exportUserDataAsCsv = async (userId: string): Promise<string> => {
  const sessions = await db.workoutSessions.where("userId").equals(userId).toArray();
  const sessionIds = new Set(sessions.map((s) => s.id));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const sessionExercises = (await db.sessionExercises.toArray()).filter(
    (se) => sessionIds.has(se.sessionId)
  );
  const seIds = sessionExercises.map((se) => se.id);
  const sets = await db.setEntries.where("sessionExerciseId").anyOf(seIds).toArray();

  const canonicals = await db.exerciseCanonicals.toArray();
  const canonicalMap = new Map(canonicals.map((c) => [c.id, c.canonicalName]));
  const seMap = new Map(sessionExercises.map((se) => [se.id, se]));

  const rows: string[] = ["Date,Exercise,Set,Weight (kg),Reps,Set Type,RPE,Note"];

  for (const set of sets.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const se = seMap.get(set.sessionExerciseId);
    if (!se) continue;
    const session = sessionMap.get(se.sessionId);
    if (!session) continue;
    const name = canonicalMap.get(se.canonicalExerciseId) ?? se.displayNameAtLogTime;
    const date = session.startedAt.slice(0, 10);
    const note = (set.note ?? "").replace(/"/g, '""');
    rows.push(
      `${date},"${name}",${set.setNumber},${set.weight},${set.reps},${set.setType ?? "working"},${set.rpe ?? ""},${note ? `"${note}"` : ""}`
    );
  }

  return rows.join("\n");
};

/** Trigger a file download in the browser */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
