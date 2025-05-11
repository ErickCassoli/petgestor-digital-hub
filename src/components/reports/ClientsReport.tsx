import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users, LineChart as ChartIcon } from "lucide-react";
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

export default function ClientsReport({ data }: Props) {
  if (!data) return null;
  const fmt = (v:number)=> v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Visitas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" /> Clientes Frequentes
          </CardTitle>
          <CardDescription>Quem mais visitou o petshop</CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {data.topByVisits?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topByVisits}
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
                <Tooltip formatter={v=>[`${v} visitas`,"Visitas"]} />
                <Bar dataKey="visits" fill="#8884d8" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <Users className="h-10 w-10 mb-2" /> Sem dados de visitas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gasto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ChartIcon className="h-5 w-5 mr-2" /> Gasto por Cliente
          </CardTitle>
          <CardDescription>Quem mais gastou no período</CardDescription>
        </CardHeader>
        <CardContent className="p-4 h-80">
          {data.topBySpending?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topBySpending}
                layout="vertical"
                margin={{ top:20, right:30, left:100, bottom:5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v=>`R$ ${v}`} />
                <YAxis 
                  type="category"
                  dataKey="name"
                  width={150}
                  tickFormatter={v=> v.length>15 ? `${v.slice(0,15)}…` : v}
                />
                <Tooltip formatter={v=>[fmt(Number(v)),"Gasto Total"]} />
                <Bar dataKey="spent" fill="#82ca9d" name="Gasto Total" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <ChartIcon className="h-10 w-10 mb-2" /> Sem dados de gasto
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
