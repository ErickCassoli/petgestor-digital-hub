
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, AlertTriangle, ChevronRight } from "lucide-react";
import { StripeSubscriptionCheckout } from "@/components/subscription/StripeSubscriptionCheckout";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

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


const ExpiredSubscription = () => {
  const { user, signOut } = useAuth();
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
          description: "Sua assinatura foi processada com sucesso. Você agora tem acesso completo ao PetGestor.",
          variant: "default"
        });
        // In a real app, you would refresh subscription data here or redirect
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Seu período de avaliação terminou
          </h1>
          
          <div className="flex items-center justify-center bg-amber-50 p-3 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm text-amber-800">
              Assine agora para continuar utilizando o PetGestor
            </p>
          </div>
          
          <p className="text-gray-600 mb-6">
            Olá, <span className="font-medium">{user?.email}</span>! Seu período de avaliação gratuita terminou. 
            Para continuar gerenciando seu petshop com o PetGestor, por favor assine nosso plano.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Plano completo</h3>
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
            <ul className="text-sm text-gray-600 space-y-2 mb-4">
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 text-petblue-500 mt-0.5 mr-1 flex-shrink-0" />
                <span>Acesso a todas as funcionalidades</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 text-petblue-500 mt-0.5 mr-1 flex-shrink-0" />
                <span>Cadastro ilimitado de clientes e pets</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-4 w-4 text-petblue-500 mt-0.5 mr-1 flex-shrink-0" />
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <StripeSubscriptionCheckout />
            
            <Button variant="outline" className="w-full" onClick={signOut}>
              Sair da conta
            </Button>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          Dúvidas? Entre em contato com nosso suporte em<br />
          <a href="mailto:suporte@petgestor.com.br" className="text-petblue-600 hover:text-petblue-800">
            contato@petgestor.com.br
          </a>
        </div>
      </div>
    </div>
  );
};

export default ExpiredSubscription;
