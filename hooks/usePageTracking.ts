import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageVisit } from '@/lib/fingerprint';

/**
 * Hook pour tracker automatiquement les changements de page
 */
export const usePageTracking = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Tracker la visite de page
    if (pathname) {
      trackPageVisit(pathname);
    }
  }, [pathname]);

  return {
    trackPageVisit: (customPath?: string) => {
      const path = customPath || pathname;
      if (path) {
        trackPageVisit(path);
      }
    }
  };
};

/**
 * Hook pour mesurer le temps passé sur une page
 */
export const usePageDuration = () => {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      
      // Stocker la durée de la page
      const currentConnectionId = localStorage.getItem('currentConnectionId');
      if (currentConnectionId) {
        const pageDurations = JSON.parse(localStorage.getItem('pageDurations') || '{}');
        
        if (!pageDurations[currentConnectionId]) {
          pageDurations[currentConnectionId] = {};
        }
        
        const currentPage = window.location.pathname;
        if (!pageDurations[currentConnectionId][currentPage]) {
          pageDurations[currentConnectionId][currentPage] = [];
        }
        
        pageDurations[currentConnectionId][currentPage].push({
          timestamp: startTime,
          duration
        });
        
        localStorage.setItem('pageDurations', JSON.stringify(pageDurations));
      }
    };
  }, []);
};

/**
 * Hook pour tracker les interactions utilisateur
 */
export const useInteractionTracking = () => {
  useEffect(() => {
    const trackClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Tracker seulement les clics sur les éléments interactifs
      if (target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.onclick || 
          target.getAttribute('role') === 'button') {
        
        const currentConnectionId = localStorage.getItem('currentConnectionId');
        if (currentConnectionId) {
          const interactions = JSON.parse(localStorage.getItem('interactions') || '{}');
          
          if (!interactions[currentConnectionId]) {
            interactions[currentConnectionId] = [];
          }
          
          interactions[currentConnectionId].push({
            type: 'click',
            element: target.tagName,
            className: target.className,
            id: target.id,
            text: target.textContent?.substring(0, 30),
            timestamp: Date.now(),
            page: window.location.pathname
          });
          
          // Garder seulement les 50 dernières interactions
          if (interactions[currentConnectionId].length > 50) {
            interactions[currentConnectionId] = interactions[currentConnectionId].slice(-50);
          }
          
          localStorage.setItem('interactions', JSON.stringify(interactions));
        }
      }
    };

    document.addEventListener('click', trackClick);
    
    return () => {
      document.removeEventListener('click', trackClick);
    };
  }, []);
};
