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
  <div className="dark-panel space-y-3 p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-white">Anteprima input vocale</p>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">{Math.round(parsed.confidence * 100)}%</span>
    </div>
    <div className="space-y-1 text-sm text-white/90">
      <p>Testo: {parsed.rawText}</p>
      <p>Esercizio: {exerciseName ?? "Non riconosciuto"}</p>
      <p>
        Set: {parsed.weight ?? "-"} kg x {parsed.reps ?? "-"}
      </p>
      {parsed.feedbackMessage ? <p className="font-medium text-orange-300">{parsed.feedbackMessage}</p> : null}
      {candidateNames && candidateNames.length > 0 ? (
        <p className="text-white">Possibili esercizi: {candidateNames.join(", ")}</p>
      ) : null}
    </div>
    <div className="flex gap-3">
      <button className="primary-button flex-1" type="button" disabled={!parsed.isValid} onClick={() => void onConfirm()}>
        Conferma
      </button>
      <button className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-mist" type="button" onClick={onCancel}>
        Annulla
      </button>
    </div>
  </div>
);
