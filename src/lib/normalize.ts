export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeExerciseInput = (value: string) =>
  normalizeText(value)
    .replace(/\bbil\b/g, " bilanciere ")
    .replace(/\bman\b/g, " manubri ")
    .replace(/\s+/g, " ")
    .trim();
