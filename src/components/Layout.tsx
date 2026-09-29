import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";
import { LoginModal } from "./LoginModal";
import logo from "../assets/logo.png";
import { AdminIcon, CalendarIcon, HomeIcon, ListIcon, LoginIcon, LogoutIcon, TagIcon } from "./icons";

const navItems = [
  { to: "/", label: "Übersicht", end: true, Icon: HomeIcon },
  { to: "/events", label: "Termine", end: false, Icon: CalendarIcon },
  { to: "/lists", label: "Listen", end: false, Icon: ListIcon },
  { to: "/basare", label: "Nummernvergabe", end: false, Icon: TagIcon },
];

export function Layout() {
  const { firebaseUser, profile, isAdmin, logout } = useAuth();
  const { open: openLogin } = useLoginModal();

  const items = isAdmin
    ? [...navItems, { to: "/admin/users", label: "Verwaltung", end: false, Icon: AdminIcon }]
    : navItems;

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-white text-brand-700"
        : "text-white/90 hover:bg-white/15 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 bg-brand-600 pt-[env(safe-area-inset-top)] shadow-sm print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Kinderbazar-Team Logo"
              className="h-11 w-11 rounded-[22%] object-contain sm:h-14 sm:w-14"
            />
            <span className="font-bold text-white">Kinderbazar Team</span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {items.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {firebaseUser ? (
              <>
                <span className="hidden text-sm text-white/80 sm:inline">
                  {profile?.name}
                </span>
                <button
                  onClick={logout}
                  aria-label="Abmelden"
                  className="rounded-full p-2.5 text-white/90 transition hover:bg-white/15 hover:text-white sm:rounded-xl sm:px-3 sm:py-2"
                >
                  <LogoutIcon className="h-5 w-5 sm:hidden" />
                  <span className="hidden text-sm font-medium sm:inline">Abmelden</span>
                </button>
              </>
            ) : (
              <button
                onClick={openLogin}
                aria-label="Anmelden"
                className="flex items-center gap-1.5 rounded-full p-2.5 text-white/90 transition hover:bg-white/15 hover:text-white sm:rounded-xl sm:px-3 sm:py-2"
              >
                <LoginIcon className="h-5 w-5 sm:hidden" />
                <span className="hidden text-sm font-medium sm:inline">Anmelden</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:py-8 sm:pb-8">
        <Outlet />
      </main>

      <LoginModal />

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden print:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {items.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                  isActive ? "text-brand-600" : "text-neutral-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.2]" : ""}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
