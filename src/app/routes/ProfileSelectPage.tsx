import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { CreateProfileForm } from "../../features/users/components/CreateProfileForm";
import { ProfileCard } from "../../features/users/components/ProfileCard";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { createProfile, getProfiles } from "../../features/users/services/userRepository";

export const ProfileSelectPage = () => {
  const navigate = useNavigate();
  const { activeProfileId, setActiveProfileId } = useActiveProfile();
  const profiles = useLiveQuery(() => getProfiles(), [], []);

  const handleSelect = async (profileId: string) => {
    await setActiveProfileId(profileId);
    navigate("/dashboard");
  };

  const handleCreate = async (displayName: string) => {
    const profile = await createProfile(displayName);
    await setActiveProfileId(profile.id);
    navigate("/dashboard");
  };

  return (
    <div className="space-y-5">
      <section>
        <SectionTitle
          title="Seleziona profilo"
          subtitle="Login leggero locale: scegli un profilo esistente o creane uno nuovo."
        />
        <div className="space-y-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} isActive={profile.id === activeProfileId} onSelect={handleSelect} />
          ))}
          {profiles.length === 0 ? (
            <div className="app-panel p-4 text-sm text-slate-500">Nessun profilo creato. Inizia dal modulo qui sotto.</div>
          ) : null}
        </div>
      </section>

      <section>
        <CreateProfileForm onCreate={handleCreate} />
      </section>
    </div>
  );
};
