
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DiscountSurchargeFormProps {
  subtotal: number;
  discountAmount: number;
  surchargeAmount: number;
  onDiscountChange: (value: number) => void;
  onSurchargeChange: (value: number) => void;
  className?: string;
}

export default function DiscountSurchargeForm({
  subtotal,
  discountAmount,
  surchargeAmount,
  onDiscountChange,
  onSurchargeChange,
  className
}: DiscountSurchargeFormProps) {
  const [discountValue, setDiscountValue] = useState<string>(discountAmount.toString());
  const [surchargeValue, setSurchargeValue] = useState<string>(surchargeAmount.toString());
  
  // Update local state when props change
  useEffect(() => {
    setDiscountValue(discountAmount.toString());
  }, [discountAmount]);
  
  useEffect(() => {
    setSurchargeValue(surchargeAmount.toString());
  }, [surchargeAmount]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDiscountValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onDiscountChange(numValue);
    }
  };

  const handleSurchargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSurchargeValue(inputValue);
    
    // Convert to number and update parent component if valid
    const numValue = inputValue === '' ? 0 : parseFloat(inputValue);
    if (!isNaN(numValue) && numValue >= 0) {
      onSurchargeChange(numValue);
    }
  };

  // Calculate total with current inputs
  const total = subtotal - (parseFloat(discountValue) || 0) + (parseFloat(surchargeValue) || 0);
  
  // Check if discount is valid
  const isDiscountValid = (parseFloat(discountValue) || 0) <= subtotal;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="flex justify-between">
            <span>Desconto (R$)</span>
            {!isDiscountValid && <span className="text-red-500 text-xs">Maior que o subtotal</span>}
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={discountValue}
            onChange={handleDiscountChange}
            className={cn("font-mono", !isDiscountValid && "border-red-500")}
          />
        </div>
        <div>
          <Label>Acréscimo (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={surchargeValue}
            onChange={handleSurchargeChange}
            className="font-mono"
          />
        </div>
      </div>
      <div className="border rounded-md p-4 space-y-2 bg-muted/50">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-mono">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-red-600">
          <span>Desconto:</span>
          <span className="font-mono">-{formatCurrency(parseFloat(discountValue) || 0)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Acréscimo:</span>
          <span className="font-mono">+{formatCurrency(parseFloat(surchargeValue) || 0)}</span>
        </div>
        <div className="flex justify-between font-medium border-t pt-2 mt-2">
          <span>Total:</span>
          <span className="font-mono">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
