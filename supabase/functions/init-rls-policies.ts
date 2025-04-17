
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// This function will set up all RLS policies for the database
// It can be called manually after project setup or during development

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create Row Level Security policies for all tables
    const queries = [
      // Clients table policies
      `ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;`,
      `CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;`,
      `CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;`,
      `CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;`,
      `CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);`,
      
      // Pets table policies
      `ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own pets" ON public.pets;`,
      `CREATE POLICY "Users can view their own pets" ON public.pets FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own pets" ON public.pets;`,
      `CREATE POLICY "Users can insert their own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;`,
      `CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own pets" ON public.pets;`,
      `CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);`,
      
      // Products table policies
      `ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own products" ON public.products;`,
      `CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;`,
      `CREATE POLICY "Users can insert their own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own products" ON public.products;`,
      `CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;`,
      `CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING (auth.uid() = user_id);`,
      
      // Services table policies
      `ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own services" ON public.services;`,
      `CREATE POLICY "Users can view their own services" ON public.services FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own services" ON public.services;`,
      `CREATE POLICY "Users can insert their own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own services" ON public.services;`,
      `CREATE POLICY "Users can update their own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;`,
      `CREATE POLICY "Users can delete their own services" ON public.services FOR DELETE USING (auth.uid() = user_id);`,
      
      // Appointments table policies
      `ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;`,
      `CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;`,
      `CREATE POLICY "Users can insert their own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;`,
      `CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;`,
      `CREATE POLICY "Users can delete their own appointments" ON public.appointments FOR DELETE USING (auth.uid() = user_id);`,
      
      // Sales table policies
      `ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;`,
      `CREATE POLICY "Users can view their own sales" ON public.sales FOR SELECT USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can insert their own sales" ON public.sales;`,
      `CREATE POLICY "Users can insert their own sales" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;`,
      `CREATE POLICY "Users can update their own sales" ON public.sales FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;`,
      `CREATE POLICY "Users can delete their own sales" ON public.sales FOR DELETE USING (auth.uid() = user_id);`,
      
      // Sale items table policies
      `ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view their own sale items through sales" ON public.sale_items;`,
      `CREATE POLICY "Users can view their own sale items through sales" ON public.sale_items 
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.sales WHERE id = sale_id AND user_id = auth.uid()
          )
        );`,
      `DROP POLICY IF EXISTS "Users can insert their own sale items through sales" ON public.sale_items;`,
      `CREATE POLICY "Users can insert their own sale items through sales" ON public.sale_items 
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.sales WHERE id = sale_id AND user_id = auth.uid()
          )
        );`,
      `DROP POLICY IF EXISTS "Users can update their own sale items through sales" ON public.sale_items;`,
      `CREATE POLICY "Users can update their own sale items through sales" ON public.sale_items 
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.sales WHERE id = sale_id AND user_id = auth.uid()
          )
        );`,
      `DROP POLICY IF EXISTS "Users can delete their own sale items through sales" ON public.sale_items;`,
      `CREATE POLICY "Users can delete their own sale items through sales" ON public.sale_items 
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.sales WHERE id = sale_id AND user_id = auth.uid()
          )
        );`,
      
      // Profiles table policies
      `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;`,
      `CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);`,
      `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;`,
      `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`,
    ];

    // Execute all queries
    for (const query of queries) {
      const { error } = await supabase.rpc('pgcall', { command: query });
      if (error) {
        console.error(`Error executing RLS policy: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "RLS policies successfully applied" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error setting up RLS policies:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
