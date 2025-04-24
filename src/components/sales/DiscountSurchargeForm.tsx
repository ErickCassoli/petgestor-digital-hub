
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    if (value >= 0 && value <= subtotal) {
      onDiscountChange(value);
    }
  };

  const handleSurchargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) || 0;
    if (value >= 0) {
      onSurchargeChange(value);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Desconto (R$)</Label>
          <Input
            type="number"
            min={0}
            max={subtotal}
            step="0.01"
            value={discountAmount}
            onChange={handleDiscountChange}
            className="font-mono"
          />
        </div>
        <div>
          <Label>Acréscimo (R$)</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={surchargeAmount}
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
          <span className="font-mono">-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Acréscimo:</span>
          <span className="font-mono">+{formatCurrency(surchargeAmount)}</span>
        </div>
        <div className="flex justify-between font-medium border-t pt-2 mt-2">
          <span>Total:</span>
          <span className="font-mono">{formatCurrency(subtotal - discountAmount + surchargeAmount)}</span>
        </div>
      </div>
    </div>
  );
}
