import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { to: "/", label: "Übersicht", end: true },
  { to: "/events", label: "Termine" },
  { to: "/lists", label: "Listen" },
];

export function Layout() {
  const { profile, isAdmin, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-brand-500 text-white"
        : "text-neutral-600 hover:bg-brand-100 hover:text-brand-700"
    }`;

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-lg">
              🎪
            </span>
            <span className="font-bold text-neutral-800">Kinderbazar Team</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin/users" className={linkClass}>
                Verwaltung
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {profile?.name}
            </span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
