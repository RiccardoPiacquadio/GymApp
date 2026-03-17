import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { SectionTitle } from "../../components/common/SectionTitle";
import { getActiveSessionForUser, startWorkoutSession } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

export const StartWorkoutPage = () => {
  const navigate = useNavigate();
  const { activeProfileId, profile } = useActiveProfile();
  const activeSession = useLiveQuery(
    async () => (activeProfileId ? await getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );

  const handleStart = async () => {
    if (!activeProfileId) {
      return;
    }
    await startWorkoutSession(activeProfileId);
    navigate("/workout/active");
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="Inizia allenamento" subtitle="Apri o riprendi una sessione attiva per il profilo locale selezionato." />
      <div className="app-panel space-y-4 p-5">
        <div>
          <p className="text-sm text-ink/70">Profilo</p>
          <p className="text-xl font-semibold">{profile?.displayName ?? "Nessun profilo"}</p>
        </div>
        <button className="primary-button w-full" type="button" onClick={() => void handleStart()}>
          {activeSession ? "Riprendi sessione attiva" : "Crea nuova sessione"}
        </button>
      </div>
    </div>
  );
};

