import { normalizeExerciseInput } from "../../../lib/normalize";
import { resolveExerciseAlias } from "../../exercises/services/aliasResolver";
import type { ParsedVoiceSet } from "../types/voice";
import {
  FB_AMBIGUOUS_NAME,
  FB_COMMAND_RECOGNIZED,
  FB_EXERCISE_NOT_RECOGNIZED,
  FB_MISSING_WEIGHT_REPS,
  FB_WEIGHT_REPS_ONLY
} from "./voiceFeedback";

const toNumber = (value: string) => Number(value.replace(",", "."));

const ordinalSetMap: Record<string, number> = {
  primo: 1,
  prima: 1,
  secondo: 2,
  seconda: 2,
  terzo: 3,
  terza: 3,
  quarto: 4,
  quarta: 4,
  quinto: 5,
  quinta: 5,
  sesto: 6,
  sesta: 6,
  settimo: 7,
  settima: 7,
  ottavo: 8,
  ottava: 8,
  nono: 9,
  nona: 9,
  decimo: 10,
  decima: 10
};

const italianDirectNumberMap: Record<string, number> = {
  zero: 0,
  uno: 1,
  due: 2,
  tre: 3,
  quattro: 4,
  cinque: 5,
  sei: 6,
  sette: 7,
  otto: 8,
  nove: 9,
  dieci: 10,
  undici: 11,
  dodici: 12,
  tredici: 13,
  quattordici: 14,
  quindici: 15,
  sedici: 16,
  diciassette: 17,
  diciotto: 18,
  diciannove: 19,
  venti: 20,
  trenta: 30,
  quaranta: 40,
  cinquanta: 50,
  sessanta: 60,
  settanta: 70,
  ottanta: 80,
  novanta: 90,
  cento: 100
};

const englishDirectNumberMap: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100
};

const italianTens: Array<{ full: string; short: string; value: number }> = [
  { full: "venti", short: "vent", value: 20 },
  { full: "trenta", short: "trent", value: 30 },
  { full: "quaranta", short: "quarant", value: 40 },
  { full: "cinquanta", short: "cinquant", value: 50 },
  { full: "sessanta", short: "sessant", value: 60 },
  { full: "settanta", short: "settant", value: 70 },
  { full: "ottanta", short: "ottant", value: 80 },
  { full: "novanta", short: "novant", value: 90 }
];

const englishTens: Array<{ full: string; value: number }> = [
  { full: "twenty", value: 20 },
  { full: "thirty", value: 30 },
  { full: "forty", value: 40 },
  { full: "fifty", value: 50 },
  { full: "sixty", value: 60 },
  { full: "seventy", value: 70 },
  { full: "eighty", value: 80 },
  { full: "ninety", value: 90 }
];

const normalizeSpeechArtifacts = (text: string) =>
  text
    .replace(/\bper\s+cento\b/gi, " 100 ")
    .replace(/\bpercento\b/gi, " 100 ")
    .replace(/\bchilogrammo\b/gi, " chilogrammi ")
    .replace(/\bchilo\b/gi, " chili ")
    .replace(/\brap\b/gi, " rep ")
    .replace(/\s+/g, " ")
    .trim();

const parseItalianNumberWord = (word: string): number | null => {
  if (word in italianDirectNumberMap) {
    return italianDirectNumberMap[word];
  }

  if (word.startsWith("cento")) {
    const remainder = word.slice("cento".length);
    if (!remainder) {
      return 100;
    }

    const remainderValue = parseItalianNumberWord(remainder);
    return remainderValue === null ? null : 100 + remainderValue;
  }

  for (const tens of italianTens) {
    if (word.startsWith(tens.full)) {
      const remainder = word.slice(tens.full.length);
      if (!remainder) {
        return tens.value;
      }

      const remainderValue = parseItalianNumberWord(remainder);
      return remainderValue === null || remainderValue >= 10 ? null : tens.value + remainderValue;
    }

    if (word.startsWith(tens.short)) {
      const remainder = word.slice(tens.short.length);
      if (!remainder) {
        return tens.value;
      }

      const remainderValue = parseItalianNumberWord(remainder);
      return remainderValue === null || remainderValue >= 10 ? null : tens.value + remainderValue;
    }
  }

  return null;
};

const parseEnglishNumberWord = (word: string): number | null => {
  if (word in englishDirectNumberMap) {
    return englishDirectNumberMap[word];
  }

  if (word.startsWith("onehundred")) {
    const remainder = word.slice("onehundred".length);
    if (!remainder) {
      return 100;
    }

    const remainderValue = parseEnglishNumberWord(remainder);
    return remainderValue === null ? null : 100 + remainderValue;
  }

  for (const tens of englishTens) {
    if (word.startsWith(tens.full)) {
      const remainder = word.slice(tens.full.length);
      if (!remainder) {
        return tens.value;
      }

      const remainderValue = parseEnglishNumberWord(remainder);
      return remainderValue === null || remainderValue >= 10 ? null : tens.value + remainderValue;
    }
  }

  return null;
};

