import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
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

interface AppointmentsReportProps {
  data: ReportMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AppointmentsReport({ data }: AppointmentsReportProps) {
  if (!data) return null;

  const fmtDate = (d: string) => format(new Date(d), 'dd/MM', { locale: ptBR });

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* -- seus cards de resumo aqui, sem alteração -- */}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* BARRA POR DIA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Agendamentos por Dia
            </CardTitle>
            <CardDescription>Distribuição ao longo do período</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80">
            <div className="overflow-x-auto h-full">
              <div style={{ minWidth: 360, height: '100%' }}>
                {data.appointmentsChart?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={data.appointmentsChart}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis />
                      <Tooltip formatter={(v) => [`${v} agendamentos`, "Qtd."]} />
                      <Bar dataKey="count" fill="#3b82f6" name="Agendamentos" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <Calendar className="h-10 w-10 mb-2" />
                    <p>Sem dados de agendamentos</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIE DE STATUS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Status de Agendamentos
            </CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {data.appointmentStatusData?.length ? (
                <PieChart>
                  <Pie
                    data={data.appointmentStatusData}
                    cx="50%"
                    cy="45%"
                    outerRadius={60}
                    dataKey="value"
                  >
                    {data.appointmentStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} agendamentos`, "Qtd."]} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconSize={8}
                    formatter={(value) => String(value)}
                  />
                </PieChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <Clock className="h-10 w-10 mb-2" />
                  <p>Sem dados de status</p>
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
