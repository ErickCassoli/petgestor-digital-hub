import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PLAN_FEATURES, SubscriptionPlan } from "@/constants/plans";

interface SubscriptionData {
  id?: string;
  status?: string;
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  amount?: number | null;
  currency?: string | null;
  interval?: string | null;
  intervalCount?: number | null;
}

interface SubscriptionStatusResponse {
  plan: SubscriptionPlan;
  isSubscribed: boolean;
  subscriptionData: SubscriptionData | null;
}

function formatAmount(amount?: number | null, currency?: string | null) {
  if (!amount) return null;
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: (currency ?? "BRL").toUpperCase(),
    }).format(amount);
  } catch (_err) {
    return `R$ ${amount.toFixed(2).replace(".", ",")}`;
  }
}

export function SubscriptionStatus() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionStatusResponse | null>(null);

  const planFeatureList = useMemo(() => {
    if (!profile) return [];
    return PLAN_FEATURES[profile.plan];
  }, [profile]);

  const loadStatus = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "check-subscription-status",
      );

      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }

      const payload = data as SubscriptionStatusResponse;
      setSubscriptionInfo(payload);
    } catch (err) {
      console.error("Error checking subscription:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user, loadStatus]);

  const renderActivePlan = (info: SubscriptionStatusResponse) => {
    const data = info.subscriptionData;
    const formattedAmount = formatAmount(data?.amount ?? null, data?.currency ?? null);
    const nextPaymentDate = data?.currentPeriodEnd
      ? new Date(data.currentPeriodEnd * 1000)
      : null;
    const formattedNextPayment = nextPaymentDate
      ? format(nextPaymentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Plano Pro ativo</h3>
            <p className="text-green-600 text-sm">
              Acesso ilimitado e sem anuncios para sua equipe.
            </p>
          </div>
        </div>

        {planFeatureList.length > 0 && (
          <ul className="grid gap-2 text-sm text-gray-700">
            {planFeatureList.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 text-sm text-gray-700">
          {formattedAmount && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span>Valor da assinatura</span>
              <span className="font-medium">{formattedAmount}</span>
            </div>
          )}
          {formattedNextPayment && (
            <div className="flex justify-between">
              <span>Proxima cobranca</span>
              <span className="font-medium">{formattedNextPayment}</span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar status
        </Button>
      </div>
    );
  };

  const renderFree = () => (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
          <AlertCircle className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Plano Free ativo</h3>
          <p className="text-blue-600 text-sm">Limites aplicados e anuncios exibidos.</p>
        </div>
      </div>
      <p className="text-sm text-gray-700">
        Atualize para o Pro para desbloquear recursos ilimitados e remover anuncios.
      </p>
    </div>
  );

  const renderSubscriptionStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center py-16 justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (subscriptionInfo?.isSubscribed) {
      return renderActivePlan(subscriptionInfo);
    }

    return renderFree();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status da assinatura</CardTitle>
        <CardDescription>Consulte o seu plano atual e proximos passos.</CardDescription>
      </CardHeader>
      <CardContent>{renderSubscriptionStatus()}</CardContent>
    </Card>
  );
}
