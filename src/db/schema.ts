import Dexie, { Table } from "dexie";
import { normalizeText } from "../lib/normalize";
import type {
  AppSetting,
  BodyWeightEntry,
  ExerciseAlias,
  ExerciseCanonical,
  SessionExercise,
  SetEntry,
  UserProfile,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateExercise
} from "../types";

export class GymAppDatabase extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  exerciseCanonicals!: Table<ExerciseCanonical, string>;
  exerciseAliases!: Table<ExerciseAlias, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  sessionExercises!: Table<SessionExercise, string>;
  setEntries!: Table<SetEntry, string>;
  appSettings!: Table<AppSetting, string>;
  workoutTemplates!: Table<WorkoutTemplate, string>;
  workoutTemplateExercises!: Table<WorkoutTemplateExercise, string>;
  bodyWeightEntries!: Table<BodyWeightEntry, string>;

  constructor() {
    super("gymapp-db");

    this.version(1).stores({
      userProfiles: "id, displayName, createdAt, updatedAt",
      exerciseCanonicals: "id, slug, canonicalName, createdAt, updatedAt",
      exerciseAliases: "id, canonicalExerciseId, normalizedAliasText, language, createdAt",
      workoutSessions: "id, userId, startedAt, endedAt, status, createdAt, updatedAt",
      sessionExercises: "id, sessionId, canonicalExerciseId, exerciseOrder, createdAt",
      setEntries: "id, sessionExerciseId, setNumber, reps, weight, inputMode, createdAt, updatedAt",
      appSettings: "key"
    });

    this.version(2)
      .stores({
        userProfiles: "id, displayName, normalizedDisplayName, createdAt, updatedAt",
        exerciseCanonicals: "id, slug, canonicalName, createdAt, updatedAt",
        exerciseAliases: "id, canonicalExerciseId, normalizedAliasText, language, createdAt",
        workoutSessions: "id, userId, startedAt, endedAt, status, createdAt, updatedAt",
        sessionExercises: "id, sessionId, canonicalExerciseId, exerciseOrder, createdAt",
        setEntries: "id, sessionExerciseId, setNumber, reps, weight, inputMode, createdAt, updatedAt",
        appSettings: "key"
      })
      .upgrade((tx) =>
        tx
          .table("userProfiles")
          .toCollection()
          .modify((profile: Partial<UserProfile>) => {
            profile.normalizedDisplayName = normalizeText(profile.displayName ?? "");
          })
      );

    this.version(3).stores({
      userProfiles: "id, displayName, normalizedDisplayName, createdAt, updatedAt",
      exerciseCanonicals: "id, slug, canonicalName, createdAt, updatedAt",
      exerciseAliases: "id, canonicalExerciseId, normalizedAliasText, language, createdAt",
      workoutSessions: "id, userId, startedAt, endedAt, status, createdAt, updatedAt",
      sessionExercises: "id, sessionId, canonicalExerciseId, exerciseOrder, createdAt",
      setEntries: "id, sessionExerciseId, setNumber, reps, weight, inputMode, createdAt, updatedAt",
      appSettings: "key",
      workoutTemplates: "id, userId, name",
      workoutTemplateExercises: "id, templateId, canonicalExerciseId, exerciseOrder"
    });

    // v4: body weight tracking, set type/rpe/note fields
    this.version(4).stores({
      userProfiles: "id, displayName, normalizedDisplayName, createdAt, updatedAt",
      exerciseCanonicals: "id, slug, canonicalName, createdAt, updatedAt",
      exerciseAliases: "id, canonicalExerciseId, normalizedAliasText, language, createdAt",
      workoutSessions: "id, userId, startedAt, endedAt, status, createdAt, updatedAt",
      sessionExercises: "id, sessionId, canonicalExerciseId, exerciseOrder, createdAt",
      setEntries: "id, sessionExerciseId, setNumber, reps, weight, inputMode, createdAt, updatedAt",
      appSettings: "key",
      workoutTemplates: "id, userId, name",
      workoutTemplateExercises: "id, templateId, canonicalExerciseId, exerciseOrder",
      bodyWeightEntries: "id, userId, date, createdAt"
    });
  }
}

export const db = new GymAppDatabase();
