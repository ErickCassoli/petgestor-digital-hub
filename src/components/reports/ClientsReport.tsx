// src/components/reports/ClientsReport.tsx
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

interface Props { data: ReportMetrics | null; }

export default function ClientsReport({ data }: Props) {
  if (!data) return null;
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    // container centralizado + padding horizontal igual ao Reports.tsx
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* VISITAS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" /> Clientes Frequentes
            </CardTitle>
            <CardDescription>Quem mais visitou o petshop</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80">
            <div className="overflow-x-auto h-full">
              <div className="min-w-[360px] h-full">
                {data.topByVisits?.length ? (
                  <ResponsiveContainer width="100%" height="70%">
                    <BarChart
                      data={data.topByVisits}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tickFormatter={v => v.length > 12 ? `${v.slice(0, 12)}…` : v}
                      />
                      <Tooltip formatter={v => [`${v} visitas`, "Visitas"]} />
                      <Bar dataKey="visits" fill="#8884d8" name="Visitas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <Users className="h-10 w-10 mb-2" /> Sem dados de visitas
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GASTO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartIcon className="h-5 w-5 mr-2" /> Gasto por Cliente
            </CardTitle>
            <CardDescription>Quem mais gastou no período</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64 sm:h-80">
            <div className="overflow-x-auto h-full">
              <div className="min-w-[360px] h-full">
                {data.topBySpending?.length ? (
                  <ResponsiveContainer width="100%" height="70%">
                    <BarChart
                      data={data.topBySpending}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={v => `R$ ${v}`} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tickFormatter={v => v.length > 12 ? `${v.slice(0, 12)}…` : v}
                      />
                      <Tooltip formatter={v => [fmt(Number(v)), "Gasto Total"]} />
                      <Bar dataKey="spent" fill="#82ca9d" name="Gasto Total" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <ChartIcon className="h-10 w-10 mb-2" /> Sem dados de gasto
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
