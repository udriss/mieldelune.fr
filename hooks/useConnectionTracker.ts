'use client';

import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { usePathname } from 'next/navigation';
import { Connection, PageVisit } from '@/types/connections';

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('mieldeLuneSessionId');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('mieldeLuneSessionId', sessionId);
  }
  return sessionId;
};

export function useConnectionTracker() {
  const pathname = usePathname();

  const track = useCallback(async () => {
    const sessionId = getSessionId();
    
    const pageVisit: PageVisit = {
      page: pathname,
      timestamp: Date.now(),
      referrer: document.referrer,
    };

    const connectionData: Partial<Connection> = {
      id: sessionId,
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        // IP will be added server-side
        userIp: '', 
      },
      pagesVisited: [pageVisit],
    };

    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectionData),
      });
    } catch (error) {
      console.error('Error tracking connection:', error);
    }
  }, [pathname]);

  useEffect(() => {
    // Don't track admin pages to avoid noise
    if (pathname.startsWith('/admin')) {
      return;
    }

    // Track after a short delay to ensure all page elements are loaded
    const timer = setTimeout(() => {
      track();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, track]);
}
