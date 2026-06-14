import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { FileUp, LayoutDashboard, LogOut, Moon, Plus, Sun, Users } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../features/auth/AuthProvider";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("fairshare-theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fairshare-theme", theme);
  }, [theme]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-cloud text-ink transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard" className="group inline-flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-ink text-sm font-black text-cloud shadow-lg transition group-hover:-translate-y-0.5">
              FS
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight text-ink">FairShare</span>
              <span className="hidden text-xs text-muted sm:block">Flatmate expense intelligence</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-elevated/55 p-1">
            <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <NavItem to="/groups/new" icon={<Plus size={16} />} label="Group" />
            <NavItem to="/imports" icon={<FileUp size={16} />} label="Import" />
            <span className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-muted md:inline-flex">
              <Users size={16} /> {user?.name}
            </span>
            <Button
              variant="ghost"
              className="min-h-9 px-3"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <Button variant="ghost" onClick={handleLogout} aria-label="Log out">
              <LogOut size={16} /> Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        `inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
          isActive ? "bg-surface text-ink shadow-sm" : "text-muted hover:bg-surface/70 hover:text-ink"
        }`
      }
      to={to}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}
