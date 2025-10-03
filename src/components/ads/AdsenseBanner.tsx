import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdsenseBannerProps {
  slot?: string;
  className?: string;
  style?: CSSProperties;
}

export function AdsenseBanner({ slot, className, style }: AdsenseBannerProps) {
  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  const resolvedSlot = slot?.trim();
  const adRef = useRef<HTMLElement | null>(null);
  const isConfigured = Boolean(clientId && resolvedSlot);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    if (!document.querySelector('script[data-adsbygoogle-client]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-adsbygoogle-client', 'true');
      document.head.appendChild(script);
    }
  }, [isConfigured, clientId]);

  useEffect(() => {
    if (!isConfigured || !adRef.current) {
      return;
    }

    try {
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn('AdSense render error', error);
    }
  }, [isConfigured, clientId, resolvedSlot]);

  if (!isConfigured) {
    return (
      <div className={cn('rounded-md border border-dashed border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800', className)}>
        Configure VITE_ADSENSE_CLIENT_ID e forneca um slot valido para exibir anuncios no plano Free.
      </div>
    );
  }

  return (
    <div className={cn('w-full flex justify-center', className)}>
      <ins
        ref={(element) => { adRef.current = element; }}
        className='adsbygoogle block w-full'
        style={{ display: 'block', minHeight: 90, ...style }}
        data-ad-client={clientId}
        data-ad-slot={resolvedSlot}
        data-ad-format='auto'
        data-full-width-responsive='true'
      />
    </div>
  );
}
