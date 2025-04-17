
import { useState } from "react";
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
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

// Mock data for sales
const MOCK_SALES = [
  { 
    id: "1", 
    date: "2023-04-14",
    client: "João Silva",
    type: "service", 
    description: "Banho e Tosa - Max",
    value: 80.00
  },
  { 
    id: "2", 
    date: "2023-04-14",
    client: "Maria Oliveira",
    type: "product", 
    description: "Ração Premium Cães Adultos",
    value: 89.90
  },
  { 
    id: "3", 
    date: "2023-04-13",
    client: "Pedro Santos",
    type: "service", 
    description: "Consulta Veterinária - Luna",
    value: 120.00
  },
  { 
    id: "4", 
    date: "2023-04-13",
    client: "Ana Costa",
    type: "product", 
    description: "Antipulgas Comprimido",
    value: 45.90
  },
  { 
    id: "5", 
    date: "2023-04-12",
    client: "Carlos Mendes",
    type: "service", 
    description: "Banho - Mel",
    value: 50.00
  },
  { 
    id: "6", 
    date: "2023-04-12",
    client: "Paula Ferreira",
    type: "product", 
    description: "Coleira Ajustável G",
    value: 35.90
  },
  { 
    id: "7", 
    date: "2023-04-11",
    client: "Lucas Almeida",
    type: "both", 
    description: "Banho + Ração Gatos",
    value: 130.00
  },
  { 
    id: "8", 
    date: "2023-04-10",
    client: "Fernanda Lima",
    type: "service", 
    description: "Tosa - Rex",
    value: 60.00
  }
];

interface Sale {
  id: string;
  date: string;
  client: string;
  type: "service" | "product" | "both";
  description: string;
  value: number;
}

const periodOptions = [
  { label: "Hoje", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mês", value: "month" },
  { label: "Personalizado", value: "custom" }
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
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedType, setSelectedType] = useState("all");

  // Filter sales based on selected period and type
  const filteredSales = sales.filter((sale) => {
    const typeMatch = selectedType === "all" || sale.type === selectedType;
    // In a full implementation, we would filter by actual date ranges
    return typeMatch;
  });

  // Calculate totals
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.value, 0);
  const totalServices = filteredSales
    .filter((sale) => sale.type === "service" || sale.type === "both")
    .reduce((sum, sale) => sum + sale.value, 0);
  const totalProducts = filteredSales
    .filter((sale) => sale.type === "product" || sale.type === "both")
    .reduce((sum, sale) => sum + sale.value, 0);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.date)}</TableCell>
                    <TableCell>{sale.client}</TableCell>
                    <TableCell>{sale.description}</TableCell>
                    <TableCell>
                      {sale.type === "service" && "Serviço"}
                      {sale.type === "product" && "Produto"}
                      {sale.type === "both" && "Misto"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {sale.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
