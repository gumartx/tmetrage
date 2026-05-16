import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const isLoggedIn = (() => {
    try {
      const saved = localStorage.getItem("tmetrage_profile");
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return !!(parsed.profileName || parsed.email);
    } catch {
      return false;
    }
  })();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;