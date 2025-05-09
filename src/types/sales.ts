
export interface Sale {
  id: string;
  user_id: string;
  client_id?: string | null;
  client_name?: string | null;
  sale_date: string;
  subtotal: number;
  discount: number;
  surcharge: number;
  total: number;
  type: "product" | "service" | "mixed";
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  client?: {
    id: string;
    name: string;
  } | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  type: "product" | "service";
  product_id?: string | null;
  service_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  surcharge?: number;
  created_at?: string;
  updated_at?: string;
  product?: {
    name: string;
  } | null;
  service?: {
    name: string;
  } | null;
}

export interface CartItem {
  id: string;
  type: "product" | "service";
  name: string;
  price: number;
  quantity: number;
  discount?: number;
  surcharge?: number;
  total?: number;
}

export interface DiscountValues {
  amount: number;
  percent: number;
  type: "amount" | "percent";
}

export interface SaleFormData {
  clientId: string | null;
  items: CartItem[];
  discount: DiscountValues;
  surcharge: number;
  paymentMethod: string;
  notes: string;
}
