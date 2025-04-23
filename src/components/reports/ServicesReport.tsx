
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ReportMetrics } from "@/types/reports";

interface ServicesReportProps {
  data: ReportMetrics | null;
}

const ServicesReport = ({ data }: ServicesReportProps) => {
  if (!data) return null;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Serviços Mais Vendidos
        </CardTitle>
        <CardDescription>
          Ranking dos serviços mais populares no período
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 h-80">
        {data.topServices && data.topServices.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data.topServices.slice(0, 10)}
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
                  if (!value) return [0, name === "quantity" ? "Quantidade" : "Faturamento"];
                  if (name === "quantity") return [`${value} unidades`, "Quantidade"];
                  return [formatCurrency(Number(value)), "Faturamento"];
                }}
              />
              <Bar dataKey="quantity" fill="#3b82f6" name="Quantidade" />
              <Bar dataKey="revenue" fill="#22c55e" name="Faturamento" />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>Sem dados de serviços no período selecionado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicesReport;
