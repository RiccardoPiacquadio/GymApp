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

// ---------------------------------------------------------------------------
// Browser type shims (SpeechRecognition)
// ---------------------------------------------------------------------------

type WakeRecognitionResult = ArrayLike<{ transcript: string }> & { isFinal?: boolean };

type WakeRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<WakeRecognitionResult>;
};

type WakeRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WakeRecognitionEvent) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

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

const generateSilentWav = (): string => {
  const sampleRate = 8000;
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
  return "data:audio/wav;base64," + btoa(binary);
};

const startMediaSession = (onMediaButton: () => void) => {
  silentAudio = new Audio(generateSilentWav());
  silentAudio.loop = true;
  silentAudio.volume = 0.01;
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

const playBeep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => void ctx.close(), 300);
  } catch {
    /* AudioContext not available */
  }
  if ("vibrate" in navigator) {
    navigator.vibrate(100);
  }
};

// ---------------------------------------------------------------------------
// Wake-word continuous recognition
// ---------------------------------------------------------------------------

type Phase = "idle" | "capturing" | "cooldown";

const getRecognitionCtor = () =>
  (window.SpeechRecognition ?? window.webkitSpeechRecognition) as (new () => WakeRecognition) | undefined;

const CAPTURE_TIMEOUT_MS = 8_000;

export const startHandsFreeMode = (options: HandsFreeOptions): HandsFreeController => {
  const { wakePhrase, lang = "it-IT", onCommand, onStatusChange, onWakeDetected } = options;
  const normalizedWake = wakePhrase.toLowerCase().trim();

  // -- state --
  let active = true;
  let phase: Phase = "idle";
  let recognition: WakeRecognition | null = null;
  let recognitionRunning = false;
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

          if (result.isFinal && afterWake.length > 2) {
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
      if (active && phase !== "cooldown") {
        setTimeout(startRecognition, 500);
      }
    };

    rec.onend = () => {
      recognitionRunning = false;
      // Auto-restart (iOS stops continuous after silence)
      if (active && phase !== "cooldown") {
        setTimeout(startRecognition, 300);
      }
    };

    recognition = rec;
    try {
      rec.start();
    } catch {
      recognitionRunning = false;
      if (active) setTimeout(startRecognition, 1000);
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
