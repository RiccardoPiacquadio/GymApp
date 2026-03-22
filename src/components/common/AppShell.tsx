import { useMemo, type PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { getActiveSessionForUser } from "../../features/sessions/services/sessionRepository";
import { useActiveProfile } from "../../features/users/hooks/useActiveProfile";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";

const DashboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="7" height="7" rx="2" />
    <rect x="11" y="2" width="7" height="7" rx="2" />
    <rect x="2" y="11" width="7" height="7" rx="2" />
    <rect x="11" y="11" width="7" height="7" rx="2" />
  </svg>
);

const DumbbellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="3" height="8" rx="1" />
    <rect x="16" y="6" width="3" height="8" rx="1" />
    <rect x="4" y="4" width="3" height="12" rx="1" />
    <rect x="13" y="4" width="3" height="12" rx="1" />
    <line x1="7" y1="10" x2="13" y2="10" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="8" />
    <polyline points="10,5 10,10 13.5,13.5" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" />
  </svg>
);

const TemplateIcon = () => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="14" height="16" rx="2" />
    <line x1="7" y1="6" x2="13" y2="6" />
    <line x1="7" y1="10" x2="13" y2="10" />
    <line x1="7" y1="14" x2="10" y2="14" />
  </svg>
);

const navItems = [
  { to: "/dashboard", label: "Home", icon: DashboardIcon },
  { to: "/workout/active", label: "Workout", icon: DumbbellIcon },
  { to: "/templates", label: "Template", icon: TemplateIcon },
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
    () => ["/dashboard", "/workout/active", "/templates", "/history", "/profiles"],
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-32 pt-6">
        <header className="mb-6 flex items-center justify-between gap-4 text-white">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-chrome/70">CalleGymApp</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{profile ? `Ciao ${profile.displayName}` : "CalleGymApp"}</h1>
          </div>
          {activeSession ? (
            <span className="animate-pulse rounded-full bg-accent/90 px-3 py-1 text-[10px] font-semibold text-white shadow-glow">
              Sessione attiva
            </span>
          ) : null}
        </header>
        <main className={`flex-1 ${slideClass}`}>{children}</main>
      </div>
      {location.pathname !== "/profiles" ? (
        <nav className="fixed inset-x-0 bottom-0 border-t border-white/[0.06] bg-[#0a0a0a]/95 px-4 pb-[env(safe-area-inset-bottom,10px)] pt-3 shadow-nav backdrop-blur-xl">
          <div className="mx-auto flex max-w-md justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 transition-all duration-200 ${
                    isActive
                      ? "text-accent"
                      : "text-white/45 hover:text-white/70"
                  }`}
                >
                  <item.icon />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
};
