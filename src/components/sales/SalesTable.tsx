
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Loader2, ShoppingCart } from "lucide-react";
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
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.sale_date)}</TableCell>
              <TableCell>{sale.clients?.name || "Cliente não informado"}</TableCell>
              <TableCell>
                {sale.type === "service" && "Serviço"}
                {sale.type === "product" && "Produto"}
              </TableCell>
              <TableCell>{Number(sale.subtotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell>{Number(sale.discount_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              <TableCell>{Number(sale.surcharge_amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
