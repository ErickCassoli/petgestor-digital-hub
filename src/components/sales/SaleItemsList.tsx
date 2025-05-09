
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Percent, DollarSign } from "lucide-react";
import { CartItem } from "@/types/sales";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SaleItemsListProps {
  items: CartItem[];
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateDiscount?: (index: number, discount: number) => void;
  onUpdateSurcharge?: (index: number, surcharge: number) => void;
}

export function SaleItemsList({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateSurcharge,
}: SaleItemsListProps) {
  const [itemDiscounts, setItemDiscounts] = useState<Record<number, number>>({});
  const [itemSurcharges, setItemSurcharges] = useState<Record<number, number>>({});

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDiscountChange = (index: number, value: string) => {
    const discount = parseFloat(value) || 0;
    setItemDiscounts({...itemDiscounts, [index]: discount});
    if (onUpdateDiscount) {
      onUpdateDiscount(index, discount);
    }
  };

  const handleSurchargeChange = (index: number, value: string) => {
    const surcharge = parseFloat(value) || 0;
    setItemSurcharges({...itemSurcharges, [index]: surcharge});
    if (onUpdateSurcharge) {
      onUpdateSurcharge(index, surcharge);
    }
  };

  const calculateItemTotal = (item: CartItem, index: number) => {
    const baseTotal = item.price * item.quantity;
    const discount = itemDiscounts[index] || item.discount || 0;
    const surcharge = itemSurcharges[index] || item.surcharge || 0;
    return baseTotal - discount + surcharge;
  };

  return (
    <div>
      <Label>Itens da venda</Label>
      <div className="border rounded-md mt-1">
        <div className="p-3 bg-muted rounded-t-md font-medium">Itens adicionados</div>

        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">Adicione itens à venda</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col p-3 border-t">
                <div className="flex items-center justify-between">
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
                
                {onUpdateDiscount && onUpdateSurcharge && (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Percent className="h-3 w-3 mr-1" />
                          {(itemDiscounts[index] || item.discount || 0) > 0 
                            ? `Desconto: ${formatCurrency(itemDiscounts[index] || item.discount || 0)}` 
                            : "Adicionar Desconto"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2">
                        <Label className="text-xs">Valor do desconto</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={itemDiscounts[index] || item.discount || ''}
                          onChange={(e) => handleDiscountChange(index, e.target.value)}
                          className="h-8 mt-1"
                          placeholder="0.00"
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {(itemSurcharges[index] || item.surcharge || 0) > 0 
                            ? `Acréscimo: ${formatCurrency(itemSurcharges[index] || item.surcharge || 0)}` 
                            : "Adicionar Acréscimo"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2">
                        <Label className="text-xs">Valor do acréscimo</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={itemSurcharges[index] || item.surcharge || ''}
                          onChange={(e) => handleSurchargeChange(index, e.target.value)}
                          className="h-8 mt-1"
                          placeholder="0.00"
                        />
                      </PopoverContent>
                    </Popover>

                    {((itemDiscounts[index] || item.discount || 0) > 0 || 
                      (itemSurcharges[index] || item.surcharge || 0) > 0) && (
                      <div className="flex-1 text-right">
                        <span className="font-medium">
                          Total: {formatCurrency(calculateItemTotal(item, index))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
