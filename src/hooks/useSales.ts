
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sale, SaleItem } from "@/types/sales";
import { useToast } from "@/components/ui/use-toast";

export function useSales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients (id, name)
        `)
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedData = data.map(sale => ({
        ...sale,
        type: sale.type as "product" | "service" | "mixed"
      })) as Sale[];
      
      setSales(typedData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar vendas",
        description: "Ocorreu um erro ao buscar as vendas."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: string) => {
    if (!saleId) return null;
    
    try {
      // Get the sale object
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          clients (id, name)
        `)
        .eq('id', saleId)
        .single();
        
      if (saleError) throw saleError;
      
      // Type assertion
      const sale = {
        ...saleData,
        type: saleData.type as "product" | "service" | "mixed"
      } as Sale;
      
      // Get the sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (name),
          services (name)
        `)
        .eq('sale_id', saleId);
      
      if (itemsError) throw itemsError;
      
      // Type assertion to ensure correct typing
      const items = itemsData.map(item => ({
        ...item,
        type: item.type as "product" | "service"
      })) as SaleItem[];
      
      return { sale, items };
    } catch (error) {
      console.error('Error fetching sale details:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar detalhes",
        description: "Ocorreu um erro ao buscar os detalhes da venda."
      });
      return null;
    }
  };

  const deleteSale = async (saleId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
      return false;
    }
    
    setLoading(true);
    try {
      // Delete sale items first
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', user?.id);
      
      if (saleError) throw saleError;
      
      toast({ title: "Venda excluída com sucesso!" });
      await fetchSales();
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir venda",
        description: "Ocorreu um erro ao excluir a venda."
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSales();
    }
  }, [user]);

  return {
    sales,
    loading,
    fetchSales,
    fetchSaleDetails,
    deleteSale
  };
}
