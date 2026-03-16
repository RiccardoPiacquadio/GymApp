import type { SpeechCaptureState } from "../types/voice";

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

const getRecognitionCtor = () => window.SpeechRecognition ?? window.webkitSpeechRecognition;

export const getSpeechSupportState = (): SpeechCaptureState =>
  getRecognitionCtor() ? "idle" : "unsupported";

export const captureSpeechOnce = (lang = "it-IT") =>
  new Promise<string>((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error("Speech recognition non supportato"));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (!transcript) {
        reject(new Error("Nessun testo riconosciuto"));
        return;
      }
      resolve(transcript);
    };
    recognition.onerror = () => reject(new Error("Errore riconoscimento vocale"));
    recognition.onend = () => undefined;
    recognition.start();
  });
