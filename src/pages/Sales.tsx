
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Loader2, Plus, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type Sale, type SaleItem } from "@/types/sales";
import { SalesStats } from "@/components/sales/SalesStats";
import { SalesFilters } from "@/components/sales/SalesFilters";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleDetails } from "@/components/sales/SaleDetails";
import SaleForm from "@/components/SaleForm";

export default function Sales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleDetails, setSaleDetails] = useState<SaleItem[]>([]);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients (id, name)
        `)
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      
      setSales(data as Sale[]);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar vendas",
        description: "Ocorreu um erro ao buscar as vendas."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: string) => {
    if (!saleId) return;
    
    try {
      // Get the sale object
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          clients (id, name)
        `)
        .eq('id', saleId)
        .single();
        
      if (saleError) throw saleError;
      setCurrentSale(saleData as Sale);
      
      // Get the sale items
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (name),
          services (name)
        `)
        .eq('sale_id', saleId);
      
      if (error) throw error;
      
      // Make sure each item has the correct type property cast to the expected literal type
      const typedData = data.map(item => ({
        ...item,
        // Ensure type is properly cast to the literal type
        type: (item.type === 'product' || item.product_id) && !item.service_id ? 'product' : 'service'
      })) as SaleItem[];
      
      setSaleDetails(typedData);
      setShowSaleDetails(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar detalhes",
        description: "Ocorreu um erro ao buscar os detalhes da venda."
      });
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  useEffect(() => {
    if (!sales.length) {
      setFilteredSales([]);
      setTotalSales(0);
      setTotalServices(0);
      setTotalProducts(0);
      return;
    }
    
    let startDate: Date | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (selectedPeriod) {
      case "today":
        startDate = today;
        break;
      case "week":
        startDate = subDays(today, 7);
        break;
      case "month":
        startDate = startOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(today, 1));
        break;
      default:
        startDate = startOfMonth(today);
    }
    
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const dateMatch = startDate ? saleDate >= startDate : true;
      
      const searchMatch = !searchTerm.trim() || 
        (sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         sale.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const typeMatch = selectedType === "all" || sale.type === selectedType;
      
      return dateMatch && searchMatch && typeMatch;
    });
    
    setFilteredSales(filtered);
    
    // Calculate totals correctly - don't use Math.max as we want to show actual totals
    const total = filtered.reduce((sum, sale) => sum + Number(sale.total), 0);
    setTotalSales(total);
    
    // Calculate service and product totals from sale_items
    const calculateItemTotals = async () => {
      if (!user || !filtered.length) {
        setTotalServices(0);
        setTotalProducts(0);
        return;
      }
      
      try {
        const saleIds = filtered.map(sale => sale.id);
        
        const { data: saleItems, error } = await supabase
          .from('sale_items')
          .select('*')
          .in('sale_id', saleIds);
        
        if (error) throw error;
        
        const services = saleItems
          .filter(item => item.type === 'service' || item.service_id !== null)
          .reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        
        const products = saleItems
          .filter(item => item.type === 'product' || item.product_id !== null)
          .reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
        
        setTotalServices(services);
        setTotalProducts(products);
      } catch (error) {
        console.error('Error calculating totals:', error);
        setTotalServices(0);
        setTotalProducts(0);
      }
    };
    
    calculateItemTotals();
  }, [sales, selectedPeriod, selectedType, searchTerm, user]);

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setLoading(true);
    try {
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);
      
      if (itemsError) throw itemsError;
      
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', user.id);
      
      if (saleError) throw saleError;
      
      toast({ title: "Venda excluída com sucesso!" });
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir venda",
        description: "Ocorreu um erro ao excluir a venda."
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast({ title: "Não há dados para exportar" });
      return;
    }
    
    setExportLoading(true);
    
    try {
      let csvContent = "Data,Cliente,Tipo,Subtotal,Desconto,Acréscimo,Valor Total\n";
      
      filteredSales.forEach(sale => {
        const date = format(new Date(sale.sale_date), 'dd/MM/yyyy');
        const client = sale.clients?.name || "Cliente não informado";
        const type = sale.type === 'product' ? 'Produto' : sale.type === 'service' ? 'Serviço' : 'Misto';
        const subtotal = Number(sale.subtotal || 0).toFixed(2).replace('.', ',');
        const discount = Number(sale.discount_amount || 0).toFixed(2).replace('.', ',');
        const surcharge = Number(sale.surcharge_amount || 0).toFixed(2).replace('.', ',');
        const value = Number(sale.total).toFixed(2).replace('.', ',');
        
        csvContent += `${date},"${client}",${type},${subtotal},${discount},${surcharge},${value}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Relatório exportado com sucesso!" });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Erro ao exportar dados",
        description: "Ocorreu um erro ao exportar os dados."
      });
    } finally {
      setExportLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getPeriodLabel = () => {
    const periodOptions = [
      { label: "Hoje", value: "today" },
      { label: "Esta semana", value: "week" },
      { label: "Este mês", value: "month" },
      { label: "Último mês", value: "lastMonth" }
    ];
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "Período";
  };

  const getTypeLabel = () => {
    const typeOptions = [
      { label: "Todos", value: "all" },
      { label: "Serviços", value: "service" },
      { label: "Produtos", value: "product" },
      { label: "Mistos", value: "mixed" }
    ];
    const option = typeOptions.find(opt => opt.value === selectedType);
    return option ? option.label : "Tipo";
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-gray-600">Carregando...</span>
      </div>
    );
  }

  // Check for payment status in URL on component mount
  useEffect(() => {
    const checkPaymentStatus = () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");
      const saleId = url.searchParams.get("sale_id");
      
      // Clear the URL parameters
      if (success || canceled) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (success === "true" && saleId) {
        toast({
          title: "Pagamento realizado com sucesso!",
          description: "O pagamento da venda foi processado com sucesso.",
        });
        // Refresh sales data
        fetchSales();
      } else if (canceled === "true") {
        toast({
          variant: "destructive",
          title: "Pagamento cancelado",
          description: "O processo de pagamento foi cancelado.",
        });
      }
    };
    
    checkPaymentStatus();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as vendas de serviços e produtos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowNewSaleForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      <SalesStats
        totalSales={totalSales}
        totalServices={totalServices}
        totalProducts={totalProducts}
      />

      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Registro de Vendas
          </CardTitle>
          <SalesFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onExport={exportToCSV}
            exportLoading={exportLoading}
            hasData={filteredSales.length > 0}
            getPeriodLabel={getPeriodLabel}
            getTypeLabel={getTypeLabel}
          />
        </CardHeader>
        <CardContent>
          <SalesTable
            sales={filteredSales}
            onViewDetails={(id) => {
              setSelectedSale(id);
              fetchSaleDetails(id);
            }}
            onDeleteSale={handleDeleteSale}
            formatDate={formatDate}
          />
        </CardContent>
        <CardFooter className="flex justify-between border-t py-4">
          <div>
            <span className="text-sm text-gray-500">
              Total: {filteredSales.length} registros
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Total:</span>
            <span className="font-bold text-lg">
              {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showNewSaleForm} onOpenChange={setShowNewSaleForm}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <SaleForm 
            onComplete={() => {
              setShowNewSaleForm(false);
              fetchSales();
            }}
            onCancel={() => setShowNewSaleForm(false)}
          />
        </DialogContent>
      </Dialog>

      <SaleDetails
        saleId={selectedSale}
        items={saleDetails}
        isOpen={showSaleDetails}
        onClose={() => setShowSaleDetails(false)}
        sale={currentSale}
      />
    </div>
  );
}
