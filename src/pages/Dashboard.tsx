
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Package, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import ClockDateDisplay from "@/components/dashboard/ClockDateDisplay";
import { PlanLimitNotice } from "@/components/subscription/PlanLimitNotice";
import { FreePlanAd } from "@/components/ads/FreePlanAd";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const MetricCard = ({ title, value, description, icon: Icon, href }: MetricCardProps) => (
  <Link to={href}>
    <Card className="dashboard-card hover:border-petblue-300 transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-petblue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  </Link>
);

interface DashboardMetrics {
  clientCount: number;
  appointmentsToday: number;
  productCount: number;
  monthlySales: number;
  petCount: number;
  servicesCount: number;
  monthlyAppointments: number;
}

interface AppointmentPreview {
  pet_name: string;
  client_name: string;
  service_name: string;
  date: string;
  time: string;
}

interface LowStockProduct {
  name: string;
  stock: number;
  min_stock: number;
}

interface AppointmentDataFromDB {
  id: string;
  date: string;
  time: string;
  pet_id: string;
  client_id: string;
  service_id: string;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    clientCount: 0,
    appointmentsToday: 0,
    productCount: 0,
    monthlySales: 0,
    petCount: 0,
    servicesCount: 0,
    monthlyAppointments: 0,
  });
  const [appointments, setAppointments] = useState<AppointmentPreview[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch client count
        const { count: clientCount, error: clientError } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (clientError) throw clientError;
        
        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { count: appointmentsToday, error: appointmentCountError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('date', today);
          
        if (appointmentCountError) throw appointmentCountError;
        
        // Fetch product count
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (productError) throw productError;
        
        // Fetch monthly sales total
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('total')
          .eq('user_id', user.id)
          .gte('sale_date', startOfMonth.toISOString());
          
        if (salesError) throw salesError;
        
        const monthlySales = salesData?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

        const { count: petCount, error: petError } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (petError) throw petError;

        const { count: servicesCount, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (servicesError) throw servicesError;

        const startOfMonthDate = new Date(startOfMonth);
        const endOfMonthDate = new Date(startOfMonth);
        endOfMonthDate.setMonth(endOfMonthDate.getMonth() + 1, 0);
        const startOfMonthIso = startOfMonthDate.toISOString().split('T')[0];
        const endOfMonthIso = endOfMonthDate.toISOString().split('T')[0];

        const { count: monthlyAppointments, error: monthlyAppointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('date', startOfMonthIso)
          .lte('date', endOfMonthIso);
        if (monthlyAppointmentsError) throw monthlyAppointmentsError;

        
        // Fetch upcoming appointments
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            time,
            pet_id,
            service_id
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(4);
        
        if (appointmentsError) throw appointmentsError;
        
        // Process appointments to get related data
        const formattedAppointments: AppointmentPreview[] = [];
        
        if (appointmentsData && appointmentsData.length > 0) {
          for (const appointment of appointmentsData) {
            let petName = 'Sem informação';
            let clientName = 'Sem informação';
            let serviceName = 'Sem informação';
            
            if (appointment.pet_id) {
              const { data: petData } = await supabase
                .from('pets')
                .select('name, client_id')
                .eq('id', appointment.pet_id)
                .single();
                
              if (petData) {
                petName = petData.name;
                
                // Get client name using the client_id from pet
                if (petData.client_id) {
                  const { data: clientData } = await supabase
                    .from('clients')
                    .select('name')
                    .eq('id', petData.client_id)
                    .single();
                    
                  if (clientData) clientName = clientData.name;
                }
              }
            }
            
            if (appointment.service_id) {
              const { data: serviceData } = await supabase
                .from('services')
                .select('name')
                .eq('id', appointment.service_id)
                .single();
                
              if (serviceData) serviceName = serviceData.name;
            }
            
            formattedAppointments.push({
              pet_name: petName,
              client_name: clientName,
              service_name: serviceName,
              date: appointment.date,
              time: appointment.time
            });
          }
        }
        
        // Fetch low stock products
        const { data: lowStockItems, error: lowStockError } = await supabase
          .from('products')
          .select('name, stock, min_stock')
          .eq('user_id', user.id)
          .lt('stock', 5)
          .order('stock', { ascending: true })
          .limit(4);
          
        if (lowStockError) throw lowStockError;
        
        setMetrics({
          clientCount: clientCount || 0,
          appointmentsToday: appointmentsToday || 0,
          productCount: productCount || 0,
          monthlySales: monthlySales,
          petCount: petCount || 0,
          servicesCount: servicesCount || 0,
          monthlyAppointments: monthlyAppointments || 0,
        });
        
        setAppointments(formattedAppointments);
        setLowStockProducts(lowStockItems || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Ocorreu um erro ao buscar os dados do dashboard.');
        sonnerToast.error("Erro ao carregar dados", {
          description: "Ocorreu um erro ao buscar os dados do dashboard."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, toast]);

  const metricCards = [
    {
      title: "Clientes",
      value: loading ? "--" : metrics.clientCount.toString(),
      description: "Total de clientes cadastrados",
      icon: Users,
      href: "/clientes"
    },
    {
      title: "Agendamentos",
      value: loading ? "--" : metrics.appointmentsToday.toString(),
      description: "Agendamentos para hoje",
      icon: Calendar,
      href: "/agendamentos"
    },
    {
      title: "Produtos",
      value: loading ? "--" : metrics.productCount.toString(),
      description: "Produtos em estoque",
      icon: Package,
      href: "/produtos"
    },
    {
      title: "Vendas",
      value: loading ? "--" : `R$ ${metrics.monthlySales.toFixed(2)}`,
      description: "Faturamento do mês",
      icon: ShoppingCart,
      href: "/vendas"
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo, {profile?.name}. Aqui está um resumo do seu petshop.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
          <ClockDateDisplay />        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-1">Tente recarregar a página ou entre em contato com o suporte.</p>
        </div>
      )}

      <PlanLimitNotice usage={{
        pets: metrics.petCount,
        products: metrics.productCount,
        services: metrics.servicesCount,
        appointmentsPerMonth: metrics.monthlyAppointments,
      }} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            href={metric.href}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-14 bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{appointment.pet_name} ({appointment.client_name})</p>
                      <p className="text-sm text-gray-500">{appointment.service_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {appointment.date.split('-').reverse().join('/')}, {appointment.time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum agendamento próximo encontrado.</p>
                <Link to="/agendamentos" className="text-petblue-600 hover:text-petblue-800 mt-2 inline-block">
                  Criar novo agendamento
                </Link>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <Link
                to="/agendamentos"
                className="text-sm text-petblue-600 hover:text-petblue-800 font-medium"
              >
                Ver todos os agendamentos &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Produtos com Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-14 bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-red-500">Estoque: {product.stock} unidades</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mínimo: {product.min_stock} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum produto com estoque baixo encontrado.</p>
                <Link to="/produtos" className="text-petblue-600 hover:text-petblue-800 mt-2 inline-block">
                  Gerenciar produtos
                </Link>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <Link
                to="/produtos"
                className="text-sm text-petblue-600 hover:text-petblue-800 font-medium"
              >
                Gerenciar estoque &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <FreePlanAd slot={import.meta.env.VITE_ADSENSE_SLOT_DASHBOARD} className="mt-10" />
    </div>
  );
};

export default Dashboard;



