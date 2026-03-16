import { useState } from "react";

type CreateProfileFormProps = {
  onCreate: (displayName: string) => Promise<void>;
};

export const CreateProfileForm = ({ onCreate }: CreateProfileFormProps) => {
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
  );
};
