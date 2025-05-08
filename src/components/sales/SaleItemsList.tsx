
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2 } from "lucide-react";
import { CartItem } from "@/types/sales";

interface SaleItemsListProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

export function SaleItemsList({
  items,
  onRemoveItem,
  onUpdateQuantity,
}: SaleItemsListProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div>
      <Label>Itens da venda</Label>
      <div className="border rounded-md mt-1">
        <div className="p-3 bg-muted rounded-t-md font-medium">Itens adicionados</div>

        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">Adicione itens à venda</div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-t">
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {item.name}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">
                      {item.type === "product" ? "Produto" : "Serviço"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
