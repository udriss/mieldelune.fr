const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error fetching IP:', error);
      return '';
    }
  };

const createCanvasFingerprint = () => {
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = '#069';
    ctx.fillText('Hello, world!', 2, 15);
    
    return canvas.toDataURL();
  };

// Fonction pour tracker les pages visitées
export const trackPageVisit = (page: string, connectionId?: string) => {
  if (typeof window === 'undefined') return;

  const currentConnectionId = connectionId || localStorage.getItem('currentConnectionId');
  if (!currentConnectionId) return;

  const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
  
  if (!pageVisits[currentConnectionId]) {
    pageVisits[currentConnectionId] = [];
  }

  // Enregistrer la visite
  const visit = {
    page,
    timestamp: Date.now(),
    referrer: document.referrer,
    duration: 0
  };

  // Calculer la durée de la page précédente si elle existe
  const previousVisits = pageVisits[currentConnectionId];
  if (previousVisits.length > 0) {
    const lastVisit = previousVisits[previousVisits.length - 1];
    lastVisit.duration = Date.now() - lastVisit.timestamp;
  }

  pageVisits[currentConnectionId].push(visit);
  localStorage.setItem('pageVisits', JSON.stringify(pageVisits));

  // Mettre à jour la session
  updateSessionData(currentConnectionId);
};

// Fonction pour mettre à jour les données de session
const updateSessionData = (connectionId: string) => {
  const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
  
  if (!sessionData[connectionId]) {
    sessionData[connectionId] = {
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageCount: 0,
      totalDuration: 0
    };
  }

  const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
  const visits = pageVisits[connectionId] || [];
  
  sessionData[connectionId].lastActivity = Date.now();
  sessionData[connectionId].pageCount = visits.length;
  
  if (visits.length > 0) {
    const firstVisit = Math.min(...visits.map((v: any) => v.timestamp));
    sessionData[connectionId].totalDuration = Date.now() - firstVisit;
  }

  localStorage.setItem('sessionData', JSON.stringify(sessionData));
};

// Fonction pour capturer les interactions utilisateur
export const trackUserInteraction = (interactionType: string, details?: any) => {
  if (typeof window === 'undefined') return;

  const currentConnectionId = localStorage.getItem('currentConnectionId');
  if (!currentConnectionId) return;

  const interactions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
  
  if (!interactions[currentConnectionId]) {
    interactions[currentConnectionId] = [];
  }

  interactions[currentConnectionId].push({
    type: interactionType,
    timestamp: Date.now(),
    page: window.location.pathname,
    details: details || {}
  });

  // Garder seulement les 100 dernières interactions par session
  if (interactions[currentConnectionId].length > 100) {
    interactions[currentConnectionId] = interactions[currentConnectionId].slice(-100);
  }

  localStorage.setItem('userInteractions', JSON.stringify(interactions));
};

// Fonction pour détecter les informations avancées du navigateur
const getAdvancedBrowserInfo = () => {
  const nav = navigator as any;
  const win = window as any;
  
  return {
    // Informations sur la connexion
    connection: nav.connection ? {
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
      saveData: nav.connection.saveData
    } : null,
    
    // Informations sur la mémoire
    memory: nav.deviceMemory || null,
    
    // Nombre de cœurs logiques
    hardwareConcurrency: nav.hardwareConcurrency || null,
    
    // Informations sur la batterie (deprecated mais peut être disponible)
    battery: nav.battery ? {
      charging: nav.battery.charging,
      level: nav.battery.level
    } : null,
    
    // Permissions
    permissions: nav.permissions ? true : false,
    
    // Service Worker support
    serviceWorker: 'serviceWorker' in nav,
    
    // WebGL info
    webgl: getWebGLInfo(),
    
    // Cookie enabled
    cookieEnabled: nav.cookieEnabled,
    
    // Do Not Track
    doNotTrack: nav.doNotTrack || win.doNotTrack || nav.msDoNotTrack,
    
    // Platform info
    platform: nav.platform,
    product: nav.product,
    
    // Touch support
    maxTouchPoints: nav.maxTouchPoints || 0
  };
};

// Fonction pour obtenir les informations WebGL
const getWebGLInfo = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
    };
  } catch (e) {
    return null;
  }
};

// Fonction pour obtenir les informations de performance
const getPerformanceInfo = () => {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    // Temps de chargement de la page
    pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : null,
    
    // Temps jusqu'au premier contenu
    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : null,
    
    // Temps de réponse du serveur
    serverResponseTime: navigation ? navigation.responseEnd - navigation.requestStart : null,
    
    // Mémoire utilisée (si disponible)
    memory: (window.performance as any).memory ? {
      usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit
    } : null
  };
};
  
  export const generateFingerprint = async () => {

    if (typeof window === 'undefined') return '';

    const ip = await getClientIP();
    const advancedInfo = getAdvancedBrowserInfo();
    const performanceInfo = getPerformanceInfo();
  
    const deviceInfo = {
        userIp: ip,
        userAgent: navigator?.userAgent || '',
        language: navigator?.language || '',
        screen: `${window?.screen?.width || 0}x${window?.screen?.height || 0}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        // Nouvelles informations
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: window.screen?.colorDepth || null,
        pixelRatio: window.devicePixelRatio || 1,
        touchSupport: advancedInfo.maxTouchPoints > 0,
        advanced: advancedInfo,
        performance: performanceInfo,
        sessionStart: Date.now()
    };

    // Store connection info
    const connections = JSON.parse(localStorage.getItem('connections') || '[]');
    const connectionId = Math.random().toString(36).substring(2, 11);
    
    connections.push({
      deviceInfo,
      timestamp: Date.now(),
      id: connectionId
    });
    
    localStorage.setItem('connections', JSON.stringify(connections));
    localStorage.setItem('currentConnectionId', connectionId);

    // Initialiser le suivi de cette session
    trackPageVisit(window.location.pathname, connectionId);

    // Configurer les événements de suivi
    setupPageTracking(connectionId);

    return btoa(JSON.stringify(deviceInfo));
  };

// Configuration du suivi des pages et interactions
const setupPageTracking = (connectionId: string) => {
  if (typeof window === 'undefined') return;

  // Suivi des clics
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    trackUserInteraction('click', {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      text: target.textContent?.substring(0, 50)
    });
  });

  // Suivi du scroll
  let scrollTimeout: NodeJS.Timeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      trackUserInteraction('scroll', {
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      });
    }, 1000);
  });

  // Suivi du redimensionnement
  window.addEventListener('resize', () => {
    trackUserInteraction('resize', {
      newSize: `${window.innerWidth}x${window.innerHeight}`
    });
  });

  // Suivi de la visibilité de la page
  document.addEventListener('visibilitychange', () => {
    trackUserInteraction('visibility', {
      hidden: document.hidden,
      visibilityState: document.visibilityState
    });
  });

  // Suivi avant la fermeture de la page
  window.addEventListener('beforeunload', () => {
    // Mettre à jour la durée de la dernière page visitée
    const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
    const visits = pageVisits[connectionId];
    
    if (visits && visits.length > 0) {
      const lastVisit = visits[visits.length - 1];
      lastVisit.duration = Date.now() - lastVisit.timestamp;
      localStorage.setItem('pageVisits', JSON.stringify(pageVisits));
    }
  });

  // Heartbeat pour maintenir la session active
  setInterval(() => {
    updateSessionData(connectionId);
  }, 30000); // Toutes les 30 secondes
};