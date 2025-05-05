
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StripeSubscriptionCheckoutProps {
  disabled?: boolean;
}

export function StripeSubscriptionCheckout({ disabled = false }: StripeSubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleCheckout = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get the current URL for redirect
      const returnUrl = window.location.origin + "/assinatura";
      
      // Call the Supabase edge function to create a checkout session
      const { data, error } = await supabase.functions.invoke("create-subscription-checkout", {
        body: {
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
        title: "Erro ao processar assinatura",
        description: "Não foi possível iniciar o processo de assinatura."
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleCheckout} 
      disabled={disabled || loading}
      className="w-full bg-petblue-600 hover:bg-petblue-700 mb-3"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Assinar agora
        </>
      )}
    </Button>
  );
}
