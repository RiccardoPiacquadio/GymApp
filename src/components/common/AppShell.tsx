import { useMemo, type PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getActiveSessionForUser } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="7" rx="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" />
  </svg>
);

const DumbbellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="3" height="8" rx="1" />
    <rect x="16" y="6" width="3" height="8" rx="1" />
    <rect x="4" y="4" width="3" height="12" rx="1" />
    <rect x="13" y="4" width="3" height="12" rx="1" />
    <line x1="7" y1="10" x2="13" y2="10" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" />
    <polyline points="10,5 10,10 13.5,13.5" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" />
  </svg>
);

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/workout/active", label: "Allenamento", icon: DumbbellIcon },
  { to: "/history", label: "Storico", icon: HistoryIcon },
  { to: "/profiles", label: "Profili", icon: UserIcon }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { activeProfileId, profile } = useActiveProfile();
  const activeSession = useLiveQuery(
    () => (activeProfileId ? getActiveSessionForUser(activeProfileId) : undefined),
    [activeProfileId]
  );

  const swipePages = useMemo(
    () => ["/dashboard", "/workout/active", "/history", "/profiles"],
    []
  );

  const swipeDir = useSwipeNavigation(swipePages);

  const slideClass = swipeDir === "left"
    ? "animate-slide-in-left"
    : swipeDir === "right"
      ? "animate-slide-in-right"
      : "";

  return (
    <div className="min-h-screen bg-app-glow">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-28 pt-5">
        <header className="mb-5 flex items-start justify-between gap-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-chrome">CalleGymApp</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{profile ? `Ciao ${profile.displayName}` : "CalleGymApp"}</h1>
          </div>
          {activeSession ? <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">Sessione attiva</span> : null}
        </header>
        <main className={`flex-1 ${slideClass}`}>{children}</main>
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
                  className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-center text-xs font-semibold transition ${
                    isActive ? "bg-accent text-white" : "bg-white text-ink"
                  }`}
                >
                  <item.icon />
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

