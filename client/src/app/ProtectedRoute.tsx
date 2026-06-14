import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
