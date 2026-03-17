import { useState } from "react";

type CreateProfileFormProps = {
  onCreate: (displayName: string) => Promise<void>;
  duplicateProfileName?: string;
  onUseExisting?: () => Promise<void>;
  onDismissDuplicate?: () => void;
};

export const CreateProfileForm = ({
  onCreate,
  duplicateProfileName,
  onUseExisting,
  onDismissDuplicate
}: CreateProfileFormProps) => {
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(displayName);
      setDisplayName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <form className="app-panel space-y-3 p-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="displayName">
            Nuovo profilo
          </label>
          <input
            id="displayName"
            className="field-input"
            placeholder="Es. Riccardo"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <button className="primary-button w-full" disabled={isSubmitting || !displayName.trim()} type="submit">
          Crea profilo
        </button>
      </form>

      {duplicateProfileName ? (
        <div className="app-panel space-y-3 border border-accent/30 bg-accent/5 p-4 text-sm text-slate-700">
          <p className="font-medium">Questo nome è già stato utilizzato: {duplicateProfileName}</p>
          <div className="grid grid-cols-2 gap-3">
            <button className="primary-button" type="button" onClick={() => void onUseExisting?.()}>
              Carica esistente
            </button>
            <button className="secondary-button" type="button" onClick={onDismissDuplicate}>
              Annulla
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
