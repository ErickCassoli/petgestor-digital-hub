// src/hooks/useSubscriptionStatus.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlan } from "@/constants/plans";

export type SubscriptionStatus = {
  trialExpired: boolean;
  isSubscribed: boolean;
  plan: SubscriptionPlan;
};

const DEFAULT_STATUS: SubscriptionStatus = {
  trialExpired: false,
  isSubscribed: false,
  plan: "free",
};

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);

  useEffect(() => {
    async function fetchStatus() {
      const { data, error } = await supabase.functions.invoke("check-subscription-status");
      if (error) {
        console.error("Erro ao verificar assinatura:", error);
        // keep default free status so UI stays accessible
        return;
      }

      const payload = data as {
        trialActive?: boolean;
        isSubscribed?: boolean;
        plan?: SubscriptionPlan;
      };

      setStatus({
        trialExpired: payload.trialActive === false,
        isSubscribed: Boolean(payload.isSubscribed),
        plan: payload.plan ?? "free",
      });
    }

    fetchStatus();
  }, []);

  return status;
}
