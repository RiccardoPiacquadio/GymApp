import { normalizeExerciseInput } from "../../../lib/normalize";
import { resolveExerciseAlias } from "../../exercises/services/aliasResolver";
import type { ParsedVoiceSet } from "../types/voice";

const extractWeightAndReps = (text: string) => {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*(?:x|per)\s*(\d+)/i);
  if (!match) {
    return null;
  }

  return {
    weight: Number(match[1].replace(",", ".")),
    reps: Number(match[2])
  };
};

export const parseVoiceSet = async (rawText: string): Promise<ParsedVoiceSet> => {
  const normalizedText = normalizeExerciseInput(rawText);
  const numericData = extractWeightAndReps(normalizedText);
  const exerciseText = numericData
    ? normalizedText.replace(/(\d+(?:[.,]\d+)?)\s*(?:x|per)\s*(\d+)/i, "").trim()
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
