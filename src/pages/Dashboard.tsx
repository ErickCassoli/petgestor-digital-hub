
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Package, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

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

const Dashboard = () => {
  const { user, isInTrialPeriod } = useAuth();

  // Mock data for dashboard
  const metrics = [
    {
      title: "Clientes",
      value: "42",
      description: "Total de clientes cadastrados",
      icon: Users,
      href: "/clientes"
    },
    {
      title: "Agendamentos",
      value: "12",
      description: "Agendamentos para hoje",
      icon: Calendar,
      href: "/agendamentos"
    },
    {
      title: "Produtos",
      value: "87",
      description: "Produtos em estoque",
      icon: Package,
      href: "/produtos"
    },
    {
      title: "Vendas",
      value: "R$ 3.240",
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
            Bem-vindo, {user?.email}. Aqui está um resumo do seu petshop.
          </p>
        </div>
        {isInTrialPeriod && (
          <div className="mt-4 sm:mt-0 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-200 text-sm">
            <span className="font-medium">Período de avaliação:</span> {user?.trialEndDate ? 
              `${Math.ceil((new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes` : 
              '7 dias'}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
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
            <div className="space-y-4">
              {[
                {
                  pet: "Max",
                  tutor: "João Silva",
                  service: "Banho e Tosa",
                  time: "Hoje, 14:00"
                },
                {
                  pet: "Luna",
                  tutor: "Maria Oliveira",
                  service: "Consulta Veterinária",
                  time: "Hoje, 15:30"
                },
                {
                  pet: "Thor",
                  tutor: "Pedro Santos",
                  service: "Banho",
                  time: "Hoje, 16:45"
                },
                {
                  pet: "Mel",
                  tutor: "Ana Costa",
                  service: "Tosa",
                  time: "Amanhã, 09:15"
                },
              ].map((appointment, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.pet} ({appointment.tutor})</p>
                    <p className="text-sm text-gray-500">{appointment.service}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-4">
              {[
                {
                  name: "Ração Premium Cães Adultos",
                  stock: "3 unidades",
                  min: "5 unidades"
                },
                {
                  name: "Shampoo Neutro",
                  stock: "2 unidades",
                  min: "5 unidades"
                },
                {
                  name: "Antipulgas Comprimido",
                  stock: "4 unidades",
                  min: "10 unidades"
                },
                {
                  name: "Escova de Pelos",
                  stock: "1 unidade",
                  min: "3 unidades"
                },
              ].map((product, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-red-500">Estoque: {product.stock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mínimo: {product.min}</p>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default Dashboard;
