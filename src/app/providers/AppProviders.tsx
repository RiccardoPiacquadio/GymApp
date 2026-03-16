import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { seedDatabase } from "../../db";
import { useAppStore } from "../../store/appStore";

export const AppProviders = ({ children }: PropsWithChildren) => {
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    seedDatabase()
      .then(() => hydrate())
      .catch((error) => {
        console.error("App bootstrap error", error);
        hydrate();
      });
  }, [hydrate]);

  return <>{children}</>;
};
