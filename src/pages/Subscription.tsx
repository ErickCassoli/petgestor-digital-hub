
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, CreditCard, ShieldCheck, Clock, Calendar, Badge, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { StripeSubscriptionCheckout } from "@/components/subscription/StripeSubscriptionCheckout";
import SubscriptionStatus from "@/components/subscription/SubscriptionStatus";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function useStripePrice() {
  const [price, setPrice] = useState<{unit_amount: number; currency: string;}|null>(null);
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


const Subscription = () => {
  const { user, isInTrialPeriod, isSubscriptionActive } = useAuth();
  const { toast } = useToast();
  const price = useStripePrice();

  // Check for payment status in URL on component mount
  useEffect(() => {
    const checkPaymentStatus = () => {
      const url = new URL(window.location.href);
      const success = url.searchParams.get("success");
      const canceled = url.searchParams.get("canceled");
      
      // Clear the URL parameters
      if (success || canceled) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      if (success === "true") {
        toast({
          title: "Assinatura realizada com sucesso!",
          description: "Sua assinatura foi processada com sucesso.",
        });
      } else if (canceled === "true") {
        toast({
          variant: "destructive",
          title: "Assinatura cancelada",
          description: "O processo de assinatura foi cancelado.",
        });
      }
    };
    
    checkPaymentStatus();
  }, [toast]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plano de Assinatura</h1>
          <p className="text-gray-600 mt-1">
            Gerencie sua assinatura do PetGestor
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-2">
          <SubscriptionStatus />
        </div>

        <div>
          <Card className="border-2 border-petblue-200">
            <CardHeader className="bg-petblue-50">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-petblue-600">Recomendado</Badge>
                <Star className="h-5 w-5 text-petblue-400" fill="currentColor" />
              </div>
              <CardTitle>Plano Completo</CardTitle>
              <CardDescription>Acesso a todas as funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6">
                {price ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style:    "currency",
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
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Agendamento de serviços</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Cadastro ilimitado de clientes</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Gestão de produtos e estoque</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Relatórios de vendas</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Múltiplos usuários</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">Suporte prioritário</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col">
              {!isSubscriptionActive && (
                <StripeSubscriptionCheckout />
              )}
              {isSubscriptionActive && (
                <div className="bg-green-50 rounded-md p-3 text-center w-full">
                  <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-green-700 font-medium">Você já possui este plano</p>
                </div>
              )}
              <p className="text-xs text-gray-500 text-center mt-2">
                {!isSubscriptionActive ? "Cancele a qualquer momento, sem taxas adicionais" : ""}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

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
              <Calendar className="h-8 w-8 text-petblue-600 mb-3" />
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

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Como funciona o período de avaliação?
              </h3>
              <p className="text-gray-600">
                Você tem acesso a todas as funcionalidades do PetGestor gratuitamente por 7 dias. 
                Após esse período, é necessário assinar um plano para continuar utilizando o sistema.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Posso cancelar minha assinatura a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim, você pode cancelar sua assinatura a qualquer momento, sem taxas adicionais. 
                Você continuará tendo acesso até o final do período pago.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Quais métodos de pagamento são aceitos?
              </h3>
              <p className="text-gray-600">
                Aceitamos pagamentos via cartão de crédito, incluindo Visa, Mastercard, American Express e outros.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Preciso fornecer dados de pagamento durante o período de avaliação?
              </h3>
              <p className="text-gray-600">
                Não, você pode experimentar o PetGestor gratuitamente por 7 dias sem fornecer dados de pagamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
