import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sale, SaleItem, CartItem } from "@/types/sales";
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
          client:client_id (id, name)
        `)
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedData = data as Sale[];
      
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
          client:client_id (id, name)
        `)
        .eq('id', saleId)
        .single();
        
      if (saleError) throw saleError;
      
      // Type assertion
      const sale = saleData as Sale;
      
      // Get the sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          product:product_id (name),
          service:service_id (name)
        `)
        .eq('sale_id', saleId);
      
      if (itemsError) throw itemsError;
      
      // Type assertion to ensure correct typing
      const items = itemsData as SaleItem[];
      
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
      // Delete the sale (sale items are automatically deleted due to CASCADE)
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
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

  // Function to create a new sale
  const createSale = async (
    items: CartItem[], 
    subtotal: number,
    discount: number,
    surcharge: number,
    total: number,
    clientId: string | null,
    clientName: string | null,
    paymentMethod: string | null,
    notes: string | null
  ) => {
    if (!user) return null;
    
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro ao criar venda",
        description: "Adicione pelo menos um item à venda."
      });
      return null;
    }
    
    try {
      // Determine sale type based on items
      const hasProducts = items.some(item => item.type === "product");
      const hasServices = items.some(item => item.type === "service");
      
      let saleType: "product" | "service" | "mixed";
      if (hasProducts && hasServices) {
        saleType = "mixed";
      } else if (hasProducts) {
        saleType = "product";
      } else {
        saleType = "service";
      }
      
      // Create the sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          client_id: clientId,
          client_name: clientName,
          subtotal,
          discount,
          surcharge,
          total,
          type: saleType,
          payment_method: paymentMethod || 'cash',
          notes,
          sale_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (saleError) throw saleError;
      
      // Create sale items
      const saleItems = items.map(item => ({
        sale_id: saleData.id,
        type: item.type,
        product_id: item.type === 'product' ? item.id : null,
        service_id: item.type === 'service' ? item.id : null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) throw itemsError;
      
      // Update product stocks using RPC function
      for (const item of items) {
        if (item.type === 'product') {
          const { error: stockError } = await supabase.rpc('update_product_stock', {
            p_product_id: item.id,
            p_quantity: -item.quantity // Negative to decrease stock
          });
          
          if (stockError) {
            console.error('Error updating stock:', stockError);
            // Continue even if stock update fails
          }
        }
      }
      
      toast({
        title: "Venda registrada com sucesso!"
      });
      
      return saleData;
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar venda",
        description: "Ocorreu um erro ao registrar a venda."
      });
      return null;
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
    deleteSale,
    createSale
  };
}
