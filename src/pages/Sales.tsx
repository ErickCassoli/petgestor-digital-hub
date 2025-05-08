
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar, Loader2, Plus } from "lucide-react";
import { format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SalesStats } from "@/components/sales/SalesStats";
import { SalesFilters } from "@/components/sales/SalesFilters";
import { SalesTable } from "@/components/sales/SalesTable";
import { SaleDetails } from "@/components/sales/SaleDetails";
import SaleForm from "@/components/SaleForm";
import { useSales } from "@/hooks/useSales";
import { Sale, SaleItem } from "@/types/sales";

export default function Sales() {
  const { sales, loading, fetchSales, fetchSaleDetails, deleteSale } = useSales();
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewSaleForm, setShowNewSaleForm] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [saleDetails, setSaleDetails] = useState<SaleItem[]>([]);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

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
        (sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         sale.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const typeMatch = selectedType === "all" || sale.type === selectedType;
      
      return dateMatch && searchMatch && typeMatch;
    });
    
    setFilteredSales(filtered);
    
    // Calculate totals from filtered sales
    let totalAmount = 0;
    let productsAmount = 0;
    let servicesAmount = 0;
    
    filtered.forEach(sale => {
      totalAmount += Number(sale.total);
      productsAmount += Number(sale.total_products) || 0;
      servicesAmount += Number(sale.total_services) || 0;
    });
    
    setTotalSales(totalAmount);
    setTotalProducts(productsAmount);
    setTotalServices(servicesAmount);
  }, [sales, selectedPeriod, selectedType, searchTerm]);

  const handleViewSaleDetails = async (saleId: string) => {
    setSelectedSaleId(saleId);
    const result = await fetchSaleDetails(saleId);
    
    if (result) {
      setSaleDetails(result.items);
      setCurrentSale(result.sale);
      setShowSaleDetails(true);
    }
  };

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      return;
    }
    
    setExportLoading(true);
    
    try {
      let csvContent = "Data,Cliente,Tipo,Subtotal,Desconto,Acréscimo,Valor Total,Produtos,Serviços\n";
      
      filteredSales.forEach(sale => {
        const date = format(new Date(sale.sale_date), 'dd/MM/yyyy');
        const client = sale.client_name || sale.clients?.name || "Cliente não informado";
        const type = sale.type === 'product' ? 'Produto' : sale.type === 'service' ? 'Serviço' : 'Misto';
        const subtotal = Number(sale.subtotal).toFixed(2).replace('.', ',');
        const discount = Number(sale.discount_amount).toFixed(2).replace('.', ',');
        const surcharge = Number(sale.surcharge_amount).toFixed(2).replace('.', ',');
        const value = Number(sale.total).toFixed(2).replace('.', ',');
        const products = Number(sale.total_products || 0).toFixed(2).replace('.', ',');
        const services = Number(sale.total_services || 0).toFixed(2).replace('.', ',');
        
        csvContent += `${date},"${client}",${type},${subtotal},${discount},${surcharge},${value},${products},${services}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
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
            onViewDetails={handleViewSaleDetails}
            onDeleteSale={deleteSale}
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
        saleId={selectedSaleId}
        items={saleDetails}
        isOpen={showSaleDetails}
        onClose={() => setShowSaleDetails(false)}
        sale={currentSale}
      />
    </div>
  );
}