const replaceWordNumbers = (text: string) =>
  text
    .split(" ")
    .map((token) => {
      if (/^\d+(?:[.,]\d+)?$/.test(token)) {
        return token;
      }

      const italianValue = parseItalianNumberWord(token);
      if (italianValue !== null) {
        return String(italianValue);
      }

      const englishValue = parseEnglishNumberWord(token);
      if (englishValue !== null) {
        return String(englishValue);
      }

      return token;
    })
    .join(" ");

const extractSetNumber = (text: string) => {
  const explicitNumeric = text.match(/\b(?:serie|set)\s*(\d+)\b/i);
  if (explicitNumeric) {
    return Number(explicitNumeric[1]);
  }

  const ordinalMatch =
    text.match(/^(primo|prima|secondo|seconda|terzo|terza|quarto|quarta|quinto|quinta|sesto|sesta|settimo|settima|ottavo|ottava|nono|nona|decimo|decima)\b/i) ??
    text.match(/\b(primo|prima|secondo|seconda|terzo|terza|quarto|quarta|quinto|quinta|sesto|sesta|settimo|settima|ottavo|ottava|nono|nona|decimo|decima)\s+(?:serie|set)\b/i);

  if (!ordinalMatch) {
    return undefined;
  }

  return ordinalSetMap[ordinalMatch[1].toLowerCase()];
};

const extractSetCount = (text: string) => {
  const countMatch =
    text.match(/\b(?:anche\s+|altre\s+|ho fatto anche\s+|ne ho fatte\s+|fatte\s+|faccio\s+|di nuovo\s+|ancora\s+)?(\d+)\s*(?:serie|set)\b/i) ??
    text.match(/\b(?:serie|set)\s*(\d+)\b/i);

  if (!countMatch) {
    return undefined;
  }

  return Number(countMatch[1]);
};

const extractWeightAndReps = (text: string) => {
  const combinedPatterns = [
    /(?:con\s+|da\s+|peso\s+)?(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|chili|kili)\s*(?:x|per)\s*(\d+)(?:\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi))?/i,
    /(?:con\s+|da\s+|peso\s+)?(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|chili|kili).{0,24}?\b(\d+)\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi)\b/i,
    /(\d+(?:[.,]\d+)?)\s*(?:x|per)\s*(\d+)(?:\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi))?/i
  ];

  for (const pattern of combinedPatterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    return {
      weight: toNumber(match[1]),
      reps: Number(match[2])
    };
  }

  const weightMatch =
    text.match(/\b(?:con|da|peso)\s*(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|chili|kili)\b/i) ??
    text.match(/\b(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|chili|kili)\b/i);

  const repsMatch =
    text.match(/\b(?:per|x|rep|reps|rap|rip|ripetizioni|colpo|colpi)\s*(\d+)\b/i) ??
    text.match(/\b(\d+)\s*(?:rep|reps|rap|rip|ripetizioni|colpo|colpi)\b/i);

  if (!weightMatch && !repsMatch) {
    return null;
  }

  return {
    weight: weightMatch ? toNumber(weightMatch[1]) : undefined,
    reps: repsMatch ? Number(repsMatch[1]) : undefined
  };
};

const extractExerciseText = (text: string) =>
  text
    .replace(/\b(?:serie|set)\s*\d+\b/gi, " ")
    .replace(/\b\d+\s*(?:serie|set)\b/gi, " ")
    .replace(/\b(?:primo|prima|secondo|seconda|terzo|terza|quarto|quarta|quinto|quinta|sesto|sesta|settimo|settima|ottavo|ottava|nono|nona|decimo|decima)(?:\s+(?:serie|set))?\b/gi, " ")
    .replace(/(?:con\s+|da\s+|peso\s+)?\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|chili|kili)\s*(?:x|per)\s*\d+(?:\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi))?/gi, " ")
    .replace(/(?:con\s+|da\s+|peso\s+)?\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|chili|kili).{0,24}?\b\d+\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi)\b/gi, " ")
    .replace(/\d+(?:[.,]\d+)?\s*(?:x|per)\s*\d+(?:\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi))?/gi, " ")
    .replace(/(?:con\s+|peso\s+)?\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|chili|kili)\b/gi, " ")
    .replace(/\b(?:per|x)\s*\d+(?:\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi))?\b/gi, " ")
    .replace(/\b\d+\s*(?:rip|rep|reps|rap|ripetizioni|colpo|colpi)\b/gi, " ")
    .replace(/\b(?:allora|ho fatto|fatto|ho eseguito|eseguito|una serie di|un set di|serie di|set di|una serie|un set|serie|set|ripetizioni|rip|rep|reps|rap|colpo|colpi|anche|di nuovo|ancora|uguale|stessa|stesso)\b/gi, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ---------------------------------------------------------------------------
// Multi-set parsing — "squat 70 per 8, 50 per 7, 90 per 5"
// ---------------------------------------------------------------------------

export type MultiSetEntry = { weight: number; reps: number };

const extractMultiSetEntries = (text: string): MultiSetEntry[] | null => {
  // 1) Split by explicit separators: comma, "poi", "e poi", "dopo", "e"
  const segments = text
    .split(/\s*(?:,|\.|\bpoi\b|\be poi\b|\bdopo\b)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    const entries: MultiSetEntry[] = [];
    let prevWeight: number | undefined;
    let prevReps: number | undefined;

    for (const seg of segments) {
      const wr = extractWeightAndReps(seg);
      if (wr?.weight !== undefined && wr?.reps !== undefined) {
        entries.push({ weight: wr.weight, reps: wr.reps });
        prevWeight = wr.weight;
        prevReps = wr.reps;
      } else if (wr?.weight !== undefined && prevReps !== undefined) {
        entries.push({ weight: wr.weight, reps: prevReps });
        prevWeight = wr.weight;
      } else if (wr?.reps !== undefined && prevWeight !== undefined) {
        entries.push({ weight: prevWeight, reps: wr.reps });
        prevReps = wr.reps;
      } else {
        // Bare number — infer weight or reps from context
        const bare = seg.match(/^(\d+)$/);
        if (bare) {
          const val = Number(bare[1]);
          if (prevWeight !== undefined && val <= 30) {
            entries.push({ weight: prevWeight, reps: val });
            prevReps = val;
          } else if (prevReps !== undefined) {
            entries.push({ weight: val, reps: prevReps });
            prevWeight = val;
          }
        }
      }
    }

    if (entries.length >= 2) return entries;
  }

  // 2) Fallback: find all weight×reps patterns in full text
  const allMatches = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:x|per)\s*(\d+)/gi)];
  if (allMatches.length >= 2) {
    return allMatches.map((m) => ({
      weight: Number(m[1].replace(",", ".")),
      reps: Number(m[2])
    }));
  }

  return null;
};

