
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ShoppingCart } from "lucide-react";
import { Sale } from "@/types/sales";

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
        return { label: 'Produto', color: 'bg-blue-100 text-blue-800' };
      case 'service':
        return { label: 'Serviço', color: 'bg-green-100 text-green-800' };
      case 'mixed':
        return { label: 'Misto', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Desconto</TableHead>
            <TableHead>Acréscimo</TableHead>
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
                <TableCell>{sale.client_name || sale.clients?.name || "Cliente não informado"}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </TableCell>
                <TableCell>{Number(sale.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell>{Number(sale.discount_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell>{Number(sale.surcharge_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
