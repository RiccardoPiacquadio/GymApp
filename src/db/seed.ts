import { seedExercises } from "./seedExercises";
import type { ExerciseAlias, ExerciseCanonical } from "../types";
import { toIsoNow } from "../lib/dates";
import { createId } from "../lib/ids";
import { normalizeExerciseInput } from "../lib/normalize";
import { db } from "./schema";
import { invalidateAliasCache } from "../features/exercises/services/aliasResolver";

const italianHints = new Set([
  "panca", "bilanciere", "manubri", "macchina", "croci", "petto", "piegamenti",
  "flessioni", "lento", "spalle", "alzate", "tirate", "viso", "mento", "trazioni",
  "rematore", "busto", "stacco", "rumeni", "gambe", "affondi", "femorali",
  "quadricipiti", "glutei", "seduto", "sdraiato", "inclinata", "declinata",
  "presa", "larga", "stretta", "corda", "sopra", "testa", "parallele",
  "addominali", "sbarra", "assistite", "multipower",
  // New from expanded catalog
  "abduttori", "adduttori", "accosciata", "addominale", "affondo", "alternato",
  "appeso", "arrampicata", "avanti", "bacino", "basso", "braccia", "braccio",
  "bulgaro", "calice", "camminata", "camminati", "cavaliere", "cavi", "cavo",
  "completi", "concentrazione", "diagonale", "distensioni", "dorsali",
  "estensione", "estensioni", "flesso", "frontale", "frontali", "ginocchia",
  "ginocchio", "girata", "indietro", "incrociato", "inverse", "inverso",
  "iperestensioni", "laterale", "laterali", "lombari", "mani", "monolaterale",
  "monopodalico", "nordico", "olimpico", "polpacci", "polsi", "posteriore",
  "posteriori", "pressa", "pronazione", "quadrupedico", "rollout", "ruota",
  "salita", "salto", "scale", "scalatore", "scrollate", "slancio", "slanci",
  "sollevamento", "spinta", "strappo", "supina", "supinazione", "tenuta",
  "torsioni", "trapezi", "tronco", "tuffo", "verticale"
]);

const englishHints = new Set([
  "bench", "press", "barbell", "dumbbell", "machine", "fly", "push", "pushup",
  "pushups", "shoulder", "military", "overhead", "raise", "rear", "delt", "face",
  "upright", "row", "lat", "pulldown", "pull", "pullup", "pullups", "chin",
  "cable", "low", "landmine", "pullover", "squat", "goblet", "leg", "hack",
  "bulgarian", "walking", "static", "split", "romanian", "rdl", "stiff",
  "deadlift", "sumo", "hip", "thrust", "bridge", "extension", "curl",
  "standing", "seated", "lying", "calf", "ez", "hammer", "incline",
  "preacher", "rope", "skull", "crusher", "dips", "dip", "crunch",
  "plank", "wheel", "assisted", "smith", "arnold",
  // New from expanded catalog
  "abdominal", "abduction", "abductor", "adduction", "adductor", "air",
  "alternating", "anterior", "arm", "australian", "backward", "banana",
  "bicycle", "block", "body", "bodyweight", "box", "burpee", "butterfly",
  "catch", "chest", "clean", "climb", "climber", "climbing", "closegrip",
  "concentration", "conventional", "converging", "crawl", "crossover",
  "curtsy", "decline", "diamond", "dirty", "dive", "dog", "donkey",
  "double", "elevated", "floor", "foot", "forward", "free", "front",
  "full", "gymnastic", "hamstring", "hand", "handstand", "hang", "hanging",
  "heel", "hex", "high", "hindu", "hold", "hollow", "horizontal",
  "hyperextension", "inverted", "isometric", "jack", "jackknife", "jerk",
  "jump", "jumping", "kettlebell", "kick", "kickback", "knee", "kneeling",
  "lateral", "lever", "lunge", "mountain", "muscle", "narrow", "natural",
  "neutral", "nordic", "nose", "olympic", "overhand", "parallel",
  "partial", "pelvic", "pistol", "planche", "plate", "plyometric",
  "power", "pressdown", "pronated", "prone", "pushdown", "quadruped",
  "rack", "rebound", "reverse", "ring", "rock", "rollout", "rotating",
  "runner", "running", "russian", "seal", "shrug", "side", "single",
  "skipping", "sled", "snatch", "spider", "stair", "star", "step",
  "straight", "strict", "supinated", "trap", "tricep", "triceps", "trunk",
  "underhand", "wall", "wide", "wrestler", "wrist", "zottman"
]);

const detectAliasLanguage = (aliasText: string): "it" | "en" => {
  const tokens = normalizeExerciseInput(aliasText).split(" ");
  if (tokens.some((token) => italianHints.has(token))) {
    return "it";
  }
  if (tokens.some((token) => englishHints.has(token))) {
    return "en";
  }
  return "en";
};

export const seedDatabase = async () => {
  const now = toIsoNow();
  const [existingCanonicals, existingAliases] = await Promise.all([
    db.exerciseCanonicals.toArray(),
    db.exerciseAliases.toArray()
  ]);

  const canonicalsBySlug = new Map(existingCanonicals.map((canonical) => [canonical.slug, canonical]));
  const aliasKeys = new Set(
    existingAliases.map((alias) => `${alias.canonicalExerciseId}:${alias.normalizedAliasText}`)
  );

  const canonicalsToPut: ExerciseCanonical[] = [];
  const aliasesToAdd: ExerciseAlias[] = [];

  for (const exercise of seedExercises) {
    const existingCanonical = canonicalsBySlug.get(exercise.slug);
    const canonicalId = existingCanonical?.id ?? createId();

    canonicalsToPut.push({
      id: canonicalId,
      canonicalName: exercise.canonicalName,
      slug: exercise.slug,
      createdAt: existingCanonical?.createdAt ?? now,
      updatedAt: now
    });

    const uniqueAliases = new Map<string, string>();
    for (const aliasText of exercise.aliases) {
      const normalizedAliasText = normalizeExerciseInput(aliasText);
      if (!normalizedAliasText) {
        continue;
      }
      if (!uniqueAliases.has(normalizedAliasText)) {
        uniqueAliases.set(normalizedAliasText, aliasText);
      }
    }

    for (const [normalizedAliasText, aliasText] of uniqueAliases.entries()) {
      const aliasKey = `${canonicalId}:${normalizedAliasText}`;
      if (aliasKeys.has(aliasKey)) {
        continue;
      }

      aliasesToAdd.push({
        id: createId(),
        canonicalExerciseId: canonicalId,
        aliasText,
        normalizedAliasText,
        language: detectAliasLanguage(aliasText),
        createdAt: now
      });
      aliasKeys.add(aliasKey);
    }
  }

  await db.transaction("rw", db.exerciseCanonicals, db.exerciseAliases, async () => {
    await db.exerciseCanonicals.bulkPut(canonicalsToPut);
    if (aliasesToAdd.length > 0) {
      await db.exerciseAliases.bulkAdd(aliasesToAdd);
    }
  });

  invalidateAliasCache();
};
