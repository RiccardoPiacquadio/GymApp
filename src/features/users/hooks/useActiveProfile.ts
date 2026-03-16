import { useLiveQuery } from "dexie-react-hooks";
import { useAppStore } from "../../../store/appStore";
import { getProfileById } from "../services/userRepository";

export const useActiveProfile = () => {
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const setActiveProfileId = useAppStore((state) => state.setActiveProfileId);
  const profile = useLiveQuery(
    async () => (activeProfileId ? await getProfileById(activeProfileId) : undefined),
    [activeProfileId]
  );

  return { activeProfileId, profile, setActiveProfileId };
};
