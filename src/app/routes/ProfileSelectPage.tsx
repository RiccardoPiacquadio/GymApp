import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { CreateProfileForm } from "../../features/users/components/CreateProfileForm";
import { ProfileCard } from "../../features/users/components/ProfileCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import {
  createProfile,
  deleteProfile,
  getProfiles,
  isProfileManager,
  updateProfileDisplayName
} from "../../features/users/services/userRepository";
import type { UserProfile } from "../../types";

export const ProfileSelectPage = () => {
  const navigate = useNavigate();
  const { activeProfileId, profile: activeProfile, setActiveProfileId } = useActiveProfile();
  const profiles = useLiveQuery(() => getProfiles(), [], []);
  const [duplicateProfile, setDuplicateProfile] = useState<UserProfile | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string>();
  const [editingName, setEditingName] = useState("");
  const [profileAdminMessage, setProfileAdminMessage] = useState<string>();

  const canManageProfiles = isProfileManager(activeProfile);

  const handleSelect = async (profileId: string) => {
    await setActiveProfileId(profileId);
    navigate("/dashboard");
  };

  const handleCreate = async (displayName: string) => {
    const result = await createProfile(displayName);
    if (result.status === "duplicate") {
      setDuplicateProfile(result.profile);
      return;
    }

    setDuplicateProfile(null);
    await setActiveProfileId(result.profile.id);
    navigate("/dashboard");
  };

  const handleUseExistingDuplicate = async () => {
    if (!duplicateProfile) {
      return;
    }

    await setActiveProfileId(duplicateProfile.id);
    navigate("/dashboard");
  };

  const handleStartEdit = (profile: UserProfile) => {
    setEditingProfileId(profile.id);
    setEditingName(profile.displayName);
    setProfileAdminMessage(undefined);
  };

  const handleSaveEdit = async (profileId: string) => {
    const result = await updateProfileDisplayName(profileId, editingName);

    if (result.status === "duplicate") {
      setProfileAdminMessage(`Nome già usato dal profilo ${result.profile.displayName}.`);
      return;
    }

    if (result.status === "updated") {
      setEditingProfileId(undefined);
      setEditingName("");
      setProfileAdminMessage("Profilo aggiornato.");
    }
  };

  const handleDelete = async (profile: UserProfile) => {
    const shouldDelete = window.confirm(`Vuoi cancellare il profilo ${profile.displayName}?`);
    if (!shouldDelete) {
      return;
    }

    const result = await deleteProfile(profile.id);
    if (result.status === "deleted") {
      setProfileAdminMessage("Profilo cancellato.");
      return;
    }

    if (result.status === "blocked_active_profile") {
      setProfileAdminMessage("Non puoi cancellare il profilo attualmente loggato.");
      return;
    }

    if (result.status === "blocked_has_sessions") {
      setProfileAdminMessage("Non puoi cancellare un profilo che ha già sessioni salvate.");
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle
          title="Seleziona profilo"
          subtitle="Login leggero locale: scegli un profilo esistente o creane uno nuovo."
        />
        {canManageProfiles ? (
          <div className="app-panel mb-3 p-4 text-sm text-slate-700">
            Sei loggato come Riccardo Piacquadio: puoi modificare e cancellare i profili. La cancellazione è bloccata per il profilo attivo e per i profili con sessioni salvate.
          </div>
        ) : null}
        {profileAdminMessage ? <div className="app-panel mb-3 p-4 text-sm text-slate-700">{profileAdminMessage}</div> : null}
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              canManage={canManageProfiles}
              isEditing={editingProfileId === profile.id}
              editingName={editingProfileId === profile.id ? editingName : profile.displayName}
              onSelect={handleSelect}
              onEditNameChange={setEditingName}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => {
                setEditingProfileId(undefined);
                setEditingName("");
              }}
              onDelete={handleDelete}
            />
          ))}
          {profiles.length === 0 ? (
            <div className="app-panel p-4 text-sm text-slate-500">Nessun profilo creato. Inizia dal modulo qui sotto.</div>
          ) : null}
        </div>
      </section>

      <section>
        <CreateProfileForm
          onCreate={handleCreate}
          duplicateProfileName={duplicateProfile?.displayName}
          onUseExisting={handleUseExistingDuplicate}
          onDismissDuplicate={() => setDuplicateProfile(null)}
        />
      </section>
    </div>
  );
};
