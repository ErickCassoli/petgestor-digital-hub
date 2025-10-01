
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create function to update product stock
    const updateProductStockFn = `
    CREATE OR REPLACE FUNCTION public.update_product_stock(p_product_id UUID, p_quantity INTEGER)
    RETURNS VOID AS $$
    DECLARE
        current_stock INTEGER;
    BEGIN
        -- Get current stock
        SELECT stock INTO current_stock FROM products WHERE id = p_product_id;
        
        -- Update stock (ensure it never goes below 0)
        UPDATE products 
        SET stock = GREATEST(0, current_stock + p_quantity) 
        WHERE id = p_product_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await supabase.rpc('pgcall', { command: updateProductStockFn });
    
    return new Response(
      JSON.stringify({ success: true, message: "Database functions created successfully" }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error creating database functions:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
