
export interface Sale {
  id: string;
  sale_date: string;
  client_id: string | null;
  total: number;
  subtotal: number | null;
  discount_amount: number | null;
  surcharge_amount: number | null;
  type: "mixed" | "product" | "service";
  clients?: {
    id: string;
    name: string;
  } | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  service_id: string | null;
  quantity: number;
  price: number;
  type: "product" | "service";
  products?: {
    name: string;
  } | null;
  services?: {
    name: string;
  } | null;
}
