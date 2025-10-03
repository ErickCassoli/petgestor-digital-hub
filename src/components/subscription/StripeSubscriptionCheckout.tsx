// src/components/subscription/StripeSubscriptionCheckout.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  priceId: string;
  disabled?: boolean;
}

export function StripeSubscriptionCheckout({
  priceId,
  disabled = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Sempre envia só a rota base de assinatura
      const returnUrl = `${window.location.origin}/assinatura`;

      const { data, error } = await supabase.functions.invoke(
        "create-subscription-checkout",
        {
          body: JSON.stringify({
            returnUrl,
            email: user.email,
            priceId,
            userId: user.id,
          }),
        }
      );

      if (error) throw error;
      if (data?.url) {
        // Substitui no histórico para o "voltar" funcionar corretamente
        window.location.replace(data.url);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: unknown) {
      console.error("Error creating checkout:", error);
      toast({
        variant: "destructive",
        title: "Erro ao processar assinatura",
        description: (error instanceof Error ? error.message : undefined) || "Não foi possível iniciar o processo de assinatura.",
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


