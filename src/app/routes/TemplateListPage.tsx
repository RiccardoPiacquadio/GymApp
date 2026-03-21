import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { useConfirm } from "../../hooks/useConfirm";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import {
  deleteTemplate,
  getTemplatesForUser,
  startSessionFromTemplate
} from "../../features/templates/services/templateRepository";
import { getActiveSessionForUser } from "../../features/sessions/services/sessionRepository";

export const TemplateListPage = () => {
  const navigate = useNavigate();
  const { activeProfileId } = useActiveProfile();
  const { confirm, ConfirmDialog } = useConfirm();

  const bundles = useLiveQuery(
    () => (activeProfileId ? getTemplatesForUser(activeProfileId) : []),
    [activeProfileId],
    []
  );

  const activeSession = useLiveQuery(
    () => (activeProfileId ? getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );

  const handleDelete = useCallback(async (templateId: string, name: string) => {
    const ok = await confirm({
      title: "Elimina template",
      message: `Vuoi eliminare "${name}"? L'azione non è reversibile.`,
      confirmLabel: "Elimina",
      variant: "danger"
    });
    if (ok) await deleteTemplate(templateId);
  }, [confirm]);

  const handleStart = useCallback(async (templateId: string, name: string) => {
    if (!activeProfileId) return;

    if (activeSession) {
      const ok = await confirm({
        title: "Sessione attiva",
        message: "Hai già una sessione attiva. Vuoi andare alla sessione corrente?",
        confirmLabel: "Vai alla sessione",
        variant: "default"
      });
      if (ok) navigate("/workout/active");
      return;
    }

    const ok = await confirm({
      title: "Inizia allenamento",
      message: `Vuoi iniziare "${name}"?`,
      confirmLabel: "Inizia",
      variant: "default"
    });
    if (ok) {
      await startSessionFromTemplate(activeProfileId, templateId);
      navigate("/workout/active");
    }
  }, [activeProfileId, activeSession, confirm, navigate]);

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <SectionTitle
        title="Allenamenti predefiniti"
        subtitle="Template pronti da avviare."
        action={
          <Link className="primary-button px-3 py-2 text-xs" to="/templates/new">
            Nuovo template
          </Link>
        }
      />
      <div className="space-y-3">
        {bundles.map((bundle) => (
          <div key={bundle.template.id} className="app-panel p-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <Link to={`/templates/${bundle.template.id}`} className="block">
                  <p className="text-base font-semibold">{bundle.template.name}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {bundle.exercises.length} esercizi
                    {bundle.exercises.length > 0
                      ? ` · ${bundle.exercises.map((e) => e.exercise.canonicalName).join(", ")}`
                      : null}
                  </p>
                </Link>
              </div>
              <button
                type="button"
                className="primary-button shrink-0 px-3 py-2 text-xs"
                onClick={() => void handleStart(bundle.template.id, bundle.template.name)}
              >
                Inizia
              </button>
              <button
                type="button"
                className="shrink-0 rounded-xl p-2 text-ink/40 transition hover:bg-danger/10 hover:text-danger"
                onClick={() => void handleDelete(bundle.template.id, bundle.template.name)}
                aria-label="Elimina template"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {bundles.length === 0 ? (
          <div className="app-panel p-4 text-sm text-ink/70">
            Nessun template creato. Crea il tuo primo allenamento predefinito!
          </div>
        ) : null}
      </div>
    </div>
  );
};
