import type { SpeechCaptureState } from "../types/voice";

type VoiceCaptureButtonProps = {
  state: SpeechCaptureState;
  onToggle: () => Promise<boolean>;
};

export const VoiceCaptureButton = ({ state, onToggle }: VoiceCaptureButtonProps) => (
  <button
    type="button"
    className="secondary-button w-full"
    disabled={state === "unsupported"}
    onClick={() => void onToggle()}
  >
    {state === "unsupported" ? "Voce non supportata" : state === "listening" ? "Ferma ascolto" : "Aggiungi via voce"}
  </button>
);
