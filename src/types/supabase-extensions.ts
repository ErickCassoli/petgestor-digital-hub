import type { Database } from "@/integrations/supabase/types";

export interface InvoiceRow {
  id: string;
  appointment_id: string;
  user_id: string;
  pet_id: string;
  discount_amount: number;
  surcharge_amount: number;
  final_amount: number;
  created_at: string;
}

export interface InvoiceInsert {
  id?: string;
  appointment_id: string;
  user_id: string;
  pet_id: string;
  discount_amount?: number;
  surcharge_amount?: number;
  final_amount: number;
  created_at?: string;
}

export interface InvoiceUpdate {
  id?: string;
  appointment_id?: string;
  user_id?: string;
  pet_id?: string;
  discount_amount?: number;
  surcharge_amount?: number;
  final_amount?: number;
  created_at?: string;
}

export interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface InvoiceItemInsert {
  id?: string;
  invoice_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface InvoiceItemUpdate {
  id?: string;
  invoice_id?: string;
  service_id?: string;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
}

type ExtendedTables = Database["public"]["Tables"] & {
  invoices: {
    Row: InvoiceRow;
    Insert: InvoiceInsert;
    Update: InvoiceUpdate;
    Relationships: [];
  };
  invoice_items: {
    Row: InvoiceItemRow;
    Insert: InvoiceItemInsert;
    Update: InvoiceItemUpdate;
    Relationships: [];
  };
};

export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: ExtendedTables;
  };
};
