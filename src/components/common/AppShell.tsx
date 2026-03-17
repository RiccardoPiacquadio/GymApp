import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getActiveSessionForUser } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/workout/start", label: "Allenamento" },
  { to: "/history", label: "Storico" },
  { to: "/profiles", label: "Profili" }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { activeProfileId, profile } = useActiveProfile();
  const activeSession = useLiveQuery(
    async () => (activeProfileId ? await getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );

  return (
    <div className="min-h-screen bg-app-glow">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-5">
        <header className="mb-5 flex items-start justify-between gap-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-orange-300">GymApp PWA</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {profile ? `Ciao ${profile.displayName}` : "Workout tracker"}
            </h1>
          </div>
          {activeSession ? <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">Sessione attiva</span> : null}
        </header>
        <main className="flex-1">{children}</main>
      </div>
      {location.pathname !== "/profiles" ? (
        <nav className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#050505]/96 px-4 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-2xl px-3 py-3 text-center text-xs font-semibold transition ${
                    isActive ? "bg-accent text-white" : "bg-white text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
};
