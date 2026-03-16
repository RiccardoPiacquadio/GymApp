import type { ParsedVoiceSet } from "../types/voice";

type VoiceParsePreviewProps = {
  parsed: ParsedVoiceSet;
  exerciseName?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export const VoiceParsePreview = ({
  parsed,
  exerciseName,
  onConfirm,
  onCancel
}: VoiceParsePreviewProps) => (
  <div className="app-panel space-y-3 border border-amber-200 bg-amber-50 p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-800">Anteprima input vocale</p>
      <span className="pill bg-white">{Math.round(parsed.confidence * 100)}%</span>
    </div>
    <div className="space-y-1 text-sm text-slate-700">
      <p>Testo: {parsed.rawText}</p>
      <p>Esercizio: {exerciseName ?? "Non riconosciuto"}</p>
      <p>
        Set: {parsed.weight ?? "-"} kg x {parsed.reps ?? "-"}
      </p>
    </div>
    <div className="flex gap-3">
      <button className="primary-button flex-1" type="button" disabled={!parsed.isValid} onClick={() => void onConfirm()}>
        Conferma
      </button>
      <button className="secondary-button flex-1" type="button" onClick={onCancel}>
        Annulla
      </button>
    </div>
  </div>
);
