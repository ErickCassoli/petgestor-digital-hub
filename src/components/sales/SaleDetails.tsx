
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, X, ShoppingBag, Scissors, Receipt, FileText } from "lucide-react";
import { type Sale, type SaleItem } from "@/types/sales";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface SaleDetailsProps {
  saleId: string | null;
  items: SaleItem[];
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
}

export function SaleDetails({ saleId, items, isOpen, onClose, sale }: SaleDetailsProps) {
  // Count items by type
  const productItems = items.filter(item => item.type === 'product');
  const serviceItems = items.filter(item => item.type === 'service');
  
  // Calculate totals
  const productSubtotal = sale?.total_products || 0;
  const serviceSubtotal = sale?.total_services || 0;
  const productDiscount = sale?.discount_products || 0;
  const serviceSurcharge = sale?.surcharge_services || 0;
  const productSurcharge = sale?.surcharge_products || 0;
  const serviceDiscount = sale?.discount_services || 0;
  const finalTotal = sale?.final_total || 0;

  // Format date
  const formatSaleDate = (dateString?: string | null) => {
    if (!dateString) return "Data não registrada";
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md md:max-w-lg w-full p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between w-full">
            <div>
              <SheetTitle className="text-xl flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Detalhes da Venda
              </SheetTitle>
              <SheetDescription className="mt-1">
                {saleId && `Venda #${saleId.substring(0, 8).toUpperCase()}`}
                {sale?.sale_date && ` • ${formatSaleDate(sale.sale_date)}`}
              </SheetDescription>
            </div>
            {sale && (
              <Badge className={
                sale.type === 'product' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                sale.type === 'service' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                'bg-purple-100 text-purple-800 hover:bg-purple-200'
              }>
                {sale.type === 'product' ? 'Produtos' : 
                 sale.type === 'service' ? 'Serviços' : 
                 'Misto'}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-8rem)] pb-6">
          {items.length > 0 && sale ? (
            <div className="px-6 py-4 space-y-6">
              {sale.clients && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-medium">Cliente</div>
                  <div className="p-4">
                    <p className="font-medium">{sale.clients.name}</p>
                  </div>
                </div>
              )}
              
              {productItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium">Produtos</h3>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Valor Un.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name || item.products?.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {serviceItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium">Serviços</h3>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serviço</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Valor Un.</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.item_name || item.services?.name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {sale.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium">Observações</h3>
                  </div>
                  <div className="border rounded-md p-3 text-sm">
                    {sale.notes}
                  </div>
                </div>
              )}
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium">Resumo</div>
                <div className="p-4 space-y-2">
                  {productSubtotal > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Produtos:</span>
                        <span>{formatCurrency(productSubtotal)}</span>
                      </div>
                      
                      {productDiscount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Desconto Produtos:</span>
                          <span>-{formatCurrency(productDiscount)}</span>
                        </div>
                      )}
                      
                      {productSurcharge > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Acréscimo Produtos:</span>
                          <span>+{formatCurrency(productSurcharge)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Produtos:</span>
                        <span>{formatCurrency(productSubtotal - productDiscount + productSurcharge)}</span>
                      </div>
                    </>
                  )}
                  
                  {serviceSubtotal > 0 && (
                    <>
                      {productSubtotal > 0 && <div className="border-t my-2"></div>}
                      
                      <div className="flex justify-between text-sm">
                        <span>Subtotal Serviços:</span>
                        <span>{formatCurrency(serviceSubtotal)}</span>
                      </div>
                      
                      {serviceDiscount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Desconto Serviços:</span>
                          <span>-{formatCurrency(serviceDiscount)}</span>
                        </div>
                      )}
                      
                      {serviceSurcharge > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Acréscimo Serviços:</span>
                          <span>+{formatCurrency(serviceSurcharge)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Serviços:</span>
                        <span>{formatCurrency(serviceSubtotal - serviceDiscount + serviceSurcharge)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Final:</span>
                      <span className="text-lg">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mx-auto animate-spin mb-4" />
                <p>Carregando detalhes...</p>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-4 sticky bottom-0 bg-background">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
