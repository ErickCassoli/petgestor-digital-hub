
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sale, SaleItem } from "@/types/sales";

interface SaleDetailsProps {
  saleId: string | null;
  items: SaleItem[];
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
}

export function SaleDetails({ saleId, items, isOpen, onClose, sale }: SaleDetailsProps) {
  // Count items by type
  const productCount = items.filter(item => item.type === 'product').length;
  const serviceCount = items.filter(item => item.type === 'service').length;
  
  // Get type labels for the header
  const getTypeLabel = () => {
    if (productCount > 0 && serviceCount > 0) {
      return "Produtos e Serviços";
    } else if (productCount > 0) {
      return "Produtos";
    } else if (serviceCount > 0) {
      return "Serviços";
    }
    return "Itens";
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Calculate totals
  const productsTotal = items
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
  const servicesTotal = items
    .filter(item => item.type === 'service')
    .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
  const subtotal = productsTotal + servicesTotal;

  // Get discount and surcharge values from sale object or calculate from items
  const discountTotal = sale?.discount_amount || 0;
  const surchargeTotal = sale?.surcharge_amount || 0;
  const total = sale?.total || subtotal - discountTotal + surchargeTotal;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes da Venda</SheetTitle>
          <SheetDescription>
            Venda #{saleId && saleId.substring(0, 8)} • {getTypeLabel()}
            {sale?.client_name && ` • Cliente: ${sale.client_name}`}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {items.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted p-2 font-medium">Itens</div>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="p-3">
                      <div className="font-medium flex items-center gap-2">
                        {item.item_name || item.products?.name || item.services?.name || "Item"}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'product' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.type === 'product' ? 'Produto' : 'Serviço'}
                        </span>
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

                {productCount > 0 && serviceCount > 0 && (
                  <>
                    <div className="p-3 bg-muted/30 flex justify-between text-sm">
                      <span>Subtotal Produtos:</span>
                      <span>{formatCurrency(productsTotal)}</span>
                    </div>
                    <div className="p-3 bg-muted/30 flex justify-between text-sm">
                      <span>Subtotal Serviços:</span>
                      <span>{formatCurrency(servicesTotal)}</span>
                    </div>
                  </>
                )}
                
                <div className="p-3 bg-muted/30 flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {discountTotal > 0 && (
                  <div className="p-3 bg-muted/30 flex justify-between text-sm text-red-600">
                    <span>Desconto:</span>
                    <span>-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                
                {surchargeTotal > 0 && (
                  <div className="p-3 bg-muted/30 flex justify-between text-sm text-green-600">
                    <span>Acréscimo:</span>
                    <span>+{formatCurrency(surchargeTotal)}</span>
                  </div>
                )}
                
                <div className="p-3 bg-muted/50 font-medium flex justify-between">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onClose}
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
  );
}
