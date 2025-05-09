
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { ReportMetrics } from "@/types/reports";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentsReportProps {
  data: ReportMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AppointmentsReport = ({ data }: AppointmentsReportProps) => {
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

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{data.appointmentsCount || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Agendamentos no período selecionado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento com Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(data.appointmentsRevenue)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Receita de agendamentos concluídos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.appointmentsCount && data.appointmentsRevenue ? 
                  data.appointmentsRevenue / data.appointmentsCount : 0)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Valor médio por agendamento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Agendamentos por Dia
            </CardTitle>
            <CardDescription>
              Distribuição de agendamentos ao longo do período
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-80">
            {data.appointmentsChart && data.appointmentsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={data.appointmentsChart}
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
                  <YAxis tickFormatter={(value) => value ? value.toString() : "0"} />
                  <Tooltip 
                    formatter={(value) => [`${value} agendamentos`, "Quantidade"]}
                    labelFormatter={formatChartDate}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    name="Agendamentos"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Sem dados de agendamentos no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Status de Agendamentos
            </CardTitle>
            <CardDescription>
              Distribuição por status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-80">
            {data.appointmentStatusData && data.appointmentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  >
                    {data.appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} agendamentos`, "Quantidade"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Sem dados de status de agendamentos no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AppointmentsReport;
