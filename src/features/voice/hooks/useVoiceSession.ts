import { useCallback, useEffect, useReducer, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../db";
import { normalizeText } from "../../../lib/normalize";
import { getExerciseById } from "../../exercises/services/exerciseRepository";
import {
  hydrateConversationStateForSession,
  processVoiceCommand
} from "../services/voiceCommandProcessor";
import {
  captureSpeechOnce,
  getSpeechSupportState
} from "../services/speechCapture";
import {
  startHandsFreeMode,
  type HandsFreeController,
  type HandsFreeStatus
} from "../services/handsFreeService";
import type {
  ParsedVoiceSet,
  SpeechCaptureState,
  VoiceConversationState
} from "../types/voice";
import {
  FB_CLOSE_CANCELLED,
  FB_NO_TEXT_RECOGNIZED,
  FB_NOTHING_HEARD,
  FB_RECOGNITION_ERROR,
  FB_WAKE_DETECTED
} from "../services/voiceFeedback";

// ---------------------------------------------------------------------------
// Reactive conversation state — single source of truth from DB
// ---------------------------------------------------------------------------

const VOICE_STATE_KEY = "voice.conversationState";

const useConversationState = () => {
  const raw = useLiveQuery(
    () => db.appSettings.get(VOICE_STATE_KEY),
    [],
    undefined
  );

  if (!raw?.value) return undefined;

  try {
    return JSON.parse(raw.value) as VoiceConversationState;
  } catch {
    return undefined;
  }
};

// ---------------------------------------------------------------------------
// Reducer — handles only UI-local state (no conversation state)
// ---------------------------------------------------------------------------

type ListeningPhase = "idle" | "listening" | "hearing" | "processing";

type VoiceLocalState = {
  speechState: SpeechCaptureState;
  parsedVoiceSet: ParsedVoiceSet | null;
  voiceExerciseName: string | undefined;
  voiceCandidateNames: string[];
  voiceFeedback: string | undefined;
  liveTranscript: string;
  listeningPhase: ListeningPhase;
  pendingSessionClose: boolean;
  handsFreeEnabled: boolean;
  handsFreeStatus: HandsFreeStatus;
};

type VoiceAction =
  | { type: "TRANSCRIPT_PROCESSED"; voiceFeedback: string | undefined; pendingSessionClose: boolean; parsedVoiceSet: ParsedVoiceSet | null; voiceExerciseName: string | undefined; voiceCandidateNames: string[] }
  | { type: "CAPTURE_STARTED" }
  | { type: "CAPTURE_ERROR"; voiceFeedback: string }
  | { type: "CAPTURE_ENDED" }
  | { type: "LIVE_TRANSCRIPT"; liveTranscript: string }
  | { type: "LISTENING_PHASE"; listeningPhase: ListeningPhase }
  | { type: "SET_PENDING_CLOSE"; pendingSessionClose: boolean }
  | { type: "SET_VOICE_FEEDBACK"; voiceFeedback: string | undefined }
  | { type: "CLEAR_PARSED" }
  | { type: "HANDS_FREE_ON" }
  | { type: "HANDS_FREE_OFF" }
  | { type: "HANDS_FREE_STATUS"; handsFreeStatus: HandsFreeStatus };

const initialState: VoiceLocalState = {
  speechState: getSpeechSupportState(),
  parsedVoiceSet: null,
  voiceExerciseName: undefined,
  voiceCandidateNames: [],
  voiceFeedback: undefined,
  liveTranscript: "",
  listeningPhase: "idle",
  pendingSessionClose: false,
  handsFreeEnabled: false,
  handsFreeStatus: "off"
};

const voiceReducer = (state: VoiceLocalState, action: VoiceAction): VoiceLocalState => {
  switch (action.type) {
    case "TRANSCRIPT_PROCESSED":
      return {
        ...state,
        voiceFeedback: action.voiceFeedback,
        pendingSessionClose: action.pendingSessionClose,
        parsedVoiceSet: action.parsedVoiceSet,
        voiceExerciseName: action.voiceExerciseName,
        voiceCandidateNames: action.voiceCandidateNames
      };
    case "CAPTURE_STARTED":
      return { ...state, speechState: "listening", listeningPhase: "listening", liveTranscript: "" };
    case "CAPTURE_ERROR":
      return { ...state, speechState: "error", voiceFeedback: action.voiceFeedback };
    case "CAPTURE_ENDED":
      return { ...state, speechState: getSpeechSupportState(), listeningPhase: "idle" };
    case "LIVE_TRANSCRIPT":
      return { ...state, liveTranscript: action.liveTranscript };
    case "LISTENING_PHASE":
      return { ...state, listeningPhase: action.listeningPhase };
    case "SET_PENDING_CLOSE":
      return { ...state, pendingSessionClose: action.pendingSessionClose };
    case "SET_VOICE_FEEDBACK":
      return { ...state, voiceFeedback: action.voiceFeedback };
    case "CLEAR_PARSED":
      return { ...state, parsedVoiceSet: null, voiceExerciseName: undefined, voiceCandidateNames: [] };
    case "HANDS_FREE_ON":
      return { ...state, handsFreeEnabled: true };
    case "HANDS_FREE_OFF":
      return { ...state, handsFreeEnabled: false, handsFreeStatus: "off" };
    case "HANDS_FREE_STATUS":
      return { ...state, handsFreeStatus: action.handsFreeStatus };
  }
};

// ---------------------------------------------------------------------------
// Confirmation helpers
// ---------------------------------------------------------------------------

const CONFIRMATION_RE = /^(?:s[iì]|confermo|ok|chiudi|esatto|certo|vai)$/;
const CANCELLATION_RE = /^(?:no|annulla|aspetta|cancel)$/;

// ---------------------------------------------------------------------------
// Public types (unchanged API)
// ---------------------------------------------------------------------------

export type VoiceSessionState = {
  speechState: SpeechCaptureState;
  parsedVoiceSet: ParsedVoiceSet | null;
  voiceExerciseName: string | undefined;
  voiceCandidateNames: string[];
  voiceFeedback: string | undefined;
  conversationState: VoiceConversationState | undefined;
  activeExerciseName: string | undefined;
  liveTranscript: string;
  listeningPhase: ListeningPhase;
  pendingSessionClose: boolean;
  handsFreeEnabled: boolean;
  handsFreeStatus: HandsFreeStatus;
};

export type VoiceSessionActions = {
  handleVoiceCapture: () => Promise<boolean>;
  toggleHandsFree: () => void;
  setPendingSessionClose: (value: boolean) => void;
  setVoiceFeedback: (value: string | undefined) => void;
  clearParsedVoiceSet: () => void;
  stopHandsFree: () => void;
  processTranscript: (transcript: string) => Promise<void>;
};

type UseVoiceSessionOptions = {
  activeProfileId: string | undefined;
  sessionId: string | undefined;
  onComplete: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useVoiceSession = (
  options: UseVoiceSessionOptions
): VoiceSessionState & VoiceSessionActions => {
  const { activeProfileId, sessionId, onComplete } = options;

  const [localState, dispatch] = useReducer(voiceReducer, initialState);
  const handsFreeRef = useRef<HandsFreeController | null>(null);

  // Reactive conversation state from DB — single source of truth
  const conversationState = useConversationState();

  // Derive active exercise name reactively from conversation state
  const activeExerciseName = useLiveQuery(
    async () => {
      if (!conversationState?.activeExerciseId) return undefined;
      const exercise = await getExerciseById(conversationState.activeExerciseId);
      return exercise?.canonicalName;
    },
    [conversationState?.activeExerciseId],
    undefined
  );

  // Stable refs for async callbacks (avoid stale closures)
  const localStateRef = useRef(localState);
  localStateRef.current = localState;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const activeProfileIdRef = useRef(activeProfileId);
  activeProfileIdRef.current = activeProfileId;

  // Hydrate voice context on session change
  useEffect(() => {
    if (!sessionId) return;
    void hydrateConversationStateForSession(sessionId);
  }, [sessionId]);

  // Cleanup hands-free on unmount
  useEffect(() => {
    return () => {
      handsFreeRef.current?.stop();
    };
  }, []);

  // -- Core: process a transcript and dispatch a single update --
  const processTranscript = useCallback(async (transcript: string) => {
    const profileId = activeProfileIdRef.current;
    if (!profileId) return;

    const currentLocalState = localStateRef.current;

    // Handle pending session close
    if (currentLocalState.pendingSessionClose) {
      const normalized = normalizeText(transcript);
      if (CONFIRMATION_RE.test(normalized)) {
        await onCompleteRef.current();
        dispatch({ type: "SET_PENDING_CLOSE", pendingSessionClose: false });
        return;
      }
      if (CANCELLATION_RE.test(normalized)) {
        dispatch({ type: "SET_PENDING_CLOSE", pendingSessionClose: false });
        dispatch({ type: "SET_VOICE_FEEDBACK", voiceFeedback: FB_CLOSE_CANCELLED });
        return;
      }
      dispatch({ type: "SET_PENDING_CLOSE", pendingSessionClose: false });
    }

    // processVoiceCommand writes conversation state to DB →
    // useLiveQuery auto-picks it up, no manual sync needed
    const result = await processVoiceCommand(transcript, profileId);

    let voiceExerciseName: string | undefined;
    if (result.parsedVoiceSet?.canonicalExerciseId) {
      const exercise = await getExerciseById(result.parsedVoiceSet.canonicalExerciseId);
      voiceExerciseName = exercise?.canonicalName;
    }

    dispatch({
      type: "TRANSCRIPT_PROCESSED",
      voiceFeedback: result.feedback,
      pendingSessionClose: result.sessionAction === "close_session_pending",
      parsedVoiceSet: result.parsedVoiceSet ?? null,
      voiceExerciseName,
      voiceCandidateNames: result.candidateNames ?? []
    });
  }, []); // no deps — uses refs for everything

  // Stable ref for hands-free callback
  const processTranscriptRef = useRef(processTranscript);
  processTranscriptRef.current = processTranscript;

  // -- Manual voice capture (button tap) --
  const handleVoiceCapture = useCallback(async (): Promise<boolean> => {
    if (!activeProfileIdRef.current) return false;

    handsFreeRef.current?.pauseListening();
    let success = false;

    try {
      dispatch({ type: "CAPTURE_STARTED" });

      const transcript = await captureSpeechOnce({
        lang: "it-IT",
        silenceMs: 5000,
        onTranscriptChange: (value) => dispatch({ type: "LIVE_TRANSCRIPT", liveTranscript: value }),
        onStateChange: (phase) => dispatch({ type: "LISTENING_PHASE", listeningPhase: phase })
      });

      await processTranscriptRef.current(transcript);
      success = true;
    } catch (error) {
      dispatch({
        type: "CAPTURE_ERROR",
        voiceFeedback:
          error instanceof Error && error.message === FB_NO_TEXT_RECOGNIZED
            ? FB_NOTHING_HEARD
            : FB_RECOGNITION_ERROR
      });
    } finally {
      dispatch({ type: "CAPTURE_ENDED" });

      if (localStateRef.current.handsFreeEnabled) {
        handsFreeRef.current?.resumeListening();
      }
    }

    return success;
  }, []);

  // -- Hands-free toggle --
  const toggleHandsFree = useCallback(() => {
    if (localStateRef.current.handsFreeEnabled) {
      handsFreeRef.current?.stop();
      handsFreeRef.current = null;
      dispatch({ type: "HANDS_FREE_OFF" });
    } else {
      const controller = startHandsFreeMode({
        wakePhrase: "gym",
        lang: "it-IT",
        onCommand: (t) => processTranscriptRef.current(t),
        onStatusChange: (status) => dispatch({ type: "HANDS_FREE_STATUS", handsFreeStatus: status }),
        onWakeDetected: () => dispatch({ type: "SET_VOICE_FEEDBACK", voiceFeedback: FB_WAKE_DETECTED })
      });
      handsFreeRef.current = controller;
      dispatch({ type: "HANDS_FREE_ON" });
    }
  }, []);

  const stopHandsFree = useCallback(() => {
    handsFreeRef.current?.stop();
    handsFreeRef.current = null;
    dispatch({ type: "HANDS_FREE_OFF" });
  }, []);

  const clearParsedVoiceSet = useCallback(() => {
    dispatch({ type: "CLEAR_PARSED" });
  }, []);

  const setPendingSessionClose = useCallback((value: boolean) => {
    dispatch({ type: "SET_PENDING_CLOSE", pendingSessionClose: value });
  }, []);

  const setVoiceFeedback = useCallback((value: string | undefined) => {
    dispatch({ type: "SET_VOICE_FEEDBACK", voiceFeedback: value });
  }, []);

  return {
    ...localState,
    conversationState,
    activeExerciseName,
    handleVoiceCapture,
    toggleHandsFree,
    setPendingSessionClose,
    setVoiceFeedback,
    clearParsedVoiceSet,
    stopHandsFree,
    processTranscript
  };
};
