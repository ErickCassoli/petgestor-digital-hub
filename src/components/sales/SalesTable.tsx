
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, FileText, Loader2, ShoppingBag, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Sale } from "@/types/sales";

interface SalesTableProps {
  sales: Sale[];
  onViewDetails: (saleId: string) => void;
  onDeleteSale: (saleId: string) => void;
  formatDate: (date: string) => string;
}

export function SalesTable({ sales, onViewDetails, onDeleteSale, formatDate }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 mx-auto text-gray-300" />
        <p className="mt-2 text-gray-500 font-medium">Nenhuma venda encontrada</p>
        <p className="text-gray-400">Altere os filtros ou registre uma nova venda</p>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return { label: 'Produtos', color: 'bg-blue-100 text-blue-800' };
      case 'service':
        return { label: 'Serviços', color: 'bg-green-100 text-green-800' };
      case 'mixed':
        return { label: 'Misto', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Produtos</TableHead>
            <TableHead className="text-right">Serviços</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const typeInfo = getTypeLabel(sale.type);
            
            return (
              <TableRow key={sale.id}>
                <TableCell>{formatDate(sale.sale_date)}</TableCell>
                <TableCell>{sale.clients?.name || sale.client_name || "Cliente não informado"}</TableCell>
                <TableCell>
                  <Badge className={`${typeInfo.color}`}>
                    {typeInfo.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {sale.total_products > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatCurrency(sale.total_products - (sale.discount_products || 0) + (sale.surcharge_products || 0))}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {sale.total_services > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatCurrency(sale.total_services - (sale.discount_services || 0) + (sale.surcharge_services || 0))}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(sale.final_total)}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(sale.id)}>
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDeleteSale(sale.id)}
                      >
                        Excluir venda
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
