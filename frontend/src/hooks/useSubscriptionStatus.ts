// src/hooks/useSubscriptionStatus.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = {
  trialExpired: boolean;
  isSubscribed: boolean;
};

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      const { data, error } = await supabase.functions.invoke("check-subscription-status");
      if (error) {
        console.error("Erro ao verificar assinatura:", error);
        // impede a tela bloqueada em caso de falha
        setStatus({ trialExpired: false, isSubscribed: true });
      } else {
        const { trialActive, isSubscribed } = data as any;
        setStatus({
          trialExpired: !trialActive,
          isSubscribed,
        });
      }
    }
    fetchStatus();
  }, []);

  return status;
}
