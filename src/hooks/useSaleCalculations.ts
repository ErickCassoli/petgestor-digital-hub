
import { useState, useCallback } from 'react';
import { CartItem, DiscountValues } from '@/types/sales';

export function useSaleCalculations(items: CartItem[]) {
  const [discount, setDiscount] = useState<DiscountValues>({ 
    amount: 0, 
    percent: 0,
    type: 'amount'
  });
  const [surcharge, setSurcharge] = useState<number>(0);

  // Calculate subtotal of all items
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate discount based on type
  const calculatedDiscount = discount.type === 'amount' 
    ? Math.min(discount.amount, subtotal) // Can't discount more than the subtotal
    : Math.min((subtotal * discount.percent) / 100, subtotal);

  // Calculate final total (never negative)
  const total = Math.max(0, subtotal - calculatedDiscount + surcharge);

  // Handler for changing discount value
  const handleDiscountChange = useCallback((newDiscount: DiscountValues) => {
    setDiscount(newDiscount);
  }, []);

  // Handler for changing surcharge value
  const handleSurchargeChange = useCallback((newSurcharge: number) => {
    setSurcharge(Math.max(0, newSurcharge));
  }, []);

  // Separate subtotals for products and services
  const productSubtotal = items
    .filter(item => item.type === 'product')
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const serviceSubtotal = items
    .filter(item => item.type === 'service')
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    subtotal,
    productSubtotal,
    serviceSubtotal,
    discount,
    calculatedDiscount,
    surcharge,
    total,
    handleDiscountChange,
    handleSurchargeChange
  };
}
