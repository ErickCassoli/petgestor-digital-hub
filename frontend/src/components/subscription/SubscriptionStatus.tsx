import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodStart: number;  // timestamp em segundos
  currentPeriodEnd: number;    // timestamp em segundos
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
}

interface SubscriptionStatusResponse {
  isSubscribed: boolean;
  trialActive: boolean;
  subscriptionData: SubscriptionData | null;
  error?: string;
}

export function SubscriptionStatus() {
  const { user, profile, isInTrialPeriod } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionStatusResponse | null>(null);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription-status");

      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }

      setSubscriptionInfo(data as SubscriptionStatusResponse);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscriptionStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const renderSubscriptionStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center py-20 justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    // Assinatura ativa
    if (subscriptionInfo?.isSubscribed && subscriptionInfo.subscriptionData) {
      const data = subscriptionInfo.subscriptionData;
      // converte de segundos para milissegundos
      const startDate = new Date(data.currentPeriodStart * 1000);
      const nextPaymentDate = new Date(data.currentPeriodEnd * 1000);

      const formattedStartDate = format(
        startDate,
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      );
      const formattedNextPayment = format(
        nextPaymentDate,
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      );

      return (
        <div>
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Assinatura Ativa</h3>
              <p className="text-green-600">
                Plano Completo - R$ {data.amount.toFixed(2).replace(".", ",")} por mês
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800">Sua assinatura está ativa</h4>
                <p className="text-sm text-green-700 mt-1">
                  Você tem acesso a todas as funcionalidades do PetGestor.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-gray-900">Ativo</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Data de início</span>
              <span className="font-medium text-gray-900">{formattedStartDate}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">ID da assinatura</span>
              <span className="font-medium text-gray-900 text-sm">{data.id}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Próxima cobrança</span>
              <span className="font-medium text-gray-900">
                {formattedNextPayment} – R$ {data.amount.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-6"
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
    }

    // Período de avaliação
    if (isInTrialPeriod) {
      const trialEndDate = profile?.trial_end_date
        ? format(new Date(profile.trial_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : "Não disponível";

      return (
        <div>
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Período de Avaliação</h3>
              <p className="text-amber-600">
                {profile?.trial_end_date
                  ? `Restam ${Math.ceil((new Date(profile.trial_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias`
                  : "Restam 7 dias"}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">Período de avaliação ativo</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Você está no período de avaliação gratuita. Após o término, será necessário assinar um plano para continuar utilizando o PetGestor.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Tipo de plano</span>
              <span className="font-medium text-gray-900">Avaliação</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Data de início</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600">Data de término</span>
              <span className="font-medium text-gray-900">{trialEndDate}</span>
            </div>
          </div>
        </div>
      );
    }

    // Sem assinatura
    return (
      <div>
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Assinatura Não Ativa</h3>
            <p className="text-gray-500">Você não possui uma assinatura ativa</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800">Acesso limitado</h4>
              <p className="text-sm text-red-700 mt-1">
                Para ter acesso completo às funcionalidades do PetGestor, é necessário assinar um plano.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status da Assinatura</CardTitle>
        <CardDescription>Informações sobre o seu plano atual</CardDescription>
      </CardHeader>
      <CardContent>{renderSubscriptionStatus()}</CardContent>
    </Card>
  );
}
