
import { CartItem } from '@/types/sales';

interface SaleSummaryProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  surcharge: number;
  total: number;
  productSubtotal?: number;
  serviceSubtotal?: number;
}

export function SaleSummary({
  items,
  subtotal,
  discount,
  surcharge,
  total,
  productSubtotal,
  serviceSubtotal
}: SaleSummaryProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const hasProducts = items.some(item => item.type === 'product');
  const hasServices = items.some(item => item.type === 'service');
  const showSeparateSubtotals = hasProducts && hasServices;

  return (
    <div className="border rounded-md p-4 space-y-2 bg-muted/50">
      {showSeparateSubtotals && (
        <>
          {productSubtotal !== undefined && (
            <div className="flex justify-between text-sm">
              <span>Subtotal Produtos:</span>
              <span className="font-mono">{formatCurrency(productSubtotal)}</span>
            </div>
          )}
          
          {serviceSubtotal !== undefined && (
            <div className="flex justify-between text-sm">
              <span>Subtotal Serviços:</span>
              <span className="font-mono">{formatCurrency(serviceSubtotal)}</span>
            </div>
          )}
        </>
      )}
      
      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span className="font-mono">{formatCurrency(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between text-sm text-red-600">
          <span>Desconto:</span>
          <span className="font-mono">-{formatCurrency(discount)}</span>
        </div>
      )}
      
      {surcharge > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Acréscimo:</span>
          <span className="font-mono">+{formatCurrency(surcharge)}</span>
        </div>
      )}
      
      <div className="flex justify-between font-medium border-t pt-2 mt-2">
        <span>Total:</span>
        <span className="font-mono">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
