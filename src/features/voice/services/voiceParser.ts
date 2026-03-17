import { normalizeExerciseInput } from "../../../lib/normalize";
import { resolveExerciseAlias } from "../../exercises/services/aliasResolver";
import type { ParsedVoiceSet } from "../types/voice";

const toNumber = (value: string) => Number(value.replace(",", "."));

const extractWeightAndReps = (text: string) => {
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|kili)?\s*(?:x|per)\s*(\d+)(?:\s*(?:rip|reps|ripetizioni))?/i,
    /con\s*(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|kili)?\s*(?:x|per)\s*(\d+)(?:\s*(?:rip|reps|ripetizioni))?/i,
    /(?:da|con)\s*(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|kili).{0,20}?\bper\s*(\d+)(?:\s*(?:rip|reps|ripetizioni))?/i,
    /(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|kili).{0,20}?\b(\d+)\s*(?:rip|reps|ripetizioni)\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    return {
      weight: toNumber(match[1]),
      reps: Number(match[2])
    };
  }

  return null;
};

export const parseVoiceSet = async (rawText: string): Promise<ParsedVoiceSet> => {
  const normalizedText = normalizeExerciseInput(rawText);
  const numericData = extractWeightAndReps(normalizedText);
  const exerciseText = numericData
    ? normalizedText
        .replace(/con\s*\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|kili)?\s*(?:x|per)\s*\d+(?:\s*(?:rip|reps|ripetizioni))?/i, "")
        .replace(/(?:da|con)\s*\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|kili).{0,20}?\bper\s*\d+(?:\s*(?:rip|reps|ripetizioni))?/i, "")
        .replace(/\d+(?:[.,]\d+)?\s*(?:kg|chilogrammi|kili).{0,20}?\b\d+\s*(?:rip|reps|ripetizioni)\b/i, "")
        .replace(/(\d+(?:[.,]\d+)?)\s*(?:kg|chilogrammi|kili)?\s*(?:x|per)\s*(\d+)(?:\s*(?:rip|reps|ripetizioni))?/i, "")
        .replace(/\b(ho fatto|fatto|una serie di|serie di|allora)\b/gi, "")
        .trim()
    : normalizedText;
  const aliasResolution = await resolveExerciseAlias(exerciseText);
  const isValid = Boolean(
    !aliasResolution.isAmbiguous &&
      aliasResolution.canonicalExerciseId &&
      numericData?.weight &&
      numericData?.reps
  );

  let feedbackMessage: string | undefined;
  if (aliasResolution.isAmbiguous) {
    feedbackMessage = "Nome ambiguo: scegli l'esercizio corretto prima di salvare.";
  } else if (!aliasResolution.canonicalExerciseId) {
    feedbackMessage = "Esercizio non riconosciuto.";
  } else if (!numericData?.weight || !numericData?.reps) {
    feedbackMessage = "Mancano peso o ripetizioni nel comando vocale.";
  } else {
    feedbackMessage = "Comando riconosciuto.";
  }

  return {
    rawText,
    normalizedText,
    canonicalExerciseId: aliasResolution.canonicalExerciseId,
    matchedAlias: aliasResolution.matchedAlias,
    weight: numericData?.weight,
    reps: numericData?.reps,
    confidence: isValid
      ? Math.min(1, aliasResolution.confidence * 0.7 + 0.3)
      : aliasResolution.confidence * 0.6,
    isValid,
    requiresConfirmation: !isValid || aliasResolution.confidence < 0.9,
    feedbackMessage,
    candidateExerciseIds: aliasResolution.candidateExerciseIds
  };
};
