import Dexie, { Table } from "dexie";
import type {
  AppSetting,
  ExerciseAlias,
  ExerciseCanonical,
  SessionExercise,
  SetEntry,
  UserProfile,
  WorkoutSession
} from "../types";

export class GymAppDatabase extends Dexie {
  userProfiles!: Table<UserProfile, string>;
  exerciseCanonicals!: Table<ExerciseCanonical, string>;
  exerciseAliases!: Table<ExerciseAlias, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  sessionExercises!: Table<SessionExercise, string>;
  setEntries!: Table<SetEntry, string>;
  appSettings!: Table<AppSetting, string>;

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
  }
}

export const db = new GymAppDatabase();
