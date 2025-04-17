
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, CreditCard, ShieldCheck, Clock, Calendar, Badge, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Subscription = () => {
  const { user, profile, isInTrialPeriod } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = () => {
    // This would be replaced with actual Stripe integration
    toast({
      title: "Processando assinatura",
      description: "Esta funcionalidade estará disponível em breve.",
    });
  };

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
          <Card>
            <CardHeader>
              <CardTitle>Status da Assinatura</CardTitle>
              <CardDescription>
                Informações sobre o seu plano atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-6">
                {isInTrialPeriod ? (
                  <>
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Período de Avaliação</h3>
                      <p className="text-gray-500">
                        {profile?.trial_end_date ? 
                          `Restam ${Math.ceil((new Date(profile.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias` : 
                          'Restam 7 dias'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Assinatura Não Ativa</h3>
                      <p className="text-gray-500">
                        Você não possui uma assinatura ativa
                      </p>
                    </div>
                  </>
                )}
              </div>

              {isInTrialPeriod && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">Período de avaliação ativo</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Você está no período de avaliação gratuita. Após o término, será necessário assinar um plano para continuar utilizando o PetGestor.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Tipo de plano</span>
                  <span className="font-medium text-gray-900">
                    {isInTrialPeriod ? "Avaliação" : "Nenhum"}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Data de início</span>
                  <span className="font-medium text-gray-900">
                    {isInTrialPeriod ? new Date().toLocaleDateString('pt-BR') : "-"}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Data de término</span>
                  <span className="font-medium text-gray-900">
                    {isInTrialPeriod ? 
                      (profile?.trial_end_date ? new Date(profile.trial_end_date).toLocaleDateString('pt-BR') : '-') : 
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Próxima cobrança</span>
                  <span className="font-medium text-gray-900">
                    {isInTrialPeriod ? 
                      (profile?.trial_end_date ? new Date(profile.trial_end_date).toLocaleDateString('pt-BR') : '-') : 
                      "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <span className="text-3xl font-bold text-gray-900">R$ 29,90</span>
                <span className="text-gray-500">/mês</span>
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
              <Button 
                className="w-full bg-petblue-600 hover:bg-petblue-700 mb-3"
                onClick={handleSubscribe}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Assinar agora
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Cancele a qualquer momento, sem taxas adicionais
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
