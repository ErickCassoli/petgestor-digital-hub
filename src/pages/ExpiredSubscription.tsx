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
    const { data, error } = await supabase.functions.invoke("get-subscription-price");
    if (error) {
      console.error("Edge Function error:", error);
      if (data) setPrices(data as Prices);
      else setError(error.message);
    } else {
      setPrices(data as Prices);
      setError(null);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, error, refresh: fetchPrices };
}

const ExpiredSubscription: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { prices, error: priceError } = useStripePrices();

  const handleSignOut = async () => {
    // 1) Verifica se há sessão ativa
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      // 2) Se houver, tenta signOut
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== "Auth session missing!") {
        // só toast em erros inesperados
        toast({
          variant: "destructive",
          title: "Erro ao sair",
          description: error.message,
        });
      }
    }
    // 3) De qualquer forma, navega para login
    navigate("/login", { replace: true });
  };

  const plans = [
    { key: "monthly" as const, title: "Plano Mensal", label: "/mês" },
    { key: "trimestral" as const, title: "Plano Trimestral", label: "/3 meses" },
    { key: "semestral" as const, title: "Plano Semestral", label: "/6 meses" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-3xl text-center space-y-6">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Seu período de avaliação terminou
          </h1>
          <div className="flex items-center justify-center bg-amber-50 p-3 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-amber-800">
              Assine agora para continuar utilizando o PetGestor
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Olá, <span className="font-medium">{user?.email}</span>! Seu período de avaliação gratuita terminou. Para continuar gerenciando seu petshop, escolha um dos nossos planos:
          </p>

          {priceError && !prices && (
            <p className="text-red-600 mb-4">
              Não foi possível carregar os planos: {priceError}
            </p>
          )}

          {!prices && !priceError && (
            <p className="text-gray-600 animate-pulse mb-4">
              Carregando planos...
            </p>
          )}

          {prices && (
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              {plans.map(({ key, title, label }) => {
                const price = prices[key]!;
                return (
                  <div
                    key={key}
                    className="bg-gray-50 p-6 rounded-lg border border-petblue-200 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {title}
                      </h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-3xl font-bold text-gray-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: price.currency.toUpperCase(),
                          }).format(price.unit_amount / 100)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                       <span className="ml-1 text-gray-600">{label}</span>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-2 mb-4">
                        <li className="flex items-start">
                          <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>Acesso a todas as funcionalidades</span>
                        </li>
                        <li className="flex items-start">
                          <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>Cadastro ilimitado de clientes e pets</span>
                        </li>
                        <li className="flex items-start">
                          <ChevronRight className="h-4 w-4 text-petblue-500 mr-1 mt-0.5 flex-shrink-0" />
                          <span>Suporte prioritário</span>
                        </li>
                      </ul>
                    </div>
                    <StripeSubscriptionCheckout priceId={price.id} />
                  </div>
                );
              })}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            Sair da conta
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          Dúvidas? Entre em contato com nosso suporte em{" "}
          <a
            href="mailto:contato@petgestor.com.br"
            className="text-petblue-600 hover:text-petblue-800"
          >
            contato@petgestor.com.br
          </a>
        </div>
      </div>
    </div>
  );
};

export default ExpiredSubscription;
