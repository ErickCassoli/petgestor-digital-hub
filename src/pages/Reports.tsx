import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronDown,
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
import { format, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import RevenueReport from "@/components/reports/RevenueReport";
import ServicesReport from "@/components/reports/ServicesReport";
import ProductsReport from "@/components/reports/ProductsReport";
import ClientsReport from "@/components/reports/ClientsReport";
import AppointmentsReport from "@/components/reports/AppointmentsReport";
import { ReportMetrics } from "@/types/reports";

const periodOptions = [
  { label: "�sltimos 7 dias", value: "7days" },
  { label: "�sltimos 30 dias", value: "30days" },
  { label: "Este mês", value: "thisMonth" },
  { label: "�sltimo mês", value: "lastMonth" },
  { label: "Este ano", value: "thisYear" }
];

const tabOptions = [
  { label: "Faturamento", value: "revenue" },
  { label: "Serviços", value: "services" },
  { label: "Produtos", value: "products" },
  { label: "Clientes", value: "clients" },
  { label: "Agendamentos", value: "appointments" },
];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportMetrics | null>(null);

  const getDateRange = useCallback(() => {
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
        startDate = startOfYear(today);
        break;
      default:
        startDate = subDays(today, 30);
    }

    return { startDate, endDate };
  }, [selectedPeriod]);

  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "Período";
  };

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange();
        const { data, error } = await supabase.functions.invoke("generate-report", {
          body: {
            userId: user.id,
            reportType: activeTab,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
        if (error) throw error;
        setReportData(data as ReportMetrics);
      } catch {
        toast({
          variant: "destructive",
          title: "Erro ao gerar relatório",
          description: "Ocorreu um erro ao buscar os dados."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [user, toast, activeTab, selectedPeriod, getDateRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-gray-600">Carregando dados do relatório...</span>
      </div>
    );
  }

  const activeTabLabel = tabOptions.find(opt => opt.value === activeTab)?.label || "";

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
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
              {periodOptions.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setSelectedPeriod(opt.value)}
                  className="flex items-center justify-between"
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Relatório de {activeTabLabel} -{" "}
            {format(getDateRange().startDate, "dd 'de' MMMM", { locale: ptBR })} até{" "}
            {format(getDateRange().endDate, "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tab selector: dropdown on mobile, tabs on desktop */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="sm:hidden mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {activeTabLabel}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {tabOptions.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => setActiveTab(opt.value)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsList className="hidden sm:flex mb-6">
          {tabOptions.map(opt => (
            <TabsTrigger key={opt.value} value={opt.value}>
              {opt.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="revenue">
          <RevenueReport data={reportData} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesReport data={reportData} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsReport data={reportData} />
        </TabsContent>
        <TabsContent value="clients">
          <ClientsReport data={reportData} />
        </TabsContent>
        <TabsContent value="appointments">
          <AppointmentsReport data={reportData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;


