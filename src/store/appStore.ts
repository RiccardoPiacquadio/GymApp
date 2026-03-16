import { create } from "zustand";
import { getLastActiveProfileId, setLastActiveProfile } from "../features/users/services/userRepository";

type AppStoreState = {
  activeProfileId?: string;
  isReady: boolean;
  setActiveProfileId: (profileId?: string) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAppStore = create<AppStoreState>((set) => ({
  activeProfileId: undefined,
  isReady: false,
  setActiveProfileId: async (profileId) => {
    if (profileId) {
      await setLastActiveProfile(profileId);
    }

    set({ activeProfileId: profileId });
  },
  hydrate: async () => {
    const activeProfileId = await getLastActiveProfileId();
    set({ activeProfileId, isReady: true });
  }
}));
