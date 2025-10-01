// src/components/reports/RevenueReport.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText, ShoppingCart, LineChart as LineIcon, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { ReportMetrics } from "@/types/reports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RevenueReportProps {
  data: ReportMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function RevenueReport({ data }: RevenueReportProps) {
  if (!data) return null;

  // Formata valores em moeda BRL
  const formatCurrency = (value: number = 0) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Formata datas para "dd/MM"
  const formatChartDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Dados para o pie chart, só itens com valor > 0
  const revenueDistributionData = [
    { name: 'Serviços', value: data.servicesRevenue || 0 },
    { name: 'Produtos', value: data.productsRevenue || 0 },
    { name: 'Agendamentos', value: data.appointmentsRevenue || 0 },
  ].filter(item => item.value > 0);

  return (
    <>
      {/* === Cards de Resumo === */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.totalRevenue || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {(data.salesCount || 0) + (data.appointmentsCount || 0)} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency((data.servicesRevenue || 0) + (data.appointmentsRevenue || 0))}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(
                (((data.servicesRevenue || 0) + (data.appointmentsRevenue || 0)) /
                  (data.totalRevenue || 1)) * 100
              )}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.productsRevenue || 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(((data.productsRevenue || 0) / (data.totalRevenue || 1)) * 100)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* === Gráficos === */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineIcon className="h-5 w-5 mr-2" />
              Faturamento por Período
            </CardTitle>
            <CardDescription>Evolução do faturamento ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80 overflow-auto">
            {data.salesChart && data.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.salesChart}
                  margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tickFormatter={(v) => `R$ ${v}`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}
                    labelFormatter={formatChartDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    name="Faturamento"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <LineIcon className="h-10 w-10 mb-2" />
                <p>Sem dados de faturamento</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieIcon className="h-5 w-5 mr-2" />
              Distribuição de Receita
            </CardTitle>
            <CardDescription>Serviços, produtos e agendamentos</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80 overflow-auto">
            {revenueDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDistributionData}
                    cx="50%"
                    cy="45%"
                    outerRadius={60}
                    dataKey="value"
                    nameKey="name"
                  >
                    {revenueDistributionData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconSize={8}
                    formatter={(val) => String(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <PieIcon className="h-10 w-10 mb-2" />
                <p>Sem dados de receita</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
