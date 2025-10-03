// src/hooks/useSubscriptionStatus.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlan } from "@/constants/plans";

export type SubscriptionStatus = {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
};

const DEFAULT_STATUS: SubscriptionStatus = {
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
        return;
      }

      const payload = data as {
        isSubscribed?: boolean;
        plan?: SubscriptionPlan;
      };

      setStatus({
        isSubscribed: Boolean(payload.isSubscribed),
        plan: payload.plan ?? "free",
      });
    }

    fetchStatus();
  }, []);

  return status;
}
