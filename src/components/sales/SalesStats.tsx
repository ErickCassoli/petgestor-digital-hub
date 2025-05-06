
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, ShoppingCart, Minus, Plus } from "lucide-react";

interface SalesStatsProps {
  totalSales: number;
  totalProducts: number;
  totalServices: number;
  totalDiscounts: number;
  totalSurcharges: number;
}

export function SalesStats({ 
  totalSales, 
  totalProducts, 
  totalServices,
  totalDiscounts,
  totalSurcharges
}: SalesStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 mb-8">
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

      <Card className="bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Descontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Minus className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-2xl font-bold text-gray-900">
              {totalDiscounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Acréscimos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Plus className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">
              {totalSurcharges.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
