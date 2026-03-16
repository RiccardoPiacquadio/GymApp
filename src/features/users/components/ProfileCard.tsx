import type { UserProfile } from "../../../types";

type ProfileCardProps = {
  profile: UserProfile;
  isActive: boolean;
  onSelect: (profileId: string) => void | Promise<void>;
};

export const ProfileCard = ({ profile, isActive, onSelect }: ProfileCardProps) => (
  <button
    type="button"
    onClick={() => onSelect(profile.id)}
    className={`app-panel w-full p-4 text-left transition ${
      isActive ? "border-ink bg-slate-50" : "hover:border-slate-300"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-base font-semibold">{profile.displayName}</p>
        <p className="text-sm text-slate-500">Profilo locale</p>
      </div>
      <span className={`pill ${isActive ? "bg-ink text-white" : ""}`}>{isActive ? "Attivo" : "Seleziona"}</span>
    </div>
  </button>
);
