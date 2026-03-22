import { SEED_EXERCISES } from "./seedExercises";
import type { ExerciseAlias, ExerciseCanonical } from "../types";
import { toIsoNow } from "../lib/dates";
import { createId } from "../lib/ids";
import { normalizeExerciseInput } from "../lib/normalize";
import { db } from "./schema";
import { invalidateAliasCache } from "../features/exercises/services/aliasResolver";

const italianHints = new Set([
  // Equipment & tools
  "bilanciere", "manubri", "manubrio", "macchina", "cavo", "cavi", "elastico",
  "banda", "multipower", "girya", "fitball", "palla", "corda",
  // Body parts
  "petto", "spalle", "braccia", "braccio", "gambe", "gamba", "glutei",
  "femorali", "quadricipiti", "polpacci", "addominali", "dorsali", "lombari",
  "trapezi", "tricipiti", "polsi", "busto", "tronco", "schiena", "bacino",
  "ginocchia", "ginocchio", "mento", "anche", "mani", "palmi",
  // Movement types
  "alzate", "tirate", "tirata", "trazioni", "rematore", "stacco", "croci",
  "spinte", "spinta", "distensioni", "estensioni", "estensione", "flessioni",
  "flessione", "piegamenti", "scrollate", "slancio", "slanci", "sollevamento",
  "sollevamenti", "lento", "girata", "strappo", "torsioni", "circonduzioni",
  "rotazione",
  // Positions & orientations
  "seduto", "sdraiato", "inclinata", "inclinato", "declinata", "declinato",
  "piana", "frontale", "frontali", "laterale", "laterali", "posteriore",
  "posteriori", "verticale", "supina", "prona",
  // Grip & hand position
  "presa", "larga", "stretta", "stretto", "largo", "inverso", "inversa",
  "inverse",
  // Modifiers
  "alternato", "alternata", "monolaterale", "concentrazione", "zavorrato",
  "completi", "statico",
  // Directions & prepositions
  "avanti", "indietro", "sopra", "testa", "terra", "piedi", "dietro",
  // Exercises & techniques
  "panca", "affondo", "affondi", "pressa", "ponte", "strappo", "salto",
  "saltato", "camminata", "camminato", "flesso", "appeso", "sospensione",
  "stretching", "allungamento",
  // Stance & style
  "parallele", "sbarra", "assistite", "bulgaro", "nordico", "olimpico",
  "calice", "scott", "martello", "russe",
  // Other distinctive Italian words
  "con", "su", "al", "da", "un", "ai", "alla", "la", "una", "due", "le",
  "sul", "per", "di",
  // Body mechanics
  "abduttori", "adduttori", "accosciata", "addominale", "iperestensioni",
  "pronazione", "supinazione", "quadrupedico", "monopodalico", "diagonale",
  "incrociato", "tese",
  // Additional exercise words
  "rollout", "ruota", "salita", "scale", "scalatore", "tenuta", "tuffo",
  "cavaliere", "arrampicata", "potenza", "medica", "cerchi",
]);

const englishHints = new Set([
  // Equipment
  "barbell", "dumbbell", "cable", "machine", "kettlebell", "ez", "smith",
  "plate", "rope", "band", "ring", "sled", "hex", "rack", "bar",
  // Common abbreviations
  "bb", "db", "kb", "mach",
  // Body parts
  "chest", "shoulder", "arm", "leg", "calf", "hamstring", "quad",
  "delt", "lat", "trap", "tricep", "triceps", "wrist", "hip", "heel",
  "knee", "elbow", "ankle",
  // Movement types
  "press", "pull", "push", "raise", "raises", "row", "curl", "fly", "flys",
  "extension", "extensions", "crunch", "shrug", "lunge", "lunges", "squat",
  "deadlift", "thrust", "bridge", "plank", "dip", "dips", "pulldown",
  "pulldowns", "pullover", "pullup", "pullups", "pushup", "pushups",
  "pushdown", "pressdown", "kickback", "crossover",
  // Positions & orientations
  "standing", "seated", "lying", "incline", "decline", "front", "rear",
  "lateral", "laterals", "side", "overhead", "behind", "prone", "supinated",
  "pronated", "overhand", "underhand",
  // Grip & hand position
  "close", "wide", "narrow", "neutral",
  // Modifiers
  "alternating", "single", "double", "two", "reverse", "inverted",
  "assisted", "weighted", "bodyweight", "isometric", "plyometric",
  "straight", "stiff", "strict",
  // Directions & prepositions
  "forward", "backward", "low", "high", "upper", "lower", "above",
  // Exercise types & styles
  "bench", "preacher", "skull", "crusher", "skullcrusher", "hack",
  "goblet", "military", "arnold", "bulgarian", "romanian", "rdl",
  "sumo", "hindu", "russian", "nordic", "olympic", "zottman", "cuban",
  "bradford", "guillotine",
  // Body movements
  "clean", "snatch", "jerk", "swing", "jump", "jumping", "step",
  "walking", "running", "climbing", "crawl", "burpee", "jack",
  "mountain", "climber", "skipping",
  // Stance & position words
  "split", "stagger", "kneeling", "hanging", "elevated", "floor",
  "wall", "parallel", "handstand", "pistol", "planche",
  // Anatomy terms
  "abdominal", "abduction", "abductor", "adduction", "adductor",
  "hyperextension", "hyperextensions", "pelvic", "scapular",
  // Other distinctive English words
  "face", "chin", "upright", "landmine", "wheel", "roller",
  "spider", "diamond", "star", "seal", "hollow", "banana",
  "dog", "donkey", "bird", "wrestler", "rocky", "catch",
  "concentration", "converging", "static", "partial", "full",
  "depth", "power", "muscle", "air", "box", "block",
  "of", "the",
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

  for (const exercise of SEED_EXERCISES) {
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
