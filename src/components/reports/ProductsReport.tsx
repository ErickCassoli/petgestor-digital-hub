
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ReportMetrics } from "@/types/reports";

interface ProductsReportProps {
  data: ReportMetrics | null;
}

const ProductsReport = ({ data }: ProductsReportProps) => {
  if (!data) return null;

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Produtos Mais Vendidos
        </CardTitle>
        <CardDescription>
          Ranking dos produtos mais populares no período
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 h-80">
        {data.topProducts && data.topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data.topProducts.slice(0, 10)}
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
              <Bar dataKey="quantity" fill="#f59e0b" name="Quantidade" />
              <Bar dataKey="revenue" fill="#ef4444" name="Faturamento" />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <ShoppingCart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>Sem dados de produtos no período selecionado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsReport;