/**
 * Parses a multi-set voice command.
 * Returns exercise + array of weight/reps entries, or null if not a multi-set.
 */
export const parseMultiSetCommand = async (
  rawText: string
): Promise<{
  entries: MultiSetEntry[];
  canonicalExerciseId?: string;
} | null> => {
  // Preserve commas before normalization (normalizeText strips punctuation).
  // Replace commas with a letter token that survives normalization, restore after.
  const preserved = rawText.replace(/,/g, " XSEPX ");
  const normalized = normalizeExerciseInput(preserved);
  const speechNorm = normalizeSpeechArtifacts(normalized);
  const withDigits = replaceWordNumbers(speechNorm).replace(/\bxsepx\b/gi, ",");

  const entries = extractMultiSetEntries(withDigits);
  if (!entries || entries.length < 2) return null;

  const exerciseText = extractExerciseText(withDigits);
  const aliasRes = await resolveExerciseAlias(exerciseText);

  return {
    entries,
    canonicalExerciseId: aliasRes.canonicalExerciseId
  };
};

// ---------------------------------------------------------------------------
// Single-set parsing (existing)
// ---------------------------------------------------------------------------

export const parseVoiceSet = async (rawText: string): Promise<ParsedVoiceSet> => {
  const normalizedText = normalizeExerciseInput(rawText);
  const normalizedSpeechText = normalizeSpeechArtifacts(normalizedText);
  const normalizedTextWithDigits = replaceWordNumbers(normalizedSpeechText);
  const numericData = extractWeightAndReps(normalizedTextWithDigits);
  const setNumber = extractSetNumber(normalizedTextWithDigits);
  const setCount = extractSetCount(normalizedTextWithDigits);
  const exerciseText = extractExerciseText(normalizedTextWithDigits);
  const aliasResolution = await resolveExerciseAlias(exerciseText);
  const hasWeight = numericData?.weight !== undefined;
  const hasReps = numericData?.reps !== undefined;
  const hasExercise = Boolean(aliasResolution.canonicalExerciseId);
  const isValid = Boolean(!aliasResolution.isAmbiguous && hasExercise && hasWeight && hasReps);

  let feedbackMessage: string | undefined;
  if (aliasResolution.isAmbiguous) {
    feedbackMessage = FB_AMBIGUOUS_NAME;
  } else if (!hasExercise && hasWeight && hasReps) {
    feedbackMessage = FB_WEIGHT_REPS_ONLY;
  } else if (!hasExercise) {
    feedbackMessage = FB_EXERCISE_NOT_RECOGNIZED;
  } else if (!hasWeight || !hasReps) {
    feedbackMessage = FB_MISSING_WEIGHT_REPS;
  } else {
    feedbackMessage = FB_COMMAND_RECOGNIZED;
  }

  return {
    rawText,
    normalizedText: normalizedTextWithDigits,
    canonicalExerciseId: aliasResolution.canonicalExerciseId,
    matchedAlias: aliasResolution.matchedAlias,
    setNumber,
    setCount,
    weight: numericData?.weight,
    reps: numericData?.reps,
    confidence: isValid
      ? Math.min(1, aliasResolution.confidence * 0.7 + 0.3)
      : hasWeight && hasReps && !aliasResolution.isAmbiguous
        ? 0.72
        : aliasResolution.confidence * 0.6,
    isValid,
    requiresConfirmation: !isValid || aliasResolution.confidence < 0.9,
    feedbackMessage,
    candidateExerciseIds: aliasResolution.candidateExerciseIds
  };
};
