
import { useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { Sale } from "@/types/sales";

type SalesStats = {
  totalSales: number;
  totalProducts: number;
  totalServices: number;
};

export function useCalculateSaleStats() {
  // Calculate sales statistics from a list of sales
  const calculateSalesStats = useCallback((sales: Sale[]): SalesStats => {
    const stats: SalesStats = {
      totalSales: 0,
      totalProducts: 0,
      totalServices: 0
    };
    
    // Process each sale
    sales.forEach(sale => {
      // Add to total sales amount
      stats.totalSales += Number(sale.total) || 0;
      
      // Determine how to distribute the amount based on sale type
      switch (sale.type) {
        case 'product':
          // For product-only sales, add the entire amount to products
          stats.totalProducts += Number(sale.total) || 0;
          break;
        case 'service':
          // For service-only sales, add the entire amount to services
          stats.totalServices += Number(sale.total) || 0;
          break;
        case 'mixed':
          // For mixed sales, we need to fetch the sale items to correctly split the amount
          // This will be handled separately with the fetchSaleItems function
          break;
      }
    });
    
    return stats;
  }, []);
  
  // Process mixed sale items to correctly distribute amounts
  const processMixedSaleItems = useCallback(async (stats: SalesStats, mixedSales: Sale[], supabaseClient: SupabaseClient<Database>) => {
    // For each mixed sale, we need to fetch its items
    for (const sale of mixedSales) {
      // Only process if it's a mixed sale
      if (sale.type !== 'mixed') continue;
      
      // Fetch items for this sale
      const { data: items } = await supabaseClient
        .from('sale_items')
        .select('type, total')
        .eq('sale_id', sale.id);
        
      if (items && items.length > 0) {
        // Process each item based on its type
        items.forEach(item => {
          const itemTotal = Number(item.total) || 0;
          
          if (item.type === 'product') {
            stats.totalProducts += itemTotal;
          } else if (item.type === 'service') {
            stats.totalServices += itemTotal;
          }
        });
      }
    }
    
    return stats;
  }, []);
  
  return { calculateSalesStats, processMixedSaleItems };
}





