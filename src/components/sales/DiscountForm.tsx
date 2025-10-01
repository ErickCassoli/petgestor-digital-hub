
import { useEffect } from 'react';
import { DiscountValues } from '@/types/sales';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface DiscountFormProps {
  subtotal: number;
  discount: DiscountValues;
  onDiscountChange: (values: DiscountValues) => void;
  className?: string;
}

export function DiscountForm({
  subtotal,
  discount,
  onDiscountChange,
  className
}: DiscountFormProps) {
  // Check if discount amount is valid
  const isAmountValid = discount.amount <= subtotal;
  const isPercentValid = discount.percent <= 100;

  // Update discount when changed
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    onDiscountChange({ ...discount, amount, type: 'amount' });
  };

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value) || 0;
    onDiscountChange({ ...discount, percent, type: 'percent' });
  };

  const handleTabChange = (value: string) => {
    onDiscountChange({ ...discount, type: value as 'amount' | 'percent' });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={discount.type} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="amount">Valor (R$)</TabsTrigger>
          <TabsTrigger value="percent">Percentual (%)</TabsTrigger>
        </TabsList>

        <TabsContent value="amount">
          <div>
            <Label className="flex justify-between">
              <span>Desconto (R$)</span>
              {!isAmountValid && (
                <span className="text-red-500 text-xs">Maior que o subtotal</span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discount.amount || ''}
              onChange={handleAmountChange}
              className={cn(
                "font-mono",
                !isAmountValid && "border-red-500"
              )}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="percent">
          <div>
            <Label className="flex justify-between">
              <span>Desconto (%)</span>
              {!isPercentValid && (
                <span className="text-red-500 text-xs">Máximo 100%</span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={discount.percent || ''}
              onChange={handlePercentChange}
              className={cn(
                "font-mono",
                !isPercentValid && "border-red-500"
              )}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
