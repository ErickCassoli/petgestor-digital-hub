
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  FileText, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Check,
  Loader2,
  Download,
  FileSpreadsheet,
  Search,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subDays, subMonths, subWeeks } from "date-fns";
import SaleForm from "@/components/SaleForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

interface Sale {
  id: string;
  sale_date: string;
  client_id: string | null;
  type: "service" | "product" | "both";
  total: number;
  payment_method: string | null;
  clients?: {
    id: string;
    name: string;
  } | null;
}

interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  service_id: string | null;
  quantity: number;
  price: number;
  products?: {
    name: string;
  } | null;
  services?: {
    name: string;
  } | null;
}

const periodOptions = [
  { label: "Hoje", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mês", value: "month" },
  { label: "Último mês", value: "lastMonth" }
];

const typeOptions = [
  { label: "Todos", value: "all" },
  { label: "Serviços", value: "service" },
  { label: "Produtos", value: "product" },
  { label: "Mistos", value: "both" }
];

const paymentMethodOptions = [
  { label: "Todos", value: "all" },
  { label: "Dinheiro", value: "cash" },
  { label: "Cartão de Crédito", value: "credit" },
  { label: "Cartão de Débito", value: "debit" },
  { label: "PIX", value: "pix" }
];

const Sales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
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

  // Fetch sales data from Supabase
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

  useEffect(() => {
    fetchSales();
  }, [user, toast]);

  // Fetch sale details
  const fetchSaleDetails = async (saleId: string) => {
    if (!saleId) return;
    
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (name),
          services (name)
        `)
        .eq('sale_id', saleId);
      
      if (error) throw error;
      
      setSaleDetails(data as SaleItem[]);
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

  // Filter sales based on selected period, type, payment method, and search term
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
    
    // Determine the start date based on the selected period
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
    
    // Filter by date, type, payment method, and search term
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const dateMatch = startDate ? saleDate >= startDate : true;
      const typeMatch = selectedType === "all" || sale.type === selectedType;
      const paymentMatch = selectedPaymentMethod === "all" || sale.payment_method === selectedPaymentMethod;
      
      // Search by client name or sale ID
      const searchMatch = !searchTerm.trim() || 
        (sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         sale.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return dateMatch && typeMatch && paymentMatch && searchMatch;
    });
    
    setFilteredSales(filtered);
    
    // Calculate totals
    const total = filtered.reduce((sum, sale) => sum + Number(sale.total), 0);
    const services = filtered
      .filter(sale => sale.type === "service" || sale.type === "both")
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    const products = filtered
      .filter(sale => sale.type === "product" || sale.type === "both")
      .reduce((sum, sale) => sum + Number(sale.total), 0);
    
    setTotalSales(total);
    setTotalServices(services);
    setTotalProducts(products);
  }, [sales, selectedPeriod, selectedType, selectedPaymentMethod, searchTerm]);

  // Handle export to CSV
  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast({ title: "Não há dados para exportar" });
      return;
    }
    
    setExportLoading(true);
    
    try {
      // Create CSV headers
      let csvContent = "Data,Cliente,Tipo,Método de Pagamento,Valor\n";
      
      // Add data rows
      filteredSales.forEach(sale => {
        const date = format(new Date(sale.sale_date), 'dd/MM/yyyy');
        const client = sale.clients?.name || "Cliente não informado";
        const type = sale.type === "service" ? "Serviço" : sale.type === "product" ? "Produto" : "Misto";
        const paymentMethod = sale.payment_method === "cash" ? "Dinheiro" : 
                              sale.payment_method === "credit" ? "Cartão de Crédito" : 
                              sale.payment_method === "debit" ? "Cartão de Débito" : 
                              sale.payment_method === "pix" ? "PIX" : "Não informado";
        const value = Number(sale.total).toFixed(2).replace('.', ',');
        
        csvContent += `${date},"${client}",${type},${paymentMethod},${value}\n`;
      });
      
      // Create downloadable link
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  // Get period label
  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : "Período";
  };

  // Get type label
  const getTypeLabel = () => {
    const option = typeOptions.find(opt => opt.value === selectedType);
    return option ? option.label : "Tipo";
  };

  // Get payment method label
  const getPaymentMethodLabel = () => {
    const option = paymentMethodOptions.find(opt => opt.value === selectedPaymentMethod);
    return option ? option.label : "Forma de Pagamento";
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setLoading(true);
    try {
      // Delete sale items first
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the sale
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

  // JSX for the loading state
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

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {totalSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {totalServices.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShoppingCart className="h-5 w-5 text-amber-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {totalProducts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Registro de Vendas
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto max-w-xs"
              prefix={<Search className="h-4 w-4 mr-2" />}
            />
            
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
                <Button variant="outline" className="flex justify-between">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {getTypeLabel()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {typeOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedType(option.value)}
                    className="flex items-center justify-between"
                  >
                    {option.label}
                    {selectedType === option.value && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex justify-between">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {getPaymentMethodLabel()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {paymentMethodOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setSelectedPaymentMethod(option.value)}
                    className="flex items-center justify-between"
                  >
                    {option.label}
                    {selectedPaymentMethod === option.value && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              className="flex items-center"
              onClick={exportToCSV}
              disabled={exportLoading || filteredSales.length === 0}
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2 text-gray-500 font-medium">Nenhuma venda encontrada</p>
              <p className="text-gray-400">Altere os filtros ou registre uma nova venda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{formatDate(sale.sale_date)}</TableCell>
                      <TableCell>{sale.clients?.name || "Cliente não informado"}</TableCell>
                      <TableCell>
                        {sale.type === "service" && "Serviço"}
                        {sale.type === "product" && "Produto"}
                        {sale.type === "both" && "Misto"}
                      </TableCell>
                      <TableCell>
                        {sale.payment_method === "cash" && "Dinheiro"}
                        {sale.payment_method === "credit" && "Cartão de Crédito"}
                        {sale.payment_method === "debit" && "Cartão de Débito"}
                        {sale.payment_method === "pix" && "PIX"}
                        {!sale.payment_method && "Não informado"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(sale.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedSale(sale.id);
                              fetchSaleDetails(sale.id);
                            }}>
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteSale(sale.id)}
                            >
                              Excluir venda
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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

      {/* New Sale Form Dialog */}
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

      {/* Sale Details Sheet */}
      <Sheet open={showSaleDetails} onOpenChange={setShowSaleDetails}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes da Venda</SheetTitle>
            <SheetDescription>
              Venda #{selectedSale && selectedSale.substring(0, 8)}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            {saleDetails.length > 0 ? (
              <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted p-2 font-medium">Itens</div>
                  <div className="divide-y">
                    {saleDetails.map((item) => (
                      <div key={item.id} className="p-3">
                        <div className="font-medium">
                          {item.products?.name || item.services?.name || "Item"}
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {item.quantity} x {Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span>
                            {(Number(item.price) * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-muted/50 font-medium flex justify-between">
                    <span>Total:</span>
                    <span>
                      {saleDetails.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowSaleDetails(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-2" />
                <p>Carregando detalhes...</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Sales;
