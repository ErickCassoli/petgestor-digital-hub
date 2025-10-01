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
  Star,
  ShieldCheck,
  Calendar as CalendarIcon,
  Badge,
  CreditCard,
} from "lucide-react";

// --- Tipagens
type PriceInfo = { id: string; unit_amount: number; currency: string };
type Prices = {
  monthly: PriceInfo;
  trimestral: PriceInfo;
  semestral: PriceInfo;
};

// --- Hook para carregar preços com estado de erro e refresh
function useStripePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-subscription-price"
      );
      if (error) throw error;
      setPrices(data as Prices);
    } catch (err: any) {
      console.error("Erro ao carregar preços:", err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return { prices, error, refresh: fetchPrices };
}

// --- Hook existente para status de assinatura
type SubscriptionResp = {
  isSubscribed: boolean;
  trialActive: boolean;
  subscriptionData: {
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
  } | null;
};
function useSubscriptionData() {
  const [resp, setResp] = useState<SubscriptionResp>({
    isSubscribed: false,
    trialActive: false,
    subscriptionData: null,
  });
  const fetchData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "check-subscription-status"
      );
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

// --- Componente principal
export default function Subscription() {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const { prices, error: priceError, refresh: refreshPrices } = useStripePrices();
  const { isSubscribed, subscriptionData, refresh: refreshSubData } =
    useSubscriptionData();

  // Grace period
  const isCanceled = subscriptionData?.cancelAtPeriodEnd;
  const periodEnd = subscriptionData?.currentPeriodEnd
    ? new Date(subscriptionData.currentPeriodEnd * 1000)
    : null;
  const isInGrace = Boolean(isCanceled && periodEnd && periodEnd > new Date());

  // Quando volta do checkout, refaz todos os fetch
  useEffect(() => {
    const handleReturn = async () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");
      if (success || canceled) {
        window.history.replaceState({}, "", window.location.pathname);
        toast({
          title:
            success === "true"
              ? "Assinatura realizada com sucesso!"
              : "Assinatura cancelada",
          variant: success === "true" ? undefined : "destructive",
        });
        await Promise.all([
          refreshSubData(),
          refreshProfile(),
          refreshPrices(),
        ]);
      }
    };
    handleReturn();
  }, [toast, refreshSubData, refreshProfile, refreshPrices]);

  // --- Guard Clauses
  if (priceError) {
    return (
      <div className="p-6">
        <p className="text-red-600">Erro ao carregar planos: {priceError}</p>
      </div>
    );
  }

  if (!prices) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <span className="text-gray-600 animate-pulse">Carregando planos...</span>
      </div>
    );
  }

  // cálculo base para desconto
  const baseMonthly = prices.monthly.unit_amount / 100;

  // configuração dos planos com meses e destaque
  const planConfigs = [
    {
      key: "monthly" as const,
      title: "Plano Mensal",
      desc: "Acesso mensal",
      label: "/mês",
      months: 1,
    },
    {
      key: "trimestral" as const,
      title: "Plano Trimestral",
      desc: "Acesso por 3 meses",
      label: "/3 meses",
      months: 3,
      isPopular: true,
    },
    {
      key: "semestral" as const,
      title: "Plano Semestral",
      desc: "Acesso por 6 meses",
      label: "/6 meses",
      months: 6,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Plano de Assinatura</h1>
        <p className="text-gray-600">Gerencie sua assinatura do PetGestor</p>
      </div>

      {/* Status */}
      <SubscriptionStatus />

      {/* Planos */}
      <div className="grid md:grid-cols-3 gap-8">
        {planConfigs.map(({ key, title, desc, label, months, isPopular }) => {
          const price = prices[key]!;
          const total = price.unit_amount / 100;
          const mensalEquiv = total / months;
          const discountPercent =
            months > 1
              ? Math.round((1 - mensalEquiv / baseMonthly) * 100)
              : 0;

          return (
            <Card
              key={key}
              id={`plan-${key}`}
              className={`
                relative border-2 rounded-xl
                transition-transform duration-300
                hover:scale-105 hover:shadow-2xl cursor-pointer
                ${isPopular
                  ? "border-petblue-600 ring-2 ring-petblue-200"
                  : "border-petblue-200"}
              `}
            >
              {/* Badge “Mais Popular” */}
              {isPopular && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-petblue-500 to-petblue-700 text-white uppercase text-xs font-bold px-3 py-1 rounded-full">
                  Mais Popular
                </div>
              )}

              <CardHeader className="bg-petblue-50 text-center">
                <div className="flex justify-center mb-2">
                  <Star className="h-5 w-5 text-petblue-400" fill="currentColor" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: price.currency.toUpperCase(),
                    }).format(total)}
                  </span>
                  <span className="text-gray-500 ml-1">{label}</span>
                  {months > 1 && (
                    <div className="mt-2">
                      <span className="text-green-600 font-semibold text-sm">
                        {discountPercent}% OFF
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        equiv. a{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: price.currency.toUpperCase(),
                        }).format(mensalEquiv)}
                        /mês
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
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
                {isInGrace && periodEnd && (
                  <>
                    <p className="text-center text-gray-700 font-medium">
                      Seu plano expira{" "}
                      {formatDistance(periodEnd, new Date(), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    <StripeSubscriptionCheckout priceId={price.id} />
                  </>
                )}

                {!isSubscribed && !isInGrace && (
                  <StripeSubscriptionCheckout priceId={price.id} />
                )}

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
          );
        })}
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
              <h3 className="font-medium text-gray-900 mb-2">Sistema de Agendamentos</h3>
              <p className="text-sm text-gray-600">
                Gerencie todos os agendamentos do seu petshop com facilidade, evitando conflitos de horários.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Badge className="h-8 w-8 text-petblue-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">Marca Profissional</h3>
              <p className="text-sm text-gray-600">
                Ofereça uma experiência mais profissional para seus clientes com confirmações automáticas.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <CreditCard className="h-8 w-8 text-petblue-600 mb-3" />
              <h3 className="font-medium text-gray-900 mb-2">Pagamento Simplificado</h3>
              <p className="text-sm text-gray-600">
                Pagamento mensal simples e seguro via cartão de crédito, sem complicações.
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
