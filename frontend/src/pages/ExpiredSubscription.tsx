// src/pages/ExpiredSubscription.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, AlertTriangle, ChevronRight } from "lucide-react";
import { StripeSubscriptionCheckout } from "@/components/subscription/StripeSubscriptionCheckout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriceInfo {
  id: string;
  unit_amount: number;
  currency: string;
}
interface Prices {
  monthly: PriceInfo;
  trimestral: PriceInfo;
  semestral: PriceInfo;
}

function useStripePrices() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-subscription-price");
      if (error) {
        if (data) setPrices(data as Prices);
        else setError(error.message);
      } else {
        setPrices(data as Prices);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, error, refresh: fetchPrices };
}

export default function ExpiredSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { prices, error: priceError } = useStripePrices();

  const handleSignOut = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== "Auth session missing!") {
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: error.message,
        });
      }
    }
    navigate("/login", { replace: true });
  };

  // base mensal para cálculo de desconto
  const baseMonthly = prices ? prices.monthly.unit_amount / 100 : 0;

  // configurações dos planos
  const planConfigs = [
    { key: "monthly" as const, title: "Plano Mensal", months: 1 },
    { key: "trimestral" as const, title: "Plano Trimestral", months: 3, isPopular: true },
    { key: "semestral" as const, title: "Plano Semestral", months: 6 },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6">
        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow border border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Seu período de avaliação terminou
          </h1>
          <div className="bg-amber-50 flex items-center justify-center p-3 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <span className="text-sm text-amber-800">
              Assine agora para continuar utilizando o PetGestor
            </span>
          </div>
          <p className="text-gray-600 mb-8">
            Olá, <span className="font-medium">{user?.email}</span>! Seu período de avaliação gratuita terminou. Para continuar gerenciando seu petshop, escolha um dos nossos planos:
          </p>

          {priceError && !prices && (
            <div className="text-red-600 mb-4">{priceError}</div>
          )}

          {!prices && !priceError && (
            <div className="text-gray-600 animate-pulse mb-4">
              Carregando planos...
            </div>
          )}

          {/* Planos */}
          {prices && (
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              {planConfigs.map(({ key, title, months, isPopular }) => {
                const price = prices[key]!;
                const total = price.unit_amount / 100;
                const mensalEquiv = total / months;
                const discountPercent =
                  months > 1
                    ? Math.round((1 - mensalEquiv / baseMonthly) * 100)
                    : 0;

                return (
                  <div
                    key={key}
                    className={`
                      relative flex flex-col justify-between h-full
                      bg-white p-6 rounded-2xl border-2
                      transition-transform duration-300
                      hover:scale-105 hover:shadow-lg cursor-pointer
                      ${isPopular
                        ? "border-petblue-600 ring-2 ring-petblue-200"
                        : "border-petblue-200"}
                    `}
                  >
                    {isPopular && (
                      <span className="absolute top-3 right-3 bg-petblue-600 text-white text-xs font-bold uppercase px-2 py-1 rounded-full">
                        Mais Popular
                      </span>
                    )}

                    {/* Título e preço */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                        {title}
                      </h3>
                      <div className="text-center mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: price.currency.toUpperCase(),
                          }).format(total)}
                        </span>
                        <span className="text-sm text-gray-600 ml-1">
                          /{months > 1 ? `${months} meses` : "mês"}
                        </span>
                      </div>
                      {months > 1 && (
                        <div className="text-center mb-6">
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

                    {/* Lista de benefícios */}
                    <ul className="text-sm text-gray-600 space-y-2 mb-6">
                      <li className="flex items-start">
                        <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 shrink-0" />
                        <span>Acesso a todas as funcionalidades</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 shrink-0" />
                        <span>Cadastro ilimitado de clientes e pets</span>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 shrink-0" />
                        <span>Suporte prioritário</span>
                      </li>
                    </ul>

                    {/* CTA */}
                    <div className="text-center">
                      <StripeSubscriptionCheckout priceId={price.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
