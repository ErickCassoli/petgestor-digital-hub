
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SurchargeFormProps {
  surcharge: number;
  onSurchargeChange: (value: number) => void;
  className?: string;
}

export function SurchargeForm({
  surcharge,
  onSurchargeChange,
  className
}: SurchargeFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onSurchargeChange(Math.max(0, value));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label>Acréscimo (R$)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={surcharge || ''}
          onChange={handleChange}
          className="font-mono"
        />
      </div>
    </div>
  );
}
