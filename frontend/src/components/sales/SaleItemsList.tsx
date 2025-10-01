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

interface Props {
  items: CartItem[];
  onRemoveItem: (i: number) => void;
  onUpdateQuantity: (i: number, qty: number) => void;
  onUpdateDiscount?: (i: number, value: number) => void;
  onUpdateSurcharge?: (i: number, value: number) => void;
}

export function SaleItemsList({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateSurcharge,
}: Props) {
  const [disc, setDisc] = useState<Record<number, number>>({});
  const [surch, setSurch] = useState<Record<number, number>>({});

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      <Label>Itens da venda</Label>
      <div className="border rounded mt-1">
        <div className="p-3 bg-muted font-medium rounded-t">
          Itens adicionados
        </div>
        {items.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Adicione itens à venda
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {items.map((item, idx) => {
              const weight = item.unitType === 2;
              const step = weight ? 0.01 : 1;
              const delta = weight ? 0.1 : 1;
              const min = weight ? step : 1;
              const totalAdj =
                item.price * item.quantity -
                (disc[idx] ?? item.discount ?? 0) +
                (surch[idx] ?? item.surcharge ?? 0);

              return (
                <div key={idx} className="flex flex-col p-3 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        {item.name}
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">
                          {item.type === "product" ? "Produto" : "Serviço"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {fmt(item.price)} ×{" "}
                        {weight ? item.quantity.toFixed(2) : item.quantity} ={" "}
                        {fmt(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(
                            idx,
                            parseFloat((item.quantity - delta).toFixed(2))
                          )
                        }
                        disabled={item.quantity <= min}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <input
                        type="number"
                        className="input w-16 text-center h-7"
                        step={step} // 1 ou 0.01
                        min={min} // 1 ou 0.01
                        value={item.quantity}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          // só atualiza se for número válido
                          if (!isNaN(v)) onUpdateQuantity(idx, v);
                        }}
                      />

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(
                            idx,
                            parseFloat((item.quantity + delta).toFixed(2))
                          )
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onRemoveItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {onUpdateDiscount && onUpdateSurcharge && (
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      {/* Desconto */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <Percent className="h-3 w-3 mr-1" />
                            {(disc[idx] ?? item.discount ?? 0) > 0
                              ? `Desconto: ${fmt(
                                  disc[idx] ?? item.discount ?? 0
                                )}`
                              : "Adicionar Desconto"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <Label className="text-xs">Valor do desconto</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={disc[idx] ?? item.discount ?? ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setDisc((prev) => ({ ...prev, [idx]: v }));
                              onUpdateDiscount(idx, v);
                            }}
                            className="h-8 mt-1"
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Acréscimo */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            {(surch[idx] ?? item.surcharge ?? 0) > 0
                              ? `Acréscimo: ${fmt(
                                  surch[idx] ?? item.surcharge ?? 0
                                )}`
                              : "Adicionar Acréscimo"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                          <Label className="text-xs">Valor do acréscimo</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={surch[idx] ?? item.surcharge ?? ""}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setSurch((prev) => ({ ...prev, [idx]: v }));
                              onUpdateSurcharge(idx, v);
                            }}
                            className="h-8 mt-1"
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Total ajustado */}
                      {(disc[idx] ?? item.discount ?? 0) > 0 ||
                      (surch[idx] ?? item.surcharge ?? 0) > 0 ? (
                        <div className="flex-1 text-right">
                          <span className="font-medium">{fmt(totalAdj)}</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
