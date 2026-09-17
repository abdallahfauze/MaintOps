import { useAuth } from "@/lib/AuthContext";
import AdminDashboard from "./AdminDashboard";
import Executor from "./Executor";
import RequesterDashboard from "./RequesterDashboard";

/**
 * Unified command center — renders different views based on user role.
 * All users land here after login.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "admin" || role === "leadership" || role === "coordinator") {
    return <AdminDashboard />;
  }

  if (role === "maintenance") {
    return <Executor />;
  }

  if (role === "requester") {
    return <RequesterDashboard />;
  }

  return null;
}
