/** Centralized Italian feedback strings for voice features. */

// -- Voice command processor: errors --
export const FB_NO_LAST_SET_REPEAT = "Non ho un ultimo set da ripetere.";
export const FB_NO_ACTIVE_EXERCISE_REPEAT = "Manca l'esercizio attivo per ripetere la serie.";
export const FB_NO_ACTIVE_EXERCISE_OR_WEIGHT = "Manca un esercizio attivo o un peso precedente.";
export const FB_EXERCISE_NOT_FOUND = "Esercizio non trovato.";
export const FB_ACTIVE_EXERCISE_NOT_FOUND = "Esercizio attivo non trovato.";
export const FB_EXERCISE_NOT_RECOGNIZED = "Esercizio non riconosciuto.";
export const FB_NO_LAST_SET_CORRECT = "Non ho un ultimo set da correggere.";
export const FB_NO_LAST_SET_DELETE = "Non ho un ultimo set da cancellare.";
export const FB_NO_SETS_TO_DELETE = "Non ci sono serie da cancellare.";
export const FB_LAST_SET_DELETED = "Ultima serie eliminata.";
export const FB_MULTI_SET_NO_EXERCISE = "Ho riconosciuto piu' serie ma manca l'esercizio. Dimmi prima quale esercizio.";
export const FB_COMMAND_NOT_RECOGNIZED = "Comando non riconosciuto.";
export const FB_COMMAND_NEEDS_CONFIRM = "Comando da confermare.";

// -- Voice command processor: session actions --
export const FB_CLOSE_SESSION_CONFIRM = "Stai per chiudere la sessione. Confermi?";
export const FB_NO_ACTIVE_SESSION_PAUSE = "Nessuna sessione attiva da mettere in pausa.";
export const FB_SESSION_PAUSED = "Sessione in pausa.";
export const FB_NO_PAUSED_SESSION = "Nessuna sessione in pausa da riprendere.";
export const FB_SESSION_RESUMED = "Sessione ripresa.";
export const FB_CONTEXT_UPDATED = "Contesto sessione aggiornato.";

// -- Voice command processor: templates --
export const fbActiveExercise = (name: string) => `Esercizio attivo: ${name}.`;
export const fbSetSaved = (name: string, weight: number, reps: number) =>
  `${name}, ${weight} kg x ${reps}, salvato.`;
export const fbMultiSetSaved = (name: string, count: number, weight: number, reps: number) =>
  `${name}, ${count} serie da ${weight} kg x ${reps}, salvate.`;
export const fbMultiSetDetail = (name: string, count: number, detail: string) =>
  `${name}, ${count} serie: ${detail}. Salvate.`;
export const fbCorrectedReps = (weight: number, reps: number) =>
  `Ultima serie corretta a ${weight} kg x ${reps}.`;
export const fbCorrectedWeight = (weight: number, reps: number) =>
  `Ultima serie corretta a ${weight} kg x ${reps}.`;

// -- useVoiceSession --
export const FB_NOTHING_HEARD = "Non ho sentito niente di utile. Riprova o correggi a mano.";
export const FB_RECOGNITION_ERROR = "Errore durante il riconoscimento vocale.";
export const FB_CLOSE_CANCELLED = "Chiusura annullata.";
export const FB_WAKE_DETECTED = "GYM rilevato — dimmi il comando.";

// -- speechCapture --
export const FB_SPEECH_NOT_SUPPORTED = "Speech recognition non supportato";
export const FB_SPEECH_ERROR = "Errore riconoscimento vocale";
export const FB_NO_TEXT_RECOGNIZED = "Nessun testo riconosciuto";

// -- Template voice commands --
export const fbTemplateExercisesAdded = (count: number, names: string[]) =>
  `${count} esercizi aggiunti: ${names.join(", ")}.`;
export const FB_TEMPLATE_NO_EXERCISES = "Non ho riconosciuto nessun esercizio. Riprova.";

// -- voiceParser --
export const FB_AMBIGUOUS_NAME = "Nome ambiguo: scegli l'esercizio corretto prima di salvare.";
export const FB_WEIGHT_REPS_ONLY = "Peso e ripetizioni riconosciuti: uso il contesto dell'esercizio attivo se disponibile.";
export const FB_MISSING_WEIGHT_REPS = "Mancano peso o ripetizioni nel comando vocale.";
export const FB_COMMAND_RECOGNIZED = "Comando riconosciuto.";
