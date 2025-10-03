import { useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { FREE_PLAN_LIMITS, PLAN_LIMIT_LABELS } from '@/constants/plans';
import { cn } from '@/lib/utils';

type LimitKey = keyof typeof FREE_PLAN_LIMITS;

type PlanUsage = Partial<Record<LimitKey, number>>;

interface PlanLimitNoticeProps {
  usage?: PlanUsage;
  className?: string;
}

export function PlanLimitNotice({ usage, className }: PlanLimitNoticeProps) {
  const { profile } = useAuth();

  const limits = useMemo(() =>
    Object.entries(FREE_PLAN_LIMITS).map(([key, limit]) => {
      const typedKey = key as LimitKey;
      const current = usage?.[typedKey] ?? null;
      return {
        key: typedKey,
        label: PLAN_LIMIT_LABELS[typedKey],
        limit,
        current,
        exceeded: current !== null && current >= limit,
      };
    }),
  [usage]);

  if (!profile || profile.plan !== 'free') {
    return null;
  }

  return (
    <Alert className={cn('mb-6 border-amber-200 bg-amber-50 text-amber-900', className)}>
      <AlertTitle>Plano Free: limites ativos</AlertTitle>
      <AlertDescription>
        <p className='text-sm mb-3'>Gerencie seu uso para continuar dentro do plano gratuito. Atualize para o Pro para remover limites e anuncios.</p>
        <ul className='space-y-1 text-sm'>
          {limits.map(({ key, label, limit, current, exceeded }) => (
            <li key={key} className={cn('flex items-center justify-between', exceeded && 'text-red-600 font-medium')}>
              <span>{label}</span>
              <span>{current !== null ? `${current}/${limit}` : `Limite: ${limit}`}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
