
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, LineChart } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ReportMetrics } from "@/types/reports";

interface ClientsReportProps {
  data: ReportMetrics | null;
}

const ClientsReport = ({ data }: ClientsReportProps) => {
  if (!data) return null;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Clientes Frequentes
          </CardTitle>
          <CardDescription>
            Ranking dos clientes que mais visitaram o petshop
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {data.topClients && data.topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data.topClients.slice(0, 10)}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => value ? value.toString() : "0"} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tickFormatter={(value) => value ? (value.length > 15 ? `${value.substring(0, 15)}...` : value) : ""}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (!value) return [0, "Visitas"];
                    if (name === "visits") return [`${value} visitas`, "Visitas"];
                    return [formatCurrency(Number(value || 0)), "Gasto Total"];
                  }}
                />
                <Bar dataKey="visits" fill="#8884d8" name="Visitas" />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>Sem dados de clientes no período selecionado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2" />
            Gasto por Cliente
          </CardTitle>
          <CardDescription>
            Clientes que mais gastaram no período
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {data.topClients && data.topClients.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data.topClients.slice(0, 10)}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => value ? `R$ ${value}` : "R$ 0"} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tickFormatter={(value) => value ? (value.length > 15 ? `${value.substring(0, 15)}...` : value) : ""}
                />
                <Tooltip 
                  formatter={(value) => value ? [formatCurrency(Number(value)), "Gasto Total"] : ["R$ 0,00", "Gasto Total"]}
                />
                <Bar dataKey="spent" fill="#82ca9d" name="Gasto Total" />
              </RechartsBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <LineChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>Sem dados de gastos de clientes no período selecionado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsReport;
