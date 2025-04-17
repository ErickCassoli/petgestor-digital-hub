
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
import { 
  Plus, 
  FileText, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Check,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subDays, subMonths, subWeeks } from "date-fns";

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

const Sales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch sales data from Supabase
  useEffect(() => {
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
    
    fetchSales();
  }, [user, toast]);

  // Filter sales based on selected period and type
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
    
    // Filter by date and type
    const filtered = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const dateMatch = startDate ? saleDate >= startDate : true;
      const typeMatch = selectedType === "all" || sale.type === selectedType;
      
      return dateMatch && typeMatch;
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
  }, [sales, selectedPeriod, selectedType]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
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
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as vendas de serviços e produtos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-petblue-600 hover:bg-petblue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-petblue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-petblue-600 mr-2" />
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
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Registro de Vendas
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </div>
  );
};

export default Sales;
