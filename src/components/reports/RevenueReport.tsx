
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, FileText, ShoppingCart, PieChart, LineChart } from "lucide-react";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { ReportMetrics } from "@/types/reports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RevenueReportProps {
  data: ReportMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const RevenueReport = ({ data }: RevenueReportProps) => {
  if (!data) return null;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatChartDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM', { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const chartTooltipFormatter = (value: any) => {
    if (value === undefined || value === null) return ["R$ 0,00", "Faturamento"];
    try {
      return [formatCurrency(Number(value)), "Faturamento"];
    } catch (error) {
      console.error("Error formatting tooltip value:", error);
      return ["R$ 0,00", "Faturamento"];
    }
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalRevenue || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {(data.salesCount || 0) + (data.appointmentsCount || 0)} transações no período
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
              {Math.round((((data.servicesRevenue || 0) + (data.appointmentsRevenue || 0)) / (data.totalRevenue || 1)) * 100) || 0}% do total
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
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(data.productsRevenue || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(((data.productsRevenue || 0) / (data.totalRevenue || 1)) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(data.appointmentsRevenue || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(((data.appointmentsRevenue || 0) / (data.totalRevenue || 1)) * 100) || 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2" />
              Faturamento por Período
            </CardTitle>
            <CardDescription>
              Evolução do faturamento ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-80">
            {data.salesChart && data.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
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
                  <YAxis tickFormatter={(value) => value ? `R$ ${value}` : "R$ 0"} />
                  <Tooltip 
                    formatter={(value) => chartTooltipFormatter(value)}
                    labelFormatter={formatChartDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                    name="Faturamento"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <LineChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Sem dados de faturamento no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Distribuição de Receita
            </CardTitle>
            <CardDescription>
              Distribuição entre serviços e produtos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-80">
            {data.totalRevenue && data.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Serviços', value: (data.servicesRevenue || 0) + (data.appointmentsRevenue || 0) },
                      { name: 'Produtos', value: data.productsRevenue || 0 }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {[
                      { name: 'Serviços', value: (data.servicesRevenue || 0) + (data.appointmentsRevenue || 0) },
                      { name: 'Produtos', value: data.productsRevenue || 0 }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value || 0))} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PieChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Sem dados de receita no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default RevenueReport;
