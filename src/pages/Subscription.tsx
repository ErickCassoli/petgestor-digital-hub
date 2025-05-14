// src/pages/Subscription.tsx
import React, { useEffect, useState } from "react";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { StripeSubscriptionCheckout } from "@/components/subscription/StripeSubscriptionCheckout";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  CheckCircle,
  ShieldCheck,
  Calendar as CalendarIcon,
  Badge,
  CreditCard,
  Star,
} from "lucide-react";

// Hook para buscar preço
function useStripePrice() {
  const [price, setPrice] = useState<{ unit_amount: number; currency: string } | null>(null);

  useEffect(() => {
    supabase.functions
      .invoke("get-subscription-price")
      .then(({ data, error }) => {
        if (error) throw error;
        setPrice(data as any);
      })
      .catch(console.error);
  }, []);

  return price;
}

// Tipo do retorno da Edge Function
type SubscriptionResp = {
  isSubscribed: boolean;
  trialActive:  boolean;
  subscriptionData: {
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd:  number; // timestamp em segundos
  } | null;
};

// Hook para buscar status da assinatura
function useSubscriptionData() {
  const [resp, setResp] = useState<SubscriptionResp>({
    isSubscribed: false,
    trialActive:  false,
    subscriptionData: null,
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription-status");
      if (error) throw error;
      setResp(data as SubscriptionResp);
    } catch (err) {
      console.error("Error fetching subscription data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...resp, refresh: fetchData };
}

export default function Subscription() {
  const { isSubscriptionActive, isInTrialPeriod, refreshProfile } = useAuth();
  const { toast } = useToast();
  const price = useStripePrice();
  const { isSubscribed, subscriptionData, refresh } = useSubscriptionData();

  // Calcula grace period
  const isCanceled = subscriptionData?.cancelAtPeriodEnd;
  const periodEnd = subscriptionData?.currentPeriodEnd
    ? new Date(subscriptionData.currentPeriodEnd * 1000)
    : null;
  const isInGrace = Boolean(isCanceled && periodEnd && periodEnd > new Date());

  // Lida com retorno do Stripe
  useEffect(() => {
    const handleReturnFromCheckout = async () => {
      const url = new URL(window.location.href);
      const success  = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");

      if (success || canceled) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (success === "true") {
        toast({ title: "Assinatura realizada com sucesso!" });
        await refresh();         // refetch Edge Function
        await refreshProfile();  // refetch perfil Supabase
      } else if (canceled === "true") {
        toast({ variant: "destructive", title: "Assinatura cancelada" });
        await refresh();
        await refreshProfile();
      }
    };

    handleReturnFromCheckout();
  }, [toast, refresh, refreshProfile]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Plano de Assinatura</h1>
        <p className="text-gray-600">Gerencie sua assinatura do PetGestor</p>
      </div>

      {/* Status + Plano */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <SubscriptionStatus />
        </div>

        <Card className="border-2 border-petblue-200">
          <CardHeader className="bg-petblue-50">
            <div className="flex items-center mb-2">
              <Star className="h-5 w-5 text-petblue-400" fill="currentColor" />
            </div>
            <CardTitle>Plano Completo</CardTitle>
            <CardDescription>Acesso a todas as funcionalidades</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6">
              {price ? (
                <>
                  <span className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: price.currency.toUpperCase(),
                    }).format(price.unit_amount / 100)}
                  </span>
                  <span className="text-gray-500">/mês</span>
                </>
              ) : (
                <span className="text-gray-500 animate-pulse">...</span>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {[
                "Agendamento de serviços",
                "Cadastro ilimitado de clientes",
                "Gestão de produtos e estoque",
                "Relatórios de vendas",
                "Múltiplos usuários",
                "Suporte prioritário",
              ].map((item) => (
                <li key={item} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* 1) Grace Period */}
            {isInGrace && periodEnd && (
              <>
                <p className="text-center text-gray-700 font-medium">
                  Seu plano expira{" "}
                  {formatDistance(periodEnd, new Date(), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
                <StripeSubscriptionCheckout />
              </>
            )}

            {/* 2) Se NÃO há assinatura no Stripe */}
            {!isSubscribed && !isInGrace && (
              <StripeSubscriptionCheckout />
            )}

            {/* 3) Se há assinatura (Stripe) */}
            {isSubscribed && !isInGrace && (
              <div className="bg-green-50 p-3 rounded text-center">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-green-700 font-medium">
                  Você já possui este plano
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Benefícios */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <ShieldCheck className="h-5 w-5 text-petblue-600 mr-2" />
            <CardTitle>Benefícios da Assinatura</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-petblue-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">
                Sistema de Agendamentos
              </h3>
              <p className="text-sm text-gray-600">
                Gerencie todos os agendamentos do seu petshop com facilidade,
                evitando conflitos de horários.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Badge className="h-8 w-8 text-petblue-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">
                Marca Profissional
              </h3>
              <p className="text-sm text-gray-600">
                Ofereça uma experiência mais profissional para seus clientes
                com confirmações automáticas.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <CreditCard className="h-8 w-8 text-petblue-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">
                Pagamento Simplificado
              </h3>
              <p className="text-sm text-gray-600">
                Pagamento mensal simples e seguro via cartão de crédito, sem
                complicações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                q: "Como funciona o período de avaliação?",
                a: "Você tem acesso a todas as funcionalidades do PetGestor gratuitamente por 7 dias. Após esse período, é necessário assinar um plano para continuar utilizando o sistema.",
              },
              {
                q: "Posso cancelar minha assinatura a qualquer momento?",
                a: "Sim, você pode cancelar sua assinatura a qualquer momento, sem taxas adicionais. Você continuará tendo acesso até o final do período pago.",
              },
              {
                q: "Quais métodos de pagamento são aceitos?",
                a: "Aceitamos pagamentos via cartão de crédito, incluindo Visa, Mastercard, American Express e outros.",
              },
              {
                q: "Preciso fornecer dados de pagamento durante o período de avaliação?",
                a: "Não, você pode experimentar o PetGestor gratuitamente por 7 dias sem fornecer dados de pagamento.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-medium text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
