import type { ParsedVoiceSet } from "../types/voice";

type VoiceParsePreviewProps = {
  parsed: ParsedVoiceSet;
  exerciseName?: string;
  candidateNames?: string[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export const VoiceParsePreview = ({
  parsed,
  exerciseName,
  candidateNames,
  onConfirm,
  onCancel
}: VoiceParsePreviewProps) => (
  <div className="dark-panel p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {exerciseName ?? "Esercizio?"} — {parsed.weight ?? "?"} kg x {parsed.reps ?? "?"}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/60">{parsed.rawText}</p>
      </div>
      <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink">
        {Math.round(parsed.confidence * 100)}%
      </span>
    </div>
    {parsed.feedbackMessage ? (
      <p className="mt-2 text-xs text-chrome">{parsed.feedbackMessage}</p>
    ) : null}
    {candidateNames && candidateNames.length > 0 ? (
      <p className="mt-1 text-xs text-white/60">Forse: {candidateNames.join(", ")}</p>
    ) : null}
    <div className="mt-3 flex gap-2">
      <button className="primary-button flex-1 !py-2 text-xs" type="button" disabled={!parsed.isValid} onClick={() => void onConfirm()}>
        Conferma
      </button>
      <button className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20" type="button" onClick={onCancel}>
        Annulla
      </button>
    </div>
  </div>
);
