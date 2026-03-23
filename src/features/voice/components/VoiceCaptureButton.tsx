import type { SpeechCaptureState } from "../types/voice";

type VoiceCaptureButtonProps = {
  state: SpeechCaptureState;
  onStart: () => Promise<unknown>;
};

export const VoiceCaptureButton = ({ state, onStart }: VoiceCaptureButtonProps) => (
  <div className="space-y-1">
    <button
      type="button"
      className="secondary-button w-full gap-2"
      disabled={state === "unsupported" || state === "listening"}
      onClick={() => void onStart()}
    >
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
        <path d="M10 2a3 3 0 00-3 3v5a3 3 0 006 0V5a3 3 0 00-3-3z" />
        <path d="M5 10a1 1 0 10-2 0 7 7 0 0014 0 1 1 0 10-2 0 5 5 0 01-10 0z" />
        <path d="M9 17.93V19a1 1 0 102 0v-1.07A7.032 7.032 0 009 17.93z" />
      </svg>
      {state === "unsupported" ? "Voce non supportata" : state === "listening" ? "Ascolto..." : "Aggiungi via voce"}
    </button>
    {state === "idle" ? (
      <p className="text-center text-[10px] text-ink/35">es. &ldquo;panca 80 per 8&rdquo;</p>
    ) : null}
  </div>
);
