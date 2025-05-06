
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Check, Info, ShieldAlert } from "lucide-react";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  trial_end_date: string | null;
}

export default function ExpiredSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_subscribed, trial_end_date')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data.is_subscribed) {
          // Se o usuário já está inscrito, redirecione para o dashboard
          navigate('/dashboard');
          toast({
            variant: "default", // Changed from "success" to "default" to fix the error
            title: "Assinatura ativa",
            description: "Sua conta possui uma assinatura ativa."
          });
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, navigate, toast]);

  const handleGoToSubscription = () => {
    navigate('/subscription');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent text-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-10">
      <Card className="border-destructive/20">
        <CardHeader className="space-y-1 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <CardTitle>Período de avaliação encerrado</CardTitle>
          </div>
          <CardDescription className="pt-1.5">
            Seu período de avaliação gratuita chegou ao fim. Faça uma assinatura para continuar utilizando todos os recursos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {profile?.trial_end_date && (
            <div className="flex items-start space-x-3 rounded-md border p-3 bg-muted/50">
              <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Período de avaliação encerrado</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistance(new Date(profile.trial_end_date), new Date(), { 
                    addSuffix: true,
                    locale: ptBR
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-md border p-3 bg-amber-50 border-amber-200">
            <div className="flex items-start space-x-3">
              <Info className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Acesso limitado</p>
                <p className="text-sm text-amber-700">
                  Você está com acesso limitado às funcionalidades do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium">Com uma assinatura você tem acesso a:</h3>
            <ul className="space-y-2.5 pl-1">
              <li className="flex items-start space-x-2">
                <Check className="mt-0.5 h-4 w-4 text-green-600" />
                <span className="text-sm">Acesso completo a todos os recursos</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="mt-0.5 h-4 w-4 text-green-600" />
                <span className="text-sm">Cadastro ilimitado de clientes, produtos e serviços</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="mt-0.5 h-4 w-4 text-green-600" />
                <span className="text-sm">Relatórios detalhados de vendas e financeiro</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="mt-0.5 h-4 w-4 text-green-600" />
                <span className="text-sm">Suporte prioritário</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button className="w-full" onClick={handleGoToSubscription}>
            Ver planos de assinatura
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
