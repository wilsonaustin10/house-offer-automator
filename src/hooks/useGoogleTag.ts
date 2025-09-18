import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const useGoogleTag = () => {
  const googleTagId = import.meta.env.VITE_GOOGLE_TAG_ID;
  const conversionLabel = import.meta.env.VITE_GOOGLE_CONVERSION_LABEL;

  useEffect(() => {
    if (!googleTagId) {
      console.warn('Google Tag ID not found in environment variables');
      return;
    }

    // Initialize gtag if not already present
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer?.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', googleTagId);
    }
  }, [googleTagId]);

  const trackConversion = (value?: number, currency: string = 'USD') => {
    if (!window.gtag || !googleTagId || !conversionLabel) {
      console.warn('Google Tag or conversion tracking not properly configured');
      return;
    }

    try {
      window.gtag('event', 'conversion', {
        send_to: `${googleTagId}/${conversionLabel}`,
        value: value,
        currency: currency,
      });
      
      if (import.meta.env.DEV) {
        console.log('Conversion tracked:', {
          tag_id: googleTagId,
          conversion_label: conversionLabel,
          value,
          currency
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  };

  return {
    trackConversion,
    isConfigured: !!(googleTagId && conversionLabel)
  };
};