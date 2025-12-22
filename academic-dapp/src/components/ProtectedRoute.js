import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole, children }) {
  const { role } = useAuth();

  // Not connected
  if (role === null) {
    return <Navigate to="/" replace />;
  }

  // Role not allowed
  if (role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
