import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Appointments from "@/pages/Appointments";
import Products from "@/pages/Products";
import Sales from "@/pages/Sales";
import Reports from "@/pages/Reports";
import Subscription from "@/pages/Subscription";
import ExpiredSubscription from "@/pages/ExpiredSubscription";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import Services from "@/pages/Services";
import ForgotPassword from "@/pages/ForgotPassword";
import UpdatePassword from "@/pages/UpdatePassword";
import ConfirmedEmail from "@/pages/ConfirmedEmail";






const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/expired" element={<ExpiredSubscription />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/atualizar-senha" element={<UpdatePassword />} />
            <Route path="/confirmed-email" element={<ConfirmedEmail />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clientes" element={<Clients />} />
              <Route path="/agendamentos" element={<Appointments />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/vendas" element={<Sales />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/assinatura" element={<Subscription />} />
              <Route path="/servicos" element={<Services />} />
            </Route>
            
            {/* Redirect /admin to /dashboard for convenience */}
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Not Found route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
