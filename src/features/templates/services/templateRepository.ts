import { db } from "../../../db";
import { toIsoNow } from "../../../lib/dates";
import { createId } from "../../../lib/ids";
import type {
  ExerciseCanonical,
  SessionExercise,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateBundle,
  WorkoutTemplateExercise
} from "../../../types";

// ─── Queries ────────────────────────────────────────────────────────────────

export const getTemplatesForUser = async (userId: string): Promise<WorkoutTemplateBundle[]> => {
  const templates = await db.workoutTemplates.where("userId").equals(userId).toArray();
  const templateIds = templates.map((t) => t.id);
  const templateExercises = await db.workoutTemplateExercises
    .where("templateId")
    .anyOf(templateIds)
    .toArray();

  const canonicalIds = [...new Set(templateExercises.map((te) => te.canonicalExerciseId))];
  const canonicals = await db.exerciseCanonicals.bulkGet(canonicalIds);
  const canonicalMap = new Map(canonicals.filter(Boolean).map((c) => [c!.id, c!]));

  const exercisesByTemplate = new Map<string, (WorkoutTemplateExercise & { exercise: ExerciseCanonical })[]>();
  for (const te of templateExercises) {
    const exercise = canonicalMap.get(te.canonicalExerciseId);
    if (!exercise) continue;
    const arr = exercisesByTemplate.get(te.templateId) ?? [];
    arr.push({ ...te, exercise });
    exercisesByTemplate.set(te.templateId, arr);
  }

  return templates
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((template) => ({
      template,
      exercises: (exercisesByTemplate.get(template.id) ?? []).sort(
        (a, b) => a.exerciseOrder - b.exerciseOrder
      )
    }));
};

export const getTemplateById = async (templateId: string): Promise<WorkoutTemplateBundle | null> => {
  const template = await db.workoutTemplates.get(templateId);
  if (!template) return null;

  const templateExercises = await db.workoutTemplateExercises
    .where("templateId")
    .equals(templateId)
    .sortBy("exerciseOrder");

  const canonicalIds = templateExercises.map((te) => te.canonicalExerciseId);
  const canonicals = await db.exerciseCanonicals.bulkGet(canonicalIds);
  const canonicalMap = new Map(canonicals.filter(Boolean).map((c) => [c!.id, c!]));

  return {
    template,
    exercises: templateExercises
      .filter((te) => canonicalMap.has(te.canonicalExerciseId))
      .map((te) => ({ ...te, exercise: canonicalMap.get(te.canonicalExerciseId)! }))
  };
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const createTemplate = async (userId: string, name: string): Promise<WorkoutTemplate> => {
  const now = toIsoNow();
  const template: WorkoutTemplate = {
    id: createId(),
    userId,
    name: name.trim(),
    createdAt: now,
    updatedAt: now
  };
  await db.workoutTemplates.add(template);
  return template;
};

export const renameTemplate = async (templateId: string, name: string) => {
  await db.workoutTemplates.update(templateId, { name: name.trim(), updatedAt: toIsoNow() });
};

export const deleteTemplate = async (templateId: string) => {
  await db.transaction("rw", [db.workoutTemplates, db.workoutTemplateExercises], async () => {
    await db.workoutTemplateExercises.where("templateId").equals(templateId).delete();
    await db.workoutTemplates.delete(templateId);
  });
};

export const addExerciseToTemplate = async (
  templateId: string,
  exercise: ExerciseCanonical
): Promise<WorkoutTemplateExercise> => {
  const existing = await db.workoutTemplateExercises
    .where({ templateId, canonicalExerciseId: exercise.id })
    .first();
  if (existing) return existing;

  const count = await db.workoutTemplateExercises.where("templateId").equals(templateId).count();
  const record: WorkoutTemplateExercise = {
    id: createId(),
    templateId,
    canonicalExerciseId: exercise.id,
    exerciseOrder: count + 1,
    createdAt: toIsoNow()
  };
  await db.workoutTemplateExercises.add(record);
  return record;
};

export const removeExerciseFromTemplate = async (templateExerciseId: string) => {
  const entry = await db.workoutTemplateExercises.get(templateExerciseId);
  if (!entry) return;

  await db.transaction("rw", db.workoutTemplateExercises, async () => {
    await db.workoutTemplateExercises.delete(templateExerciseId);
    const remaining = await db.workoutTemplateExercises
      .where("templateId")
      .equals(entry.templateId)
      .sortBy("exerciseOrder");
    await Promise.all(
      remaining.map((item, i) =>
        db.workoutTemplateExercises.update(item.id, { exerciseOrder: i + 1 })
      )
    );
  });
};

// ─── Start session from template ────────────────────────────────────────────

export const startSessionFromTemplate = async (
  userId: string,
  templateId: string
): Promise<WorkoutSession> => {
  const bundle = await getTemplateById(templateId);
  if (!bundle) throw new Error("Template not found");

  const now = toIsoNow();
  const session: WorkoutSession = {
    id: createId(),
    userId,
    startedAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now
  };

  const sessionExercises: SessionExercise[] = bundle.exercises.map((te, i) => ({
    id: createId(),
    sessionId: session.id,
    canonicalExerciseId: te.canonicalExerciseId,
    displayNameAtLogTime: te.exercise.canonicalName,
    exerciseOrder: i + 1,
    createdAt: now
  }));

  await db.transaction("rw", [db.workoutSessions, db.sessionExercises], async () => {
    await db.workoutSessions.add(session);
    await db.sessionExercises.bulkAdd(sessionExercises);
  });

  return session;
};
