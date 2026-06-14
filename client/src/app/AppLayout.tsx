import { LogOut, Plus, Users } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../features/auth/AuthProvider";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-cloud">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/dashboard" className="text-xl font-bold text-ink">
            FairShare
          </Link>
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100" to="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100" to="/groups/new">
              <span className="inline-flex items-center gap-2">
                <Plus size={16} /> Group
              </span>
            </Link>
            <span className="hidden items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm md:inline-flex">
              <Users size={16} /> {user?.name}
            </span>
            <Button variant="ghost" onClick={handleLogout} aria-label="Log out">
              <LogOut size={16} /> Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
