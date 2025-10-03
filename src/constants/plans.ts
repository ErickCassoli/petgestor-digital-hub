export const FREE_PLAN_LIMITS = {
  pets: 10,
  appointmentsPerMonth: 15,
  products: 20,
  services: 5,
} as const;

export type SubscriptionPlan = 'free' | 'pro';

export const PLAN_DESCRIPTIONS: Record<SubscriptionPlan, { label: string; summary: string }> = {
  free: {
    label: 'Free',
    summary: 'Plano gratuito com limites para pets, agendamentos mensais, produtos e servicos. Exibe anuncios.'
  },
  pro: {
    label: 'Pro',
    summary: 'Plano completo sem limites de uso e sem anuncios.'
  }
};

export const PLAN_LIMIT_LABELS: Record<keyof typeof FREE_PLAN_LIMITS, string> = {
  pets: 'Pets cadastrados',
  appointmentsPerMonth: 'Agendamentos no mes',
  products: 'Itens no estoque',
  services: 'Servicos cadastrados',
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: [
    'Ate 10 pets cadastrados',
    'Ate 15 agendamentos por mes',
    'Ate 20 itens de estoque',
    'Ate 5 servicos ativos',
    'Monetizacao com anuncios AdSense',
  ],
  pro: [
    'Cadastro ilimitado de pets, agendamentos, estoque e servicos',
    'Sem anuncios para seus usuarios',
    'Suporte prioritario',
    'Atualizacoes constantes inclusas',
  ],
};
