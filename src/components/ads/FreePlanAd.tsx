import { AdsenseBanner } from './AdsenseBanner';
import { useAuth } from '@/contexts/AuthContext';

interface FreePlanAdProps {
  slot: string;
  className?: string;
}

export function FreePlanAd({ slot, className }: FreePlanAdProps) {
  const { profile } = useAuth();

  if (!profile || profile.plan !== 'free') {
    return null;
  }

  return <AdsenseBanner slot={slot} className={className} />;
}
