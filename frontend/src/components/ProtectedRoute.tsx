// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect } from "react";
import { toast } from "sonner";

const ProtectedRoute = () => {
  const {
    user,
    loading,
    profile,
    isInTrialPeriod,
    isSubscriptionActive,
    signOut,
  } = useAuth();
  const location = useLocation();
  const adminOnlyRoutes = ["/relatorios", "/assinatura"];
  const currentPathIsAdminOnly = adminOnlyRoutes.includes(location.pathname);

  useEffect(() => {
    if (profile?.role === "atendente" && currentPathIsAdminOnly) {
      toast.error("Acesso restrito", {
        description: "Você não tem permissão para acessar esta página.",
      });
    }
  }, [profile?.role, currentPathIsAdminOnly]);

  // 1) Durante o loading de auth, mostra spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-petblue-600" />
      </div>
    );
  }

  // 2) Se logado mas e-mail não confirmado, desloga e vai p/ login com toast
  if (user && !(user as any).email_confirmed_at) {
    toast.error("Por favor, confirme seu e-mail antes de continuar.");
    signOut();
    return <Navigate to="/login" replace />;
  }

  // 3) Se não estiver logado, redireciona p/ login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4) Enquanto trial/subscription carregam, mostra spinner
  if (isInTrialPeriod == null || isSubscriptionActive == null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-petblue-600" />
      </div>
    );
  }

  // 4b) Enquanto estiver logado mas ainda não tiver trazido o profile, mostra spinner
  if (user && profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-petblue-600" />
      </div>
    );
  }

  // 5) Role-based: atendente não acessa rotas admin-only
  if (profile.role === "atendente" && currentPathIsAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // 6) Se trial expirou e sem assinatura, redireciona p/ expired (exceto /assinatura)
  if (
    isInTrialPeriod === false &&
    isSubscriptionActive === false &&
    location.pathname !== "/assinatura"
  ) {
    return <Navigate to="/expired" replace />;
  }

  // 7) Caso contrário, segue pra rota interna
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
