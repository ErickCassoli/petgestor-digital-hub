
export interface Sale {
  id: string;
  sale_date: string;
  client_id: string | null;
  client_name?: string | null;
  total_products: number;
  discount_products: number;
  surcharge_products: number;
  total_services: number;
  discount_services: number;
  surcharge_services: number;
  final_total: number;
  notes?: string | null;
  type: "mixed" | "product" | "service";
  clients?: {
    id: string;
    name: string;
  } | null;
  
  // Legacy fields (kept for backward compatibility)
  appointment_id?: string | null;
  payment_method?: string | null;
  discount_amount?: number | null;
  surcharge_amount?: number | null;
  subtotal?: number | null;
  total?: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  service_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  type: "product" | "service";
  item_name: string;
  products?: {
    name: string;
  } | null;
  services?: {
    name: string;
  } | null;
  
  // Legacy fields (kept for backward compatibility)
  price?: number;
}

export interface SaleFormData {
  client_id: string | null;
  items: Array<{
    id?: string;
    type: 'product' | 'service';
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  discount_products: number;
  surcharge_products: number;
  discount_services: number;
  surcharge_services: number;
  notes?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalProducts: number;
  totalServices: number;
  totalDiscounts: number;
  totalSurcharges: number;
  count: number;
}
