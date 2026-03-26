import type { SpeechCaptureState } from "../types/voice";
import { FB_NO_TEXT_RECOGNIZED, FB_SPEECH_ERROR, FB_SPEECH_NOT_SUPPORTED } from "./voiceFeedback";

type SpeechCaptureLifecycle = "listening" | "hearing" | "processing";

type SpeechCaptureOptions = {
  lang?: string;
  silenceMs?: number;
  onTranscriptChange?: (transcript: string) => void;
  onStateChange?: (state: SpeechCaptureLifecycle) => void;
};

const getRecognitionCtor = () => window.SpeechRecognition ?? window.webkitSpeechRecognition;

const CAPTURE_CANCELLED = "VOICE_CAPTURE_CANCELLED";

type ActiveCapture = {
  recognition: SpeechRecognition;
  cancel: () => void;
};

let activeCapture: ActiveCapture | null = null;

export const isSpeechCaptureCancelledError = (error: unknown) =>
  error instanceof Error && error.message === CAPTURE_CANCELLED;

export const cancelSpeechCapture = () => {
  activeCapture?.cancel();
};

export const getSpeechSupportState = (): SpeechCaptureState =>
  getRecognitionCtor() ? "idle" : "unsupported";

export const captureSpeechOnce = (options: SpeechCaptureOptions | string = "it-IT") =>
  new Promise<string>((resolve, reject) => {
    const config = typeof options === "string" ? { lang: options } : options;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error(FB_SPEECH_NOT_SUPPORTED));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = config.lang ?? "it-IT";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    const silenceMs = config.silenceMs ?? 5000;
    let latestTranscript = "";
    let settled = false;
    let requestedStop = false;
    let cancelledByUser = false;
    let silenceTimer: ReturnType<typeof setTimeout> | undefined;

    const clearSilenceTimer = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = undefined;
      }
    };

    const cleanup = () => {
      if (activeCapture?.recognition === recognition) {
        activeCapture = null;
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
      cleanup();
      handler();
    };

    const cancel = () => {
      if (settled) {
        return;
      }
      requestedStop = true;
      cancelledByUser = true;
      clearSilenceTimer();
      recognition.stop();
    };

    activeCapture = { recognition, cancel };

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

      const finalTranscript = finalParts.join(" ").trim();
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

      settle(() => reject(new Error(FB_SPEECH_ERROR)));
    };

    recognition.onend = () => {
      settle(() => {
        if (cancelledByUser) {
          reject(new Error(CAPTURE_CANCELLED));
          return;
        }

        const transcript = latestTranscript.trim();
        if (!transcript) {
          reject(new Error(FB_NO_TEXT_RECOGNIZED));
          return;
        }

        config.onStateChange?.("processing");
        resolve(transcript);
      });
    };

    recognition.start();
  });
