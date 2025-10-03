// src/pages/Subscription.tsx
import React, { useEffect, useMemo, useState } from "react";
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
import { Badge, CreditCard, Star, ShieldCheck } from "lucide-react";
import {
  PLAN_DESCRIPTIONS,
  PLAN_FEATURES,
  FREE_PLAN_LIMITS,
  SubscriptionPlan,
} from "@/constants/plans";

const PRICE_IDS = ["monthly", "trimestral", "semestral"] as const;

type PriceKey = typeof PRICE_IDS[number];

type PriceInfo = { id: string; unit_amount: number; currency: string };
type Prices = Record<PriceKey, PriceInfo>;

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch (_err) {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }
}

type SubscriptionResponse = {
  plan: SubscriptionPlan;
  isSubscribed: boolean;
  subscriptionData: {
    currentPeriodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
};

function useStripePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-subscription-price",
      );
      if (error) throw error;
      setPrices(data as Prices);
    } catch (err) {
      console.error("Erro ao carregar precos:", err);
      setError((err as Error)?.message ?? "Falha ao carregar precos");
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  return { prices, error, refresh: fetchPrices };
}

function useSubscriptionData() {
  const [state, setState] = useState<SubscriptionResponse>({
    plan: "free",
    isSubscribed: false,
    subscriptionData: null,
  });

  const refresh = async () => {
    const { data, error } = await supabase.functions.invoke(
      "check-subscription-status",
    );
    if (error) {
      console.error("Erro ao consultar assinatura:", error);
      return;
    }
    setState(data as SubscriptionResponse);
  };

  useEffect(() => {
    refresh();
  }, []);

  return { ...state, refresh };
}

const PLAN_CONFIGS: Array<{
  key: PriceKey;
  title: string;
  months: number;
  highlight?: boolean;
}> = [
  { key: "monthly", title: "Mensal", months: 1, highlight: false },
  { key: "trimestral", title: "Trimestral", months: 3, highlight: true },
  { key: "semestral", title: "Semestral", months: 6, highlight: false },
];

export default function Subscription() {
  const { toast } = useToast();
  const { refreshProfile, profile } = useAuth();
  const { prices, error: priceError, refresh: refreshPrices } = useStripePrices();
  const { isSubscribed, refresh: refreshSubscription } = useSubscriptionData();

  // Ao voltar do checkout, atualiza status e precos
  useEffect(() => {
    const handleReturn = async () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");

      if (success || canceled) {
        window.history.replaceState({}, "", window.location.pathname);
        toast({
          title: success === "true" ? "Assinatura ativa" : "Processo cancelado",
          variant: success === "true" ? undefined : "destructive",
        });
        await Promise.all([
          refreshSubscription(),
          refreshProfile(),
          refreshPrices(),
        ]);
      }
    };

    handleReturn();
  }, [toast, refreshSubscription, refreshProfile, refreshPrices]);

  const freeFeatures = useMemo(() => [
    `Ate ${FREE_PLAN_LIMITS.pets} pets cadastrados`,
    `Ate ${FREE_PLAN_LIMITS.appointmentsPerMonth} agendamentos por mes`,
    `Ate ${FREE_PLAN_LIMITS.products} itens de estoque`,
    `Ate ${FREE_PLAN_LIMITS.services} servicos ativos`,
    'Monetizacao com anuncios AdSense',
  ], []);

  if (priceError) {
    return (
      <div className="p-6">
        <p className="text-red-600 text-sm">Erro ao carregar planos: {priceError}</p>
      </div>
    );
  }

  if (!prices) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-gray-600 animate-pulse">Carregando planos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Planos PetGestor</h1>
        <p className="text-gray-600">
          Escolha entre o plano Free com limites e monetizacao por anuncios ou o plano Pro com recursos ilimitados e sem anuncios.
        </p>
      </div>

      <SubscriptionStatus />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Plano Free</CardTitle>
            <CardDescription>{PLAN_DESCRIPTIONS.free.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-gray-700">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">
              Ideal para comecos e pequenos petshops. Atualize para remover limites e anuncios.
            </p>
          </CardFooter>
        </Card>

        <Card className="border-petblue-200">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Plano Pro</CardTitle>
              {isSubscribed && <Badge variant="secondary">Seu plano atual</Badge>}
            </div>
            <CardDescription>{PLAN_DESCRIPTIONS.pro.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3 text-sm text-gray-700">
              {PLAN_FEATURES.pro.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-amber-500 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="grid gap-4 md:grid-cols-3">
              {PLAN_CONFIGS.map(({ key, title, months, highlight }) => {
                const price = prices[key];
                const total = price.unit_amount / 100;
                const monthly = total / months;
                const monthlyBase = prices.monthly.unit_amount / 100;
                const discount = months > 1
                  ? Math.round((1 - monthly / monthlyBase) * 100)
                  : 0;

                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-4 ${highlight ? "border-petblue-400 shadow" : "border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                      {highlight && <Badge variant="secondary">Popular</Badge>}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-petblue-600">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: price.currency.toUpperCase(),
                      }).format(total)}
                    </p>
                    <p className="text-xs text-gray-500">Equivalente a {formatCurrency(monthly, price.currency)} por mes</p>
                    {discount > 0 && (
                      <p className="text-xs text-green-600 mt-1">Economize {discount}%</p>
                    )}
                    <StripeSubscriptionCheckout
                      priceId={price.id}
                      disabled={isSubscribed}
                    />
                    {isSubscribed && (
                      <p className="text-xs text-gray-500 text-center">
                        Voce ja esta no plano Pro. Gerencie sua assinatura acima.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard className="h-4 w-4" />
              Pagamentos processados com Stripe.
            </div>
            <p>
              Cancelamento a qualquer momento diretamente pelo painel de assinatura.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}



