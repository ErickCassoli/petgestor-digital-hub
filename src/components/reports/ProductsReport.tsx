import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { ReportMetrics } from "@/types/reports";

interface Props { data: ReportMetrics|null; }

export default function ProductsReport({ data }: Props) {
  if (!data?.topProducts?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" /> Produtos Mais Vendidos
          </CardTitle>
          <CardDescription>Sem dados de produtos no período</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.topProducts.map(p => ({
    name: p.name,
    revenue: p.revenue
  }));
  const fmt = (v:number)=> v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" /> Produtos Mais Vendidos
        </CardTitle>
        <CardDescription>Ranking por faturamento</CardDescription>
      </CardHeader>
      <CardContent className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top:20, right:30, left:100, bottom:5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={v=>v.toString()} />
            <YAxis 
              type="category"
              dataKey="name"
              width={150}
              tickFormatter={v=> v.length>15 ? `${v.slice(0,15)}…` : v}
            />
            <Tooltip formatter={v=>[fmt(Number(v)),"Faturamento"]} />
            <Bar dataKey="revenue" fill="#ef4444" name="Faturamento" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
