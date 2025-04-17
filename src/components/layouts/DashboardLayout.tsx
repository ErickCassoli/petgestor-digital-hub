
import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Package, 
  ShoppingCart, 
  BarChart, 
  CreditCard, 
  LogOut, 
  Menu, 
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: React.ElementType;
  rolesWithAccess: ("admin" | "atendente")[];
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut, isInTrialPeriod } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const sidebarItems: SidebarItem[] = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, rolesWithAccess: ["admin", "atendente"] },
    { path: "/clientes", label: "Clientes e Pets", icon: Users, rolesWithAccess: ["admin", "atendente"] },
    { path: "/agendamentos", label: "Agendamentos", icon: Calendar, rolesWithAccess: ["admin", "atendente"] },
    { path: "/produtos", label: "Produtos e Estoque", icon: Package, rolesWithAccess: ["admin", "atendente"] },
    { path: "/vendas", label: "Vendas", icon: ShoppingCart, rolesWithAccess: ["admin", "atendente"] },
    { path: "/relatorios", label: "Relatórios", icon: BarChart, rolesWithAccess: ["admin"] },
    { path: "/assinatura", label: "Plano", icon: CreditCard, rolesWithAccess: ["admin"] },
  ];

  // Filter items based on user role
  const filteredItems = sidebarItems.filter(item => 
    user && item.rolesWithAccess.includes(user.role)
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed z-50 top-4 left-4 p-2 rounded-md bg-white shadow-md text-petblue-600"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Backdrop (Mobile) */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "w-72 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out transform md:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center" onClick={closeSidebar}>
            <span className="text-2xl font-bold text-petblue-600">PetGestor</span>
          </Link>
        </div>

        {isInTrialPeriod && (
          <div className="bg-amber-50 p-3 border-b border-amber-200">
            <p className="text-sm text-amber-800 font-medium">
              Período de avaliação: {user?.trialEndDate ? 
                `${Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes` : 
                '7 dias'}
            </p>
          </div>
        )}

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-petblue-50 text-petblue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={closeSidebar}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-800">{user?.email}</p>
              <p className="text-sm text-gray-500">
                {user?.role === "admin" ? "Administrador" : "Atendente"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-gray-700"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-6 md:ml-72 transition-all duration-300",
      )}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
