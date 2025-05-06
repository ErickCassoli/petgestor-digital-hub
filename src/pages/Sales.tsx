
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
  const [totalDiscounts, setTotalDiscounts] = useState(0);
  const [totalSurcharges, setTotalSurcharges] = useState(0);
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [saleDetails, setSaleDetails] = useState<SaleItem[]>([]);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

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
      
      // Transform the data to ensure all properties exist and convert type to our union type
      // This handles both new format and legacy data
      const salesData = data.map((sale) => {
        // Ensure the 'type' field is one of our union types
        let saleType: "mixed" | "product" | "service" = "mixed";
        if (sale.type === "product" || sale.type === "service") {
          saleType = sale.type as "product" | "service";
        }
        
        return {
          ...sale,
          total_products: sale.total_products ?? 0,
          discount_products: sale.discount_products ?? 0,
          surcharge_products: sale.surcharge_products ?? 0,
          total_services: sale.total_services ?? 0,
          discount_services: sale.discount_services ?? 0,
          surcharge_services: sale.surcharge_services ?? 0,
          final_total: sale.final_total ?? sale.total ?? 0,
          type: saleType
        } as Sale;
      });
      
      setSales(salesData);
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
      
      // Ensure the 'type' field is one of our union types
      let saleType: "mixed" | "product" | "service" = "mixed";
      if (saleData.type === "product" || saleData.type === "service") {
        saleType = saleData.type as "product" | "service";
      }
      
      // Transform the data to ensure all properties exist
      const typedSaleData = {
        ...saleData,
        total_products: saleData.total_products ?? 0,
        discount_products: saleData.discount_products ?? 0,
        surcharge_products: saleData.surcharge_products ?? 0,
        total_services: saleData.total_services ?? 0,
        discount_services: saleData.discount_services ?? 0,
        surcharge_services: saleData.surcharge_services ?? 0,
        final_total: saleData.final_total ?? saleData.total ?? 0,
        type: saleType
      } as Sale;
      
      setCurrentSale(typedSaleData);
      
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
      
      // Make sure each item has the correct properties and type
      const typedData = data.map((item) => {
        // Ensure the 'type' field is one of our union types
        const itemType = item.type === "product" || (item.product_id && !item.service_id) 
          ? "product" as const 
          : "service" as const;
        
        return {
          ...item,
          type: itemType,
          unit_price: item.unit_price ?? item.price ?? 0,
          total_price: item.total_price ?? (item.unit_price ?? item.price ?? 0) * item.quantity,
          item_name: item.item_name ?? (itemType === "product" ? item.products?.name : item.services?.name) ?? ''
        } as SaleItem;
      });
      
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
  }, [user, toast]);

  useEffect(() => {
    if (!sales.length) {
      setFilteredSales([]);
      setTotalSales(0);
      setTotalServices(0);
      setTotalProducts(0);
      setTotalDiscounts(0);
      setTotalSurcharges(0);
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
         sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (sale.client_name && sale.client_name.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const typeMatch = selectedType === "all" || sale.type === selectedType;
      
      return dateMatch && searchMatch && typeMatch;
    });
    
    setFilteredSales(filtered);
    
    // Calculate totals from the filtered sales
    const productsTotal = filtered.reduce((sum, sale) => 
      sum + (Number(sale.total_products) - Number(sale.discount_products || 0) + Number(sale.surcharge_products || 0)), 0);
    
    const servicesTotal = filtered.reduce((sum, sale) => 
      sum + (Number(sale.total_services) - Number(sale.discount_services || 0) + Number(sale.surcharge_services || 0)), 0);
    
    const discountsTotal = filtered.reduce((sum, sale) => 
      sum + Number(sale.discount_products || 0) + Number(sale.discount_services || 0), 0);
    
    const surchargesTotal = filtered.reduce((sum, sale) => 
      sum + Number(sale.surcharge_products || 0) + Number(sale.surcharge_services || 0), 0);
    
    const finalTotal = filtered.reduce((sum, sale) => sum + Number(sale.final_total), 0);
    
    setTotalProducts(productsTotal);
    setTotalServices(servicesTotal);
    setTotalDiscounts(discountsTotal);
    setTotalSurcharges(surchargesTotal);
    setTotalSales(finalTotal);
    
  }, [sales, selectedPeriod, selectedType, searchTerm]);

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setLoading(true);
    try {
      // Get sale items first to update product stock if needed
      const { data: saleItems, error: itemsQueryError } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', saleId);
      
      if (itemsQueryError) throw itemsQueryError;
      
      // Return products to inventory if needed
      for (const item of saleItems || []) {
        if (item.type === 'product' && item.product_id) {
          // Get current product info
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          
          if (productError) continue; // Skip if error, don't block the whole deletion
          
          // Update stock - add back the quantity
          await supabase
            .from('products')
            .update({ 
              stock: (product?.stock || 0) + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);
        }
      }
      
      // Delete sale items
      const { error: itemsDeleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);
      
      if (itemsDeleteError) throw itemsDeleteError;
      
      // Delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', user.id);
      
      if (saleError) throw saleError;
      
      toast({ 
        title: "Venda excluída com sucesso!",
        variant: "default"
      });
      
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
      toast({ 
        title: "Não há dados para exportar",
        variant: "default"
      });
      return;
    }
    
    setExportLoading(true);
    
    try {
      let csvContent = "Data,Cliente,Tipo,Produtos,Desc. Produtos,Acrés. Produtos,Serviços,Desc. Serviços,Acrés. Serviços,Total Final\n";
      
      filteredSales.forEach(sale => {
        const date = format(new Date(sale.sale_date), 'dd/MM/yyyy');
        const client = sale.clients?.name || sale.client_name || "Não informado";
        const type = sale.type === 'product' ? 'Produtos' : sale.type === 'service' ? 'Serviços' : 'Misto';
        const products = Number(sale.total_products || 0).toFixed(2).replace('.', ',');
        const discountProducts = Number(sale.discount_products || 0).toFixed(2).replace('.', ',');
        const surchargeProducts = Number(sale.surcharge_products || 0).toFixed(2).replace('.', ',');
        const services = Number(sale.total_services || 0).toFixed(2).replace('.', ',');
        const discountServices = Number(sale.discount_services || 0).toFixed(2).replace('.', ',');
        const surchargeServices = Number(sale.surcharge_services || 0).toFixed(2).replace('.', ',');
        const total = Number(sale.final_total).toFixed(2).replace('.', ',');
        
        csvContent += `${date},"${client}",${type},${products},${discountProducts},${surchargeProducts},${services},${discountServices},${surchargeServices},${total}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ 
        title: "Relatório exportado com sucesso!",
        variant: "default"
      });
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
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground mt-1">
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
        totalProducts={totalProducts}
        totalServices={totalServices}
        totalDiscounts={totalDiscounts}
        totalSurcharges={totalSurcharges}
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
            <span className="text-sm text-muted-foreground">
              Total: {filteredSales.length} {filteredSales.length === 1 ? 'registro' : 'registros'}
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
