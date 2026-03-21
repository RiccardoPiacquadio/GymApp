import { useCallback, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate, useParams } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { ExerciseList } from "../../features/exercises/components/ExerciseList";
import { ExerciseSearchInput } from "../../features/exercises/components/ExerciseSearchInput";
import { getAllAliases, getExerciseById, searchExercises } from "../../features/exercises/services/exerciseRepository";
import {
  addExerciseToTemplate,
  createTemplate,
  getTemplateById,
  removeExerciseFromTemplate,
  renameTemplate
} from "../../features/templates/services/templateRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { useConfirm } from "../../hooks/useConfirm";
import { useDebounce } from "../../hooks/useDebounce";
import { captureSpeechOnce, getSpeechSupportState } from "../../features/voice/services/speechCapture";
import { parseMultipleExercises } from "../../features/voice/services/voiceParser";
import {
  FB_NO_TEXT_RECOGNIZED,
  FB_NOTHING_HEARD,
  FB_RECOGNITION_ERROR,
  FB_TEMPLATE_NO_EXERCISES,
  fbTemplateExercisesAdded
} from "../../features/voice/services/voiceFeedback";
import type { ExerciseCanonical } from "../../types";
import type { SpeechCaptureState } from "../../features/voice/types/voice";

export const TemplateEditPage = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const { confirm, ConfirmDialog } = useConfirm();
  const isNew = !templateId;

  const [name, setName] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const effectiveId = templateId ?? createdId;

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  // Voice state
  const [speechState, setSpeechState] = useState<SpeechCaptureState>(getSpeechSupportState());
  const [voiceFeedback, setVoiceFeedback] = useState<string | undefined>();
  const [liveTranscript, setLiveTranscript] = useState("");

  const bundle = useLiveQuery(
    () => (effectiveId ? getTemplateById(effectiveId) : null),
    [effectiveId]
  );

  // Sync name from DB when editing existing template
  const [nameInitialized, setNameInitialized] = useState(false);
  if (bundle && !nameInitialized && !isNew) {
    setName(bundle.template.name);
    setNameInitialized(true);
  }

  const exercises = useLiveQuery(() => searchExercises(debouncedQuery), [debouncedQuery], []);
  const aliases = useLiveQuery(() => getAllAliases(), [], []);
  const aliasMap = useMemo(() => {
    return aliases.reduce<Record<string, string[]>>((acc, alias) => {
      acc[alias.canonicalExerciseId] = acc[alias.canonicalExerciseId] ?? [];
      acc[alias.canonicalExerciseId].push(alias.aliasText);
      return acc;
    }, {});
  }, [aliases]);

  const handleCreate = useCallback(async () => {
    if (!activeProfileId || !name.trim()) return;
    const template = await createTemplate(activeProfileId, name);
    setCreatedId(template.id);
  }, [activeProfileId, name]);

  const handleRename = useCallback(async () => {
    if (!effectiveId || !name.trim()) return;
    await renameTemplate(effectiveId, name);
  }, [effectiveId, name]);

  const handleAddExercise = useCallback(async (exercise: ExerciseCanonical) => {
    if (!effectiveId) return;
    await addExerciseToTemplate(effectiveId, exercise);
  }, [effectiveId]);

  const handleRemoveExercise = useCallback(async (templateExerciseId: string, exerciseName: string) => {
    const ok = await confirm({
      title: "Rimuovi esercizio",
      message: `Vuoi rimuovere ${exerciseName} dal template?`,
      confirmLabel: "Rimuovi",
      variant: "danger"
    });
    if (ok) await removeExerciseFromTemplate(templateExerciseId);
  }, [confirm]);

  const handleVoiceAdd = useCallback(async () => {
    if (!effectiveId) return;

    try {
      setSpeechState("listening");
      setLiveTranscript("");
      setVoiceFeedback(undefined);

      const transcript = await captureSpeechOnce({
        lang: "it-IT",
        silenceMs: 5000,
        onTranscriptChange: setLiveTranscript,
        onStateChange: () => {}
      });

      const resolved = await parseMultipleExercises(transcript);
      if (resolved.length === 0) {
        setVoiceFeedback(FB_TEMPLATE_NO_EXERCISES);
        return;
      }

      const addedNames: string[] = [];
      for (const r of resolved) {
        const exercise = await getExerciseById(r.canonicalExerciseId);
        if (exercise) {
          await addExerciseToTemplate(effectiveId, exercise);
          addedNames.push(exercise.canonicalName);
        }
      }

      setVoiceFeedback(
        addedNames.length > 0
          ? fbTemplateExercisesAdded(addedNames.length, addedNames)
          : FB_TEMPLATE_NO_EXERCISES
      );
    } catch (error) {
      setVoiceFeedback(
        error instanceof Error && error.message === FB_NO_TEXT_RECOGNIZED
          ? FB_NOTHING_HEARD
          : FB_RECOGNITION_ERROR
      );
    } finally {
      setSpeechState(getSpeechSupportState());
      setLiveTranscript("");
    }
  }, [effectiveId]);

  // Template not yet created — show name form
  if (isNew && !createdId) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Nuovo template" subtitle="Dai un nome al tuo allenamento." />
        <div className="app-panel space-y-4 p-4">
          <input
            type="text"
            className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
            placeholder="Es. Push Day, Leg Day..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="primary-button flex-1 py-2 text-sm"
              disabled={!name.trim()}
              onClick={() => void handleCreate()}
            >
              Crea
            </button>
            <button
              type="button"
              className="secondary-button px-4 py-2 text-sm"
              onClick={() => navigate("/templates")}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <SectionTitle
        title={bundle?.template.name ?? "Template"}
        subtitle="Aggiungi o rimuovi esercizi."
        action={
          <button
            type="button"
            className="secondary-button px-3 py-2 text-xs"
            onClick={() => navigate("/templates")}
          >
            Indietro
          </button>
        }
      />

      {/* Rename */}
      <div className="app-panel flex items-center gap-2 p-3">
        <input
          type="text"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="secondary-button shrink-0 px-3 py-2 text-xs"
          disabled={!name.trim() || name === bundle?.template.name}
          onClick={() => void handleRename()}
        >
          Rinomina
        </button>
      </div>

      {/* Voice add */}
      <div className="app-panel space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Aggiungi con la voce</p>
        <p className="text-xs text-ink/60">
          Dì più esercizi in sequenza, es. &quot;panca piana, trazioni, alzate laterali, curl manubri&quot;
        </p>
        <button
          type="button"
          className="secondary-button w-full"
          disabled={speechState === "unsupported" || speechState === "listening"}
          onClick={() => void handleVoiceAdd()}
        >
          {speechState === "unsupported"
            ? "Voce non supportata"
            : speechState === "listening"
              ? "Ascolto..."
              : "Aggiungi via voce"}
        </button>
        {liveTranscript ? (
          <p className="text-xs italic text-ink/50">&quot;{liveTranscript}&quot;</p>
        ) : null}
        {voiceFeedback ? (
          <p className="text-xs font-medium text-accent">{voiceFeedback}</p>
        ) : null}
      </div>

      {/* Current exercises */}
      {bundle && bundle.exercises.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Esercizi nel template</p>
          {bundle.exercises.map((te, i) => (
            <div key={te.id} className="app-panel flex items-center gap-3 p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink/10 text-xs font-semibold">
                {i + 1}
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium">{te.exercise.canonicalName}</p>
              <button
                type="button"
                className="shrink-0 rounded-xl p-2 text-ink/40 transition hover:bg-danger/10 hover:text-danger"
                onClick={() => void handleRemoveExercise(te.id, te.exercise.canonicalName)}
                aria-label="Rimuovi esercizio"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Exercise search */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Aggiungi esercizio</p>
        <ExerciseSearchInput value={query} onChange={setQuery} />
        <ExerciseList exercises={exercises} aliasMap={aliasMap} onSelect={handleAddExercise} />
      </div>
    </div>
  );
};
