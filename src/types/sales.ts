
export interface Sale {
  id: string;
  sale_date: string;
  client_id: string | null;
  type: "service" | "product";
  total: number;
  subtotal: number | null;
  discount_amount: number | null;
  surcharge_amount: number | null;
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
  products?: {
    name: string;
  } | null;
  services?: {
    name: string;
  } | null;
}
