
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sale, SaleItem, CartItem } from "@/types/sales";
import { useToast } from "@/components/ui/use-toast";

export function useSales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all sales for the current user
  const fetchSales = useCallback(async () => {
    if (!user?.id) return;

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
  }, [user?.id, toast]);

  // Fetch details for a specific sale
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

  // Delete a sale
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

  // Create a new sale with item-level discounts and surcharges
  const createSale = async (
      items: CartItem[],
      subtotal: number,
      discount: number,           // �?� total dos descontos individuais
      surcharge: number,          // �?� total dos acréscimos individuais
      total: number,
      clientId: string | null,
      clientName: string | null,
      paymentMethod: string,      // �?� inclui aqui
      notes: string | null
    ) => {
    if (!user) return null;
    if (items.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro ao criar venda",
        description: "Adicione pelo menos um item à venda.",
      });
      return null;
    }

    try {
      // Tipo de venda
      const hasProducts = items.some((i) => i.type === "product");
      const hasServices = items.some((i) => i.type === "service");
      const saleType: "product" | "service" | "mixed" =
        hasProducts && hasServices
          ? "mixed"
          : hasProducts
          ? "product"
          : "service";

      // 1) Inserir na tabela `sales` apenas colunas existentes
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: user.id,
          client_id: clientId,
          client_name: clientName,
          subtotal,
          surcharge,
          discount,
          total,
          type: saleType,
          notes,
          sale_date: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (saleError) throw saleError;

      // 2) Inserir itens na sale_items
      const saleItemsPayload = items.map((item) => ({
        sale_id: saleData.id,
        type: item.type,
        product_id: item.type === "product" ? item.id : null,
        service_id: item.type === "service" ? item.id : null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total ?? item.price * item.quantity,
        discount: item.discount || 0,
        surcharge: item.surcharge || 0,
      }));
      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsPayload);
      if (itemsError) throw itemsError;

      // 3) Atualizar estoques de produtos (suportando frações)
      for (const item of items) {
        if (item.type === "product") {
          // Busca o estoque atual (agora numeric)
          const { data: prod, error: prodErr } = await supabase
            .from("products")
            .select("stock")
            .eq("id", item.id)
            .single();
          if (prodErr || !prod) {
            console.error("Erro ao buscar estoque do produto:", prodErr);
            continue;
          }
          // Garante que seja número
          const currentStock =
            typeof prod.stock === "string" ? parseFloat(prod.stock) : prod.stock;
          // Subtrai a quantidade vendida e formata com 2 casas
          const newStock = parseFloat((currentStock - item.quantity).toFixed(2));

          // Grava de volta no banco
          const { error: updateErr } = await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.id)
            .eq("user_id", user.id);

          if (updateErr) {
            console.error("Erro ao atualizar estoque:", updateErr);
          }
        }
      }

      toast({ title: "Venda registrada com sucesso!" });
      return saleData;
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar venda",
        description: "Ocorreu um erro ao registrar a venda.",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return {
    sales,
    loading,
    fetchSales,
    fetchSaleDetails,
    deleteSale,
    createSale,
  };
}
