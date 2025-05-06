import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Clock, AlertCircle, Check } from "lucide-react";

export default function SubscriptionStatus() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<{
    is_subscribed: boolean | null;
    trial_end_date: string | null;
  }>({
    is_subscribed: null,
    trial_end_date: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_subscribed, trial_end_date')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        setSubscription({
          is_subscribed: data?.is_subscribed ?? false,
          trial_end_date: data?.trial_end_date ?? null,
        });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar status da assinatura",
          description: "Ocorreu um erro ao buscar o status da assinatura."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user, toast]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="grid h-32 place-items-center">
          <Clock className="mr-2 h-4 w-4 animate-spin" /> Carregando...
        </CardContent>
      </Card>
    );
  }

  const trialEndDate = subscription.trial_end_date ? parseISO(subscription.trial_end_date) : null;
  const isTrialActive = trialEndDate ? isAfter(trialEndDate, new Date()) : false;
  const trialRemainingDays = trialEndDate ? Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  return (
    <Card className="w-full">
      <CardContent className="grid gap-4">
        {subscription.is_subscribed ? (
          <>
            <div className="flex items-center space-x-4">
              <Check className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold">Assinatura Ativa</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Sua assinatura está ativa. Obrigado por apoiar nosso trabalho!
            </p>
          </>
        ) : isTrialActive ? (
          <>
            <div className="flex items-center space-x-4">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Teste Gratuito Ativo</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu período de teste gratuito termina em {format(trialEndDate, 'dd/MM/yyyy', { locale: ptBR })} ({trialRemainingDays} dias restantes).
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Sem Assinatura Ativa</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Você não possui uma assinatura ativa no momento.
            </p>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild>
          <a href="/subscription">
            Gerenciar Assinatura
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
