
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sale, SaleItem } from "@/types/sales";

interface StripeCheckoutProps {
  sale: Sale;
  items: SaleItem[];
  disabled?: boolean;
}

export function StripeCheckout({ sale, items, disabled = false }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleCheckout = async () => {
    if (!user || !sale) return;
    
    setLoading(true);
    try {
      // Format items for the checkout
      const checkoutItems = items.map(item => ({
        name: item.products?.name || item.services?.name || `Item ${item.id}`,
        price: Number(item.price),
        quantity: item.quantity,
        type: item.type
      }));
      
      // Get the client name if available
      const clientName = sale.clients?.name || null;
      
      // Get the current URL for redirect
      const returnUrl = window.location.origin + "/vendas";
      
      // Call the Supabase edge function to create a checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          saleId: sale.id,
          saleTotal: sale.total,
          items: checkoutItems,
          clientName,
          returnUrl
        }
      });
      
      if (error) throw error;
      
      // Redirect to the Stripe checkout page
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: "Não foi possível iniciar o checkout no Stripe."
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleCheckout} 
      disabled={disabled || loading}
      className="bg-[#6772E5] hover:bg-[#5469d4] text-white"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Pagar com Stripe
        </>
      )}
    </Button>
  );
}
