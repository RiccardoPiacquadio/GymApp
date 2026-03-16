import { useAppStore } from "../../../store/appStore";

export const useAppBoot = () => {
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const isReady = useAppStore((state) => state.isReady);

  return { activeProfileId, isReady };
};
