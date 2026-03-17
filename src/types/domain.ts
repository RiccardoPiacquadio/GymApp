export type UserProfile = {
  id: string;
  displayName: string;
  normalizedDisplayName: string;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseCanonical = {
  id: string;
  canonicalName: string;
  slug: string;
  category?: string;
  primaryMuscle?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseAlias = {
  id: string;
  canonicalExerciseId: string;
  aliasText: string;
  normalizedAliasText: string;
  language: "it" | "en";
  createdAt: string;
};

export type WorkoutSessionStatus = "active" | "completed";

export type WorkoutSession = {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  status: WorkoutSessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type SessionExercise = {
  id: string;
  sessionId: string;
  canonicalExerciseId: string;
  displayNameAtLogTime: string;
  exerciseOrder: number;
  createdAt: string;
};

export type SetEntryInputMode = "manual" | "voice";

export type SetEntry = {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  inputMode: SetEntryInputMode;
  createdAt: string;
  updatedAt: string;
};

export type AppSetting = {
  key: string;
  value: string;
};

export type SessionExerciseBundle = {
  sessionExercise: SessionExercise;
  exercise: ExerciseCanonical;
  sets: SetEntry[];
};

export type WorkoutSessionWithSummary = WorkoutSession & {
  totalExercises: number;
  totalSets: number;
  totalVolume: number;
};
