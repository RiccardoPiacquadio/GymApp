import type { ExerciseAlias, ExerciseCanonical } from "../types";
import { toIsoNow } from "../lib/dates";
import { createId } from "../lib/ids";
import { normalizeExerciseInput } from "../lib/normalize";
import { db } from "./schema";

type SeedExercise = {
  canonicalName: string;
  slug: string;
  aliases: Array<{ text: string; language: "it" | "en" }>;
};

const seedExercises: SeedExercise[] = [
  {
    canonicalName: "Bench Press",
    slug: "bench_press_flat_barbell",
    aliases: [
      { text: "panca piana", language: "it" },
      { text: "bench press", language: "en" },
      { text: "barbell bench press", language: "en" },
      { text: "panca bilanciere", language: "it" }
    ]
  },
  {
    canonicalName: "Shoulder Press",
    slug: "shoulder_press",
    aliases: [
      { text: "shoulder press", language: "en" },
      { text: "military press", language: "en" },
      { text: "lento avanti", language: "it" },
      { text: "overhead press", language: "en" }
    ]
  },
  {
    canonicalName: "Squat",
    slug: "barbell_back_squat",
    aliases: [
      { text: "squat", language: "en" },
      { text: "back squat", language: "en" },
      { text: "squat bilanciere", language: "it" }
    ]
  },
  {
    canonicalName: "Deadlift",
    slug: "deadlift",
    aliases: [
      { text: "deadlift", language: "en" },
      { text: "stacco", language: "it" },
      { text: "stacco da terra", language: "it" }
    ]
  },
  {
    canonicalName: "Lat Pulldown",
    slug: "lat_pulldown",
    aliases: [
      { text: "lat machine", language: "it" },
      { text: "lat pulldown", language: "en" },
      { text: "pulley alto", language: "it" }
    ]
  },
  {
    canonicalName: "Barbell Row",
    slug: "barbell_row",
    aliases: [
      { text: "rematore bilanciere", language: "it" },
      { text: "barbell row", language: "en" },
      { text: "bent over row", language: "en" }
    ]
  },
  {
    canonicalName: "Dumbbell Curl",
    slug: "dumbbell_curl",
    aliases: [
      { text: "curl manubri", language: "it" },
      { text: "dumbbell curl", language: "en" },
      { text: "biceps curl", language: "en" }
    ]
  },
  {
    canonicalName: "Triceps Pushdown",
    slug: "triceps_pushdown",
    aliases: [
      { text: "pushdown tricipiti", language: "it" },
      { text: "triceps pushdown", language: "en" },
      { text: "cavo tricipiti", language: "it" }
    ]
  }
];

export const seedDatabase = async () => {
  const canonicalCount = await db.exerciseCanonicals.count();
  if (canonicalCount > 0) {
    return;
  }

  const now = toIsoNow();
  const canonicals: ExerciseCanonical[] = [];
  const aliases: ExerciseAlias[] = [];

  for (const exercise of seedExercises) {
    const canonicalId = createId();
    canonicals.push({
      id: canonicalId,
      canonicalName: exercise.canonicalName,
      slug: exercise.slug,
      createdAt: now,
      updatedAt: now
    });

    aliases.push(
      ...exercise.aliases.map((alias) => ({
        id: createId(),
        canonicalExerciseId: canonicalId,
        aliasText: alias.text,
        normalizedAliasText: normalizeExerciseInput(alias.text),
        language: alias.language,
        createdAt: now
      }))
    );
  }

  await db.transaction("rw", db.exerciseCanonicals, db.exerciseAliases, async () => {
    await db.exerciseCanonicals.bulkAdd(canonicals);
    await db.exerciseAliases.bulkAdd(aliases);
  });
};
