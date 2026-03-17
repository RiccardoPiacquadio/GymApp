import type { SpeechCaptureState } from "../types/voice";

type BrowserSpeechRecognitionResult = ArrayLike<{ transcript: string }> & {
  isFinal?: boolean;
};

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous?: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type SpeechCaptureLifecycle = "listening" | "hearing" | "processing";

type SpeechCaptureOptions = {
  lang?: string;
  silenceMs?: number;
  onTranscriptChange?: (transcript: string) => void;
  onStateChange?: (state: SpeechCaptureLifecycle) => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

const getRecognitionCtor = () => window.SpeechRecognition ?? window.webkitSpeechRecognition;

export const getSpeechSupportState = (): SpeechCaptureState =>
  getRecognitionCtor() ? "idle" : "unsupported";

export const captureSpeechOnce = (options: SpeechCaptureOptions | string = "it-IT") =>
  new Promise<string>((resolve, reject) => {
    const config = typeof options === "string" ? { lang: options } : options;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error("Speech recognition non supportato"));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = config.lang ?? "it-IT";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    const silenceMs = config.silenceMs ?? 4000;
    let finalTranscript = "";
    let latestTranscript = "";
    let settled = false;
    let requestedStop = false;
    let silenceTimer: ReturnType<typeof setTimeout> | undefined;

    const clearSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = undefined;
      }
    };

    const refreshSilenceTimer = () => {
      clearSilenceTimer();
      silenceTimer = setTimeout(() => {
        requestedStop = true;
        config.onStateChange?.("processing");
        recognition.stop();
      }, silenceMs);
    };

    const settle = (handler: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearSilenceTimer();
      handler();
    };

    recognition.onstart = () => {
      config.onStateChange?.("listening");
      refreshSilenceTimer();
    };

    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript?.trim();
        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalParts.push(transcript);
        } else {
          interimParts.push(transcript);
        }
      }

      finalTranscript = finalParts.join(" ").trim();
      const interimTranscript = interimParts.join(" ").trim();
      latestTranscript = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();

      config.onTranscriptChange?.(latestTranscript);
      config.onStateChange?.(latestTranscript ? "hearing" : "listening");
      refreshSilenceTimer();
    };

    recognition.onerror = (event) => {
      if (requestedStop && ["aborted", "no-speech"].includes(event?.error ?? "")) {
        return;
      }

      settle(() => reject(new Error("Errore riconoscimento vocale")));
    };

    recognition.onend = () => {
      settle(() => {
        const transcript = latestTranscript.trim();
        if (!transcript) {
          reject(new Error("Nessun testo riconosciuto"));
          return;
        }

        config.onStateChange?.("processing");
        resolve(transcript);
      });
    };

    recognition.start();
  });
