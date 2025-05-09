
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Download, 
  ChevronDown,
  Check,
  Loader2,
  FileSpreadsheet,
  File,
  Users
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
  { label: "Últimos 7 dias", value: "7days" },
  { label: "Últimos 30 dias", value: "30days" },
  { label: "Este mês", value: "thisMonth" },
  { label: "Último mês", value: "lastMonth" },
  { label: "Este ano", value: "thisYear" }
];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [activeTab, setActiveTab] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportMetrics | null>(null);

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
        startDate = startOfYear(today);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    return { startDate, endDate };
  };

  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "Período";
  };

  const formatDateRange = () => {
    const { startDate, endDate } = getDateRange();
    return `${format(startDate, "dd 'de' MMMM", { locale: ptBR })} até ${format(endDate, "dd 'de' MMMM", { locale: ptBR })}`;
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
        
        if (error) {
          console.error('Error invoking function:', error);
          throw error;
        }
        
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

  const handleExport = async (format: string) => {
    try {
      setExportLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: {
          userId: user?.id,
          reportType: activeTab,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          exportFormat: format,
        },
      });
      
      if (error) throw error;
      
      if (["csv", "pdf", "excel", "xlsx"].includes(format) && data && data.exportedFile) {
        const byteCharacters = atob(data.exportedFile);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        let blob;
        if (format === "pdf") {
          blob = new Blob([byteArray], { type: "application/pdf" });
        } else if (format === "excel" || format === "xlsx") {
          blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
        } else {
          blob = new Blob([byteArray], { type: "text/csv;charset=utf-8;" });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          data.fileName || `relatorio_${activeTab}.${format}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Relatório exportado com sucesso!",
          description: `O arquivo foi baixado no formato ${format.toUpperCase()}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao exportar",
          description: "Não foi possível gerar o arquivo de exportação.",
        });
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        variant: "destructive",
        title: "Erro ao exportar relatório",
        description: "Ocorreu um erro ao exportar o relatório.",
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-gray-600">Carregando dados do relatório...</span>
      </div>
    );
  }

  return (
    <div>
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
              <Button className="bg-primary hover:bg-primary/90" disabled={exportLoading}>
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar como CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar como Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                <File className="h-4 w-4 mr-2" />
                Exportar como PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="py-3">
          <CardTitle className="text-base font-medium">
            Relatório de {activeTab === 'revenue' ? 'Faturamento' : 
                        activeTab === 'services' ? 'Serviços' : 
                        activeTab === 'products' ? 'Produtos' : 
                        activeTab === 'clients' ? 'Clientes' : 
                        'Agendamentos'} - {formatDateRange()}
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
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
