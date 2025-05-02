
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, X } from "lucide-react";
import { type SaleItem } from "@/types/sales";

interface SaleDetailsProps {
  saleId: string | null;
  items: SaleItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function SaleDetails({ saleId, items, isOpen, onClose }: SaleDetailsProps) {
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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalhes da Venda</SheetTitle>
          <SheetDescription>
            Venda #{saleId && saleId.substring(0, 8)} • {getTypeLabel()}
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
                        {item.products?.name || item.services?.name || "Item"}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
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
                <div className="p-3 bg-muted/50 font-medium flex justify-between">
                  <span>Total:</span>
                  <span>
                    {items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
