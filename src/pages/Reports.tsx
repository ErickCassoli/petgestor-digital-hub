
import { useState } from "react";
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
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const periodOptions = [
  { label: "Últimos 7 dias", value: "7days" },
  { label: "Últimos 30 dias", value: "30days" },
  { label: "Este mês", value: "thisMonth" },
  { label: "Último mês", value: "lastMonth" },
  { label: "Este ano", value: "thisYear" },
  { label: "Personalizado", value: "custom" }
];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");

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
  };

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

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">R$ 8.950,00</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">+12% em relação ao período anterior</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-petblue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">R$ 5.780,00</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">64% do faturamento total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">R$ 3.170,00</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">36% do faturamento total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clientes Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">78</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">+8 novos clientes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
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
              <CardContent className="flex justify-center items-center p-6">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <LineChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Gráfico de Faturamento por Período</p>
                    <p className="text-sm text-gray-400 mt-1">
                      (Simulação - seria implementado com Recharts)
                    </p>
                  </div>
                </div>
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
              <CardContent className="flex justify-center items-center p-6">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <PieChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Gráfico de Distribuição de Receita</p>
                    <p className="text-sm text-gray-400 mt-1">
                      (Simulação - seria implementado com Recharts)
                    </p>
                  </div>
                </div>
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
            <CardContent className="flex justify-center items-center p-6">
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Gráfico de Serviços Mais Vendidos</p>
                  <p className="text-sm text-gray-400 mt-1">
                    (Simulação - seria implementado com Recharts)
                  </p>
                </div>
              </div>
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
            <CardContent className="flex justify-center items-center p-6">
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  <p>Gráfico de Produtos Mais Vendidos</p>
                  <p className="text-sm text-gray-400 mt-1">
                    (Simulação - seria implementado com Recharts)
                  </p>
                </div>
              </div>
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
              <CardContent className="flex justify-center items-center p-6">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Gráfico de Clientes Frequentes</p>
                    <p className="text-sm text-gray-400 mt-1">
                      (Simulação - seria implementado com Recharts)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Novos Clientes
                </CardTitle>
                <CardDescription>
                  Evolução de novos clientes ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center p-6">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <LineChart className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                    <p>Gráfico de Novos Clientes</p>
                    <p className="text-sm text-gray-400 mt-1">
                      (Simulação - seria implementado com Recharts)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
