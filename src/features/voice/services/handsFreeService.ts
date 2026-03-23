/**
 * Hands-free mode for voice-first gym usage.
 *
 * Two capabilities, managed as a single lifecycle:
 *
 * 1. **MediaSession** — silent audio loop so AirPods double/triple squeeze
 *    (nexttrack / previoustrack) triggers voice capture. Play/pause is left
 *    free for music control.
 * 2. **Wake Word Listener** — continuous SpeechRecognition that detects a keyword
 *    (default "gym") and routes the subsequent command to a callback, all within
 *    the same recognition session (avoids iOS user-gesture requirement for new instances).
 */

// SpeechRecognition types are in src/types/speech-recognition.d.ts

const SILENT_WAV_SAMPLE_RATE = 8000;
const SILENT_AUDIO_VOLUME = 0.01;
const BEEP_FREQUENCY_HZ = 880;
const BEEP_GAIN = 0.15;
const BEEP_DURATION_S = 0.15;
const BEEP_CLEANUP_DELAY_MS = 300;
const VIBRATION_DURATION_MS = 100;
const CAPTURE_TIMEOUT_MS = 8_000;
const RECOGNITION_RESTART_DELAY_MS = 300;
const RECOGNITION_ERROR_RESTART_DELAY_MS = 500;
const RECOGNITION_START_RETRY_DELAY_MS = 1000;
const MAX_CONSECUTIVE_ERRORS = 5;
const MIN_WAKE_COMMAND_LENGTH = 2;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type HandsFreeStatus = "off" | "listening" | "wake_detected" | "error";

export type HandsFreeController = {
  /** Stop everything: media session, wake word listener. */
  stop: () => void;
  /** Temporarily pause the continuous recognition (e.g. for manual capture). */
  pauseListening: () => void;
  /** Resume continuous recognition after a manual capture. */
  resumeListening: () => void;
};

export type HandsFreeOptions = {
  wakePhrase: string;
  lang?: string;
  /** Called with the extracted command transcript (everything after the wake word). */
  onCommand: (transcript: string) => Promise<void>;
  onStatusChange?: (status: HandsFreeStatus) => void;
  /** Called the instant the wake word is detected (before the command is captured). */
  onWakeDetected?: () => void;
};

// ---------------------------------------------------------------------------
// Silent audio + MediaSession (AirPods double/triple squeeze → trigger capture)
// ---------------------------------------------------------------------------

let silentAudio: HTMLAudioElement | null = null;

let cachedSilentWav: string | null = null;

const generateSilentWav = (): string => {
  if (cachedSilentWav) return cachedSilentWav;

  const sampleRate = SILENT_WAV_SAMPLE_RATE;
  const numSamples = sampleRate; // 1 second
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples, true);
  new Uint8Array(buffer, 44).fill(128); // silence = 0x80 for unsigned 8-bit

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  cachedSilentWav = "data:audio/wav;base64," + btoa(binary);
  return cachedSilentWav;
};

const startMediaSession = (onMediaButton: () => void) => {
  silentAudio = new Audio(generateSilentWav());
  silentAudio.loop = true;
  silentAudio.volume = SILENT_AUDIO_VOLUME;
  void silentAudio.play().catch(() => {});

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "GymApp",
      artist: "Sessione attiva"
    });
    // Double squeeze (AirPods Pro) = nexttrack, triple = previoustrack.
    // play/pause left free for music.
    navigator.mediaSession.setActionHandler("nexttrack", onMediaButton);
    navigator.mediaSession.setActionHandler("previoustrack", onMediaButton);
  }
};

const stopMediaSession = () => {
  if (silentAudio) {
    silentAudio.pause();
    silentAudio.src = "";
    silentAudio = null;
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("nexttrack", null);
    navigator.mediaSession.setActionHandler("previoustrack", null);
  }
};

// ---------------------------------------------------------------------------
// Audio / haptic feedback
// ---------------------------------------------------------------------------

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
};

const playBeep = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = BEEP_FREQUENCY_HZ;
    gain.gain.value = BEEP_GAIN;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + BEEP_DURATION_S);
    osc.stop(ctx.currentTime + BEEP_DURATION_S);
  } catch {
    /* AudioContext not available */
  }
  if ("vibrate" in navigator) {
    navigator.vibrate(VIBRATION_DURATION_MS);
  }
};

// ---------------------------------------------------------------------------
// Wake-word continuous recognition
// ---------------------------------------------------------------------------

type Phase = "idle" | "capturing" | "cooldown";

