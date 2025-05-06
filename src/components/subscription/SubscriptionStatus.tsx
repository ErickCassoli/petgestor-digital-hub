
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Check, ClockIcon, CreditCard, InfoIcon, ShieldAlert, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistance, formatRelative, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  customer?: {
    email?: string;
  };
  latest_invoice?: {
    amount_paid?: number;
    currency?: string;
  };
  price?: {
    unit_amount?: number;
    currency?: string;
  };
  created_at?: string;
}

interface Profile {
  id: string;
  name: string | null;
  role: string | null;
  is_subscribed: boolean | null;
  trial_end_date: string | null;
}

const SubscriptionStatus = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    async function checkSubscription() {
      setLoading(true);
      try {
        // Get profile with trial information
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Check if trial has expired
        if (profileData.trial_end_date) {
          const trialEndDate = new Date(profileData.trial_end_date);
          const now = new Date();
          setIsExpired(!profileData.is_subscribed && isAfter(now, trialEndDate));
        }
        
        // Get subscription data if user is subscribed
        if (profileData.is_subscribed) {
          const { data, error } = await supabase.functions.invoke('check-subscription-status');
          
          if (error) {
            throw error;
          }
          
          if (data && data.subscription) {
            setSubscription(data.subscription);
          }
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast({
          variant: "destructive",
          title: "Erro ao verificar assinatura",
          description: "Não foi possível verificar o status da sua assinatura."
        });
      } finally {
        setLoading(false);
      }
    }
    
    checkSubscription();
  }, [user, toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary"></div>
          <p className="text-sm text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }
  
  // Mostrar botão de assinar caso não tenha assinatura ativa
  if (!profile?.is_subscribed) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-yellow-500" />
            <span>Sem assinatura ativa</span>
          </CardTitle>
          <CardDescription>
            {isExpired ? (
              <span className="text-destructive font-medium">
                Seu período de avaliação gratuita terminou.
              </span>
            ) : (
              <span>
                Você está no período de avaliação gratuita.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.trial_end_date && !isExpired && (
            <div className="flex items-center p-3 border rounded-md bg-muted/50">
              <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Período de avaliação</p>
                <p className="text-xs text-muted-foreground">
                  Termina em {format(new Date(profile.trial_end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs mt-1">
                  {formatDistance(new Date(profile.trial_end_date), new Date(), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-medium">Com uma assinatura você tem acesso a:</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                <span>Acesso ilimitado a todos os recursos</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                <span>Relatórios e análises avançadas</span>
              </li>
              <li className="flex items-start">
                <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                <span>Backup automático de dados</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/subscription">
              {isExpired ? "Assinar agora" : "Ver planos de assinatura"}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Mostrar informações da assinatura
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-green-500" />
            <span>Assinatura ativa</span>
          </CardTitle>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {subscription?.status === "active" ? "Ativa" : 
             subscription?.status === "trialing" ? "Em teste" : 
             subscription?.status === "past_due" ? "Pagamento pendente" : 
             "Verificando"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription && (
          <>
            <div className="flex items-center p-3 border rounded-md bg-muted/50">
              <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Próxima cobrança</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs mt-1">
                  {formatDistance(new Date(subscription.current_period_end), new Date(), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-md">
                <p className="text-sm font-medium">Valor da assinatura</p>
                <p className="text-xl font-bold">
                  {subscription.price?.unit_amount ? 
                    new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: subscription.price.currency || 'BRL' 
                    }).format(subscription.price.unit_amount / 100) : "Verificando..."}
                </p>
              </div>
              
              <div className="p-3 border rounded-md">
                <p className="text-sm font-medium">Status de renovação</p>
                <p className="text-sm font-medium mt-1">
                  {subscription.cancel_at_period_end ? (
                    <span className="text-yellow-600">Não será renovada</span>
                  ) : (
                    <span className="text-green-600">Renovação automática</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="p-3 border rounded-md space-y-1">
              <p className="text-sm font-medium">Detalhes da assinatura</p>
              <p className="text-xs text-muted-foreground">
                ID da assinatura: {subscription.id}
              </p>
              {subscription.created_at && (
                <p className="text-xs text-muted-foreground">
                  Assinante desde: {format(new Date(subscription.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </>
        )}
        
        {!subscription && (
          <div className="flex items-center p-4 border rounded-md">
            <InfoIcon className="h-5 w-5 mr-2 text-amber-500" />
            <p className="text-sm">Assinatura ativa, mas não foi possível obter os detalhes.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button variant="outline" asChild className="w-full">
          <Link to="/subscription">
            Gerenciar assinatura
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionStatus;
