
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Download, 
  BarChart, 
  PieChart,
  LineChart,
  ChevronDown,
  Check,
  FileText,
  ShoppingCart,
  Users,
  TrendingUp,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

const periodOptions = [
  { label: "Últimos 7 dias", value: "7days" },
  { label: "Últimos 30 dias", value: "30days" },
  { label: "Este mês", value: "thisMonth" },
  { label: "Último mês", value: "lastMonth" },
  { label: "Este ano", value: "thisYear" }
];

interface ReportMetrics {
  totalRevenue: number;
  servicesRevenue: number;
  productsRevenue: number;
  mixedRevenue: number;
  salesCount: number;
  servicesSalesCount: number;
  productsSalesCount: number;
  mixedSalesCount: number;
  salesChart?: { date: string; value: number }[];
  topProducts?: { id: string; name: string; quantity: number; revenue: number }[];
  topServices?: { id: string; name: string; quantity: number; revenue: number }[];
  topClients?: { id: string; name: string; visits: number; spent: number }[];
  totalClients?: number;
  totalVisits?: number;
}

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportMetrics | null>(null);

  // Get period label
  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "Período";
  };

  // Handle export
  const handleExport = (format: string) => {
    toast({
      title: "Exportando relatório",
      description: `O relatório será exportado em formato ${format.toUpperCase()}.`,
    });
    // Implementation for exporting would go here
  };

  // Calculate date range based on selected period
  const getDateRange = () => {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date();
    
    switch (selectedPeriod) {
      case "7days":
        startDate = subDays(today, 7);
        break;
      case "30days":
        startDate = subDays(today, 30);
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(today, 1));
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    return { startDate, endDate };
  };

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange();
        
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            userId: user.id,
            reportType: activeTab,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
        
        if (error) throw error;
        
        setReportData(data as ReportMetrics);
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast({
          variant: "destructive",
          title: "Erro ao gerar relatório",
          description: "Ocorreu um erro ao buscar os dados para o relatório."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [user, toast, activeTab, selectedPeriod]);

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Format date for charts
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

  // Chart tooltip formatter
  const chartTooltipFormatter = (value: any) => {
    if (value === undefined || value === null) return ["R$ 0,00", "Faturamento"];
    try {
      return [formatCurrency(Number(value)), "Faturamento"];
    } catch (error) {
      console.error("Error formatting tooltip value:", error);
      return ["R$ 0,00", "Faturamento"];
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // JSX for the loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-petblue-600" />
        <span className="ml-2 text-lg text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Visualize métricas e análises do seu petshop
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex justify-between">
                <Calendar className="h-4 w-4 mr-2" />
                {getPeriodLabel()}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {periodOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {selectedPeriod === option.value && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-petblue-600 hover:bg-petblue-700">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                Exportar como Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {reportData && activeTab === "revenue" && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{reportData.salesCount || 0} vendas no período</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-petblue-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.servicesRevenue || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.round(((reportData.servicesRevenue || 0) / (reportData.totalRevenue || 1)) * 100) || 0}% do faturamento total
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
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.productsRevenue || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.round(((reportData.productsRevenue || 0) / (reportData.totalRevenue || 1)) * 100) || 0}% do faturamento total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Vendas Mistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.mixedRevenue || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Math.round(((reportData.mixedRevenue || 0) / (reportData.totalRevenue || 1)) * 100) || 0}% do faturamento total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Faturamento por Período
                </CardTitle>
                <CardDescription>
                  Evolução do faturamento ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-80">
                {reportData && reportData.salesChart && reportData.salesChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={reportData.salesChart}
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
                {reportData && reportData.totalRevenue > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Serviços', value: reportData.servicesRevenue || 0 },
                          { name: 'Produtos', value: reportData.productsRevenue || 0 },
                          { name: 'Mistos', value: reportData.mixedRevenue || 0 }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {[
                          { name: 'Serviços', value: reportData.servicesRevenue || 0 },
                          { name: 'Produtos', value: reportData.productsRevenue || 0 },
                          { name: 'Mistos', value: reportData.mixedRevenue || 0 }
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
        </TabsContent>

        <TabsContent value="services">
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
              {reportData && reportData.topServices && reportData.topServices.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={reportData.topServices.slice(0, 10)}
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
        </TabsContent>

        <TabsContent value="products">
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
              {reportData && reportData.topProducts && reportData.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={reportData.topProducts.slice(0, 10)}
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
        </TabsContent>

        <TabsContent value="clients">
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
                {reportData && reportData.topClients && reportData.topClients.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={reportData.topClients.slice(0, 10)}
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
                {reportData && reportData.topClients && reportData.topClients.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={reportData.topClients.slice(0, 10)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