const getRecognitionCtor = () =>
  (window.SpeechRecognition ?? window.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined;

export const startHandsFreeMode = (options: HandsFreeOptions): HandsFreeController => {
  const { wakePhrase, lang = "it-IT", onCommand, onStatusChange, onWakeDetected } = options;
  const normalizedWake = wakePhrase.toLowerCase().trim();

  // -- state --
  let active = true;
  let phase: Phase = "idle";
  let recognition: SpeechRecognitionInstance | null = null;
  let recognitionRunning = false;
  let consecutiveErrors = 0;
  let captureTimeout: ReturnType<typeof setTimeout> | undefined;

  // -- helpers --
  const clearCaptureTimeout = () => {
    if (captureTimeout !== undefined) {
      clearTimeout(captureTimeout);
      captureTimeout = undefined;
    }
  };

  const enterCapturing = () => {
    phase = "capturing";
    playBeep();
    onWakeDetected?.();
    onStatusChange?.("wake_detected");
    clearCaptureTimeout();
    captureTimeout = setTimeout(() => {
      if (phase === "capturing") {
        phase = "idle";
        onStatusChange?.("listening");
      }
    }, CAPTURE_TIMEOUT_MS);
  };

  const processCommand = (transcript: string) => {
    phase = "cooldown";
    clearCaptureTimeout();
    void (async () => {
      try {
        await onCommand(transcript);
      } finally {
        if (active) {
          phase = "idle";
          onStatusChange?.("listening");
          // If recognition stopped during cooldown, restart
          if (!recognitionRunning) startRecognition();
        }
      }
    })();
  };

  // -- media session (AirPods button) --
  const onMediaButton = () => {
    if (!active || phase !== "idle") return;
    enterCapturing();
  };
  startMediaSession(onMediaButton);

  // -- continuous recognition --
  const startRecognition = () => {
    if (!active) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      onStatusChange?.("error");
      return;
    }

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      recognitionRunning = true;
      if (phase !== "cooldown") {
        phase = "idle";
        onStatusChange?.("listening");
      }
    };

    rec.onresult = (event) => {
      if (phase === "cooldown") return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = (result?.[0]?.transcript ?? "").toLowerCase().trim();
        if (!transcript) continue;

        if (phase === "idle") {
          const wakeIdx = transcript.indexOf(normalizedWake);
          if (wakeIdx === -1) continue;

          const afterWake = transcript.slice(wakeIdx + normalizedWake.length).trim();

          if (result.isFinal && afterWake.length > MIN_WAKE_COMMAND_LENGTH) {
            // "gym squat 80 per 8" → wake + command in one phrase
            processCommand(afterWake);
            return;
          }

          if (result.isFinal) {
            // "gym" alone → wait for next phrase as command
            enterCapturing();
          }
          // interim with "gym" → wait for finalization
        } else if (phase === "capturing") {
          if (result.isFinal && transcript.length > 0) {
            processCommand(transcript);
            return;
          }
        }
      }
    };

    rec.onerror = () => {
      recognitionRunning = false;
      consecutiveErrors++;
      if (active && phase !== "cooldown" && consecutiveErrors <= MAX_CONSECUTIVE_ERRORS) {
        const backoff = RECOGNITION_ERROR_RESTART_DELAY_MS * Math.pow(2, consecutiveErrors - 1);
        setTimeout(startRecognition, Math.min(backoff, 10_000));
      }
    };

    rec.onend = () => {
      recognitionRunning = false;
      // Auto-restart (iOS stops continuous after silence)
      if (active && phase !== "cooldown") {
        consecutiveErrors = 0; // Successful session → reset error counter
        setTimeout(startRecognition, RECOGNITION_RESTART_DELAY_MS);
      }
    };

    recognition = rec;
    try {
      rec.start();
    } catch {
      recognitionRunning = false;
      if (active) setTimeout(startRecognition, RECOGNITION_START_RETRY_DELAY_MS);
    }
  };

  startRecognition();

  // -- controller --
  return {
    stop: () => {
      active = false;
      clearCaptureTimeout();
      if (recognition) {
        recognition.abort();
        recognition = null;
      }
      recognitionRunning = false;
      stopMediaSession();
      onStatusChange?.("off");
    },
    pauseListening: () => {
      clearCaptureTimeout();
      phase = "cooldown";
      if (recognition) {
        recognition.abort();
        recognition = null;
      }
      recognitionRunning = false;
    },
    resumeListening: () => {
      if (!active) return;
      phase = "idle";
      startRecognition();
    }
  };
};
