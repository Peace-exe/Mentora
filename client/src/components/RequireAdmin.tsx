import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export default function RequireAdmin() {
  const { user, isHydrated, isLoggedIn } = useUserStore();

  // Don't redirect until localStorage has been read —
  // prevents false /login redirect on hard refresh
  if (!isHydrated) return null;

  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />;
}