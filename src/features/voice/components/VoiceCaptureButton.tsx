import type { SpeechCaptureState } from "../types/voice";

type VoiceCaptureButtonProps = {
  state: SpeechCaptureState;
  onStart: () => Promise<void>;
};

export const VoiceCaptureButton = ({ state, onStart }: VoiceCaptureButtonProps) => (
  <button
    type="button"
    className="secondary-button w-full"
    disabled={state === "unsupported" || state === "listening"}
    onClick={() => void onStart()}
  >
    {state === "unsupported" ? "Voce non supportata" : state === "listening" ? "Ascolto..." : "Aggiungi via voce"}
  </button>
);
