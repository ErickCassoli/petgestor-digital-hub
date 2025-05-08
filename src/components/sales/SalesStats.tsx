
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, ShoppingCart } from "lucide-react";

interface SalesStatsProps {
  totalSales: number;
  totalServices: number;
  totalProducts: number;
}

export function SalesStats({ totalSales, totalServices, totalProducts }: SalesStatsProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      <Card className="bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalSales)}
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
              {formatCurrency(totalServices)}
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
              {formatCurrency(totalProducts)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
