import type { UserProfile } from "../../../types";

type ProfileCardProps = {
  profile: UserProfile;
  isActive: boolean;
  canManage: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: (profileId: string) => void | Promise<void>;
  onEditNameChange: (value: string) => void;
  onStartEdit: (profile: UserProfile) => void;
  onSaveEdit: (profileId: string) => Promise<void>;
  onCancelEdit: () => void;
  onDelete: (profile: UserProfile) => Promise<void>;
};

export const ProfileCard = ({
  profile,
  isActive,
  canManage,
  isEditing,
  editingName,
  onSelect,
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete
}: ProfileCardProps) => (
  <div className={`app-panel space-y-3 p-4 transition ${isActive ? "border-ink bg-slate-50" : "hover:border-slate-300"}`}>
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={() => void onSelect(profile.id)} className="flex-1 text-left">
        <p className="text-base font-semibold text-ink">{profile.displayName}</p>
        <p className="text-sm text-ink/70">Profilo locale</p>
      </button>
      <button
        type="button"
        onClick={() => void onSelect(profile.id)}
        className={`rounded-full px-3 py-1 text-xs font-medium ${isActive ? "bg-ink text-white" : "bg-mist text-ink"}`}
      >
        {isActive ? "Attivo" : "Carica"}
      </button>
    </div>

    {canManage ? (
      isEditing ? (
        <div className="space-y-3 rounded-2xl border border-concrete bg-white p-3">
          <input className="field-input" value={editingName} onChange={(event) => onEditNameChange(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button className="primary-button" type="button" onClick={() => void onSaveEdit(profile.id)}>
              Salva
            </button>
            <button className="secondary-button" type="button" onClick={onCancelEdit}>
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button className="secondary-button" type="button" onClick={() => onStartEdit(profile)}>
            Modifica
          </button>
          <button className="danger-button" type="button" onClick={() => void onDelete(profile)}>
            Cancella
          </button>
        </div>
      )
    ) : null}
  </div>
);


