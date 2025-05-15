// src/components/subscription/StripeSubscriptionCheckout.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StripeSubscriptionCheckoutProps {
  priceId: string;
  disabled?: boolean;
}

export function StripeSubscriptionCheckout({
  priceId,
  disabled = false,
}: StripeSubscriptionCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // URL para redirecionar de volta após o checkout
      const returnUrl = window.location.origin + window.location.pathname;

      const payload = {
        returnUrl,
        email: user.email,
        priceId,
      };

      const { data, error } = await supabase.functions.invoke(
        "create-subscription-checkout",
        {
          body: JSON.stringify(payload),
        }
      );

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast({
        variant: "destructive",
        title: "Erro ao processar assinatura",
        description: "Não foi possível iniciar o processo de assinatura.",
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
