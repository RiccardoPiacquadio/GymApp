import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { exportUserDataAsCsv, exportUserDataAsJson, downloadFile } from "../../features/analytics/services/dataExportService";
import { BodyWeightTracker } from "../../features/bodyweight/components/BodyWeightTracker";
import { CreateProfileForm } from "../../features/users/components/CreateProfileForm";
import { ProfileCard } from "../../features/users/components/ProfileCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { useConfirm } from "../../hooks/useConfirm";
import {
  createProfile,
  deleteProfile,
  getManagerProfileId,
  getProfiles,
  updateProfileDisplayName
} from "../../features/users/services/userRepository";
import type { UserProfile } from "../../types";

export const ProfileSelectPage = () => {
  const navigate = useNavigate();
  const { activeProfileId, profile: activeProfile, setActiveProfileId } = useActiveProfile();
  const profiles = useLiveQuery(() => getProfiles(), [], []);
  const managerId = useLiveQuery(() => getManagerProfileId(), [], undefined);
  const [duplicateProfile, setDuplicateProfile] = useState<UserProfile | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const [editingProfileId, setEditingProfileId] = useState<string>();
  const [editingName, setEditingName] = useState("");
  const [profileAdminMessage, setProfileAdminMessage] = useState<string>();

  const canManageProfiles = Boolean(activeProfileId && managerId && activeProfileId === managerId);

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
    const shouldDelete = await confirm({
      title: "Cancella profilo",
      message: `Vuoi cancellare il profilo ${profile.displayName}? Verranno eliminati anche sessioni, esercizi e serie salvate di quel profilo.`,
      confirmLabel: "Cancella",
      variant: "danger"
    });
    if (!shouldDelete) {
      return;
    }

    const result = await deleteProfile(profile.id);
    if (result.status === "deleted") {
      setProfileAdminMessage("Profilo e relativo storico cancellati.");
      return;
    }

    if (result.status === "blocked_active_profile") {
      setProfileAdminMessage("Non puoi cancellare il profilo attualmente loggato.");
    }
  };

  return (
    <div className="space-y-5">
      {ConfirmDialog}
      <section>
        <SectionTitle
          title="Seleziona profilo"
          subtitle="Scegli o crea un profilo locale."
        />
        {canManageProfiles ? (
          <div className="app-panel mb-3 p-4 text-sm text-ink/80">
            Sei il gestore dei profili: puoi modificare e cancellare gli altri profili. La cancellazione e' bloccata solo per il profilo attivo.
          </div>
        ) : null}
        {profileAdminMessage ? <div className="app-panel mb-3 p-4 text-sm text-ink/80">{profileAdminMessage}</div> : null}
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
            <div className="app-panel p-4 text-sm text-ink/70">Nessun profilo creato. Inizia dal modulo qui sotto.</div>
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

      {/* Body weight tracker */}
      {activeProfileId ? <BodyWeightTracker userId={activeProfileId} /> : null}

      {/* Data export */}
      {activeProfileId ? (
        <section className="app-panel space-y-3 p-5">
          <h3 className="text-sm font-semibold">Esporta dati</h3>
          <p className="text-xs text-ink/50">Scarica tutti i tuoi dati di allenamento.</p>
          <div className="flex gap-2">
            <button
              className="secondary-button px-4 py-2 text-xs"
              type="button"
              onClick={async () => {
                const json = await exportUserDataAsJson(activeProfileId);
                downloadFile(json, "gymapp-export.json", "application/json");
              }}
            >
              Esporta JSON
            </button>
            <button
              className="secondary-button px-4 py-2 text-xs"
              type="button"
              onClick={async () => {
                const csv = await exportUserDataAsCsv(activeProfileId);
                downloadFile(csv, "gymapp-export.csv", "text/csv");
              }}
            >
              Esporta CSV
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};

