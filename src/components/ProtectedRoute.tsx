
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";

const ProtectedRoute = () => {
  const { user, loading, isInTrialPeriod, isSubscriptionActive } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading spinner or skeleton
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-petblue-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If subscription expired and not in trial period, redirect to expired page
  // Except for the subscription page itself
  if (!isInTrialPeriod && !isSubscriptionActive && location.pathname !== "/assinatura") {
    return <Navigate to="/expired" replace />;
  }

  // Check role-based access for specific routes
  if (user.role === "atendente" && (location.pathname === "/relatorios" || location.pathname === "/assinatura")) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has access to this route
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
