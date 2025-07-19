'use client';

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import { NextUIProvider } from '@nextui-org/react';
import { NavbarClient } from '@/components/nav/navbar-client';
import { Footer } from '@/components/footer';
import { ScrollToTopButton } from '@/components/scroll-top';
import { useEffect, useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { myFetch } from '@/lib/fetch-wrapper';
import { ThemeProvider } from '@/components/layout/theme-provider';
import ConnectionTracker from '@/components/utils/ConnectionTracker';
import { Analytics } from '@vercel/analytics/react';
// Ajout des hooks de tracking
import { usePageTracking, usePageDuration, useInteractionTracking } from '@/hooks/usePageTracking';
import { generateFingerprint } from '@/lib/fingerprint';

export const SiteSettingsContext = createContext<any>(null);
export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const pathname = usePathname();

  // Activer le tracking des pages
  usePageTracking();
  usePageDuration();
  useInteractionTracking();

  // Fonction pour déterminer quelle page correspond au pathname
  const getCurrentPageName = (path: string): string => {
    // Normaliser le path en supprimant le slash final
    const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    
    if (normalizedPath === '' || normalizedPath === '/') return 'Accueil';
    if (normalizedPath === '/contact') return 'Contact';
    if (normalizedPath === '/artiste') return 'Profil';
    // Ajouter aussi les pages avec paramètres
    if (normalizedPath.startsWith('/mariage/')) return 'Accueil'; // Les pages de mariage comptent comme Accueil
    return 'Autre'; // Pour les autres pages
  };

  // Initialiser le fingerprinting au montage du composant
  useEffect(() => {
    const initTracking = async () => {
      try {
        await generateFingerprint();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du tracking:', error);
      }
    };

    // Initialiser seulement si on n'a pas déjà une session active
    if (!localStorage.getItem('currentConnectionId')) {
      initTracking();
    }
  }, []);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await myFetch('/api/siteSettings');
        const data = await res.json();
        if (data.success) setSiteSettings(data.site);
      } catch (e) {}
    }
    fetchSettings();
  }, []);

  // Effet granulé - gérer les granules avec useEffect
  useEffect(() => {
    if (!siteSettings || siteSettings.gradientType !== 'granular') {
      // Nettoyer les granules existantes si on change de type
      const existingContainer = document.getElementById('granular-container');
      const existingAnimations = document.getElementById('granular-animations');
      if (existingContainer) existingContainer.remove();
      if (existingAnimations) existingAnimations.remove();
      return;
    }

    const baseColor = siteSettings.granularBaseColor || '#f9d3e0';
    const granuleSize = Number(siteSettings.granularGranuleSize) || 15;
    const density = Number(siteSettings.granularDensity) || 40;
    const variation = Number(siteSettings.granularVariation) || 30;

    // Fonction pour parser les couleurs RGBA et HEX
    const parseColor = (color: string): {r: number, g: number, b: number, a: number} => {
      if (color.startsWith('rgba')) {
        const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (match) {
          return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a: parseFloat(match[4]) };
        }
      } else if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]), a: 1 };
        }
      } else if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        return {
          r: parseInt(hex.substr(0, 2), 16),
          g: parseInt(hex.substr(2, 2), 16),
          b: parseInt(hex.substr(4, 2), 16),
          a: 1
        };
      }
      return { r: 249, g: 211, b: 224, a: 1 }; // fallback
    };

    const baseRgb = parseColor(baseColor);

    // Supprimer les anciennes granules
    const existingContainer = document.getElementById('granular-container');
    const existingAnimations = document.getElementById('granular-animations');
    if (existingContainer) existingContainer.remove();
    if (existingAnimations) existingAnimations.remove();

    // Créer un conteneur pour les granules
    const container = document.createElement('div');
    container.id = 'granular-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: -1;
    `;

    // Générer les granules
    const numGranules = Math.floor((density / 100) * 200);
    
    // Créer les animations CSS
    const style = document.createElement('style');
    style.id = 'granular-animations';
    let animations = '';

    for (let i = 0; i < numGranules; i++) {
      const granule = document.createElement('div');
      
      // Position aléatoire
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      // Taille avec variation
      const sizeVar = (Math.random() - 0.5) * (variation / 100) * granuleSize;
      const finalSize = Math.max(2, granuleSize + sizeVar);
      
      // Variations de couleur plus contrastées
      const hueShift = (Math.random() - 0.5) * 60; // ±30° de variation
      const satShift = (Math.random() - 0.5) * 0.4; // ±20% de variation
      const lightShift = (Math.random() - 0.5) * 0.6; // ±30% de variation
      
      // Convertir en HSL pour les variations
      const hsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
      const newHsl = {
        h: Math.max(0, Math.min(360, hsl.h + hueShift)),
        s: Math.max(0.1, Math.min(1, hsl.s + satShift)),
        l: Math.max(0.2, Math.min(0.8, hsl.l + lightShift))
      };
      const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
      
      // Opacité plus visible
      const opacity = 0.4 + Math.random() * 0.6;
      
      // Ombres plus prononcées
      const shadowX = (Math.random() - 0.5) * 6;
      const shadowY = (Math.random() - 0.5) * 6;
      const shadowBlur = 2 + Math.random() * 6;
      const shadowOpacity = 0.1 + Math.random() * 0.5;
      
      // Style du granule
      granule.style.cssText = `
        position: absolute;
        left: ${x}vw;
        top: ${y}vh;
        width: ${finalSize}px;
        height: ${finalSize}px;
        background: rgba(${Math.round(newRgb.r)}, ${Math.round(newRgb.g)}, ${Math.round(newRgb.b)}, ${opacity});
        border-radius: 50%;
        box-shadow: 
          ${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}),
          inset 0 0 ${finalSize * 0.2}px rgba(255, 255, 255, 0.4),
          0 0 ${finalSize * 0.5}px rgba(${Math.round(newRgb.r)}, ${Math.round(newRgb.g)}, ${Math.round(newRgb.b)}, 0.3);
        animation: granuleFloat${i} ${15 + Math.random() * 20}s infinite ease-in-out;
        animation-delay: ${Math.random() * 5}s;
      `;
      
      // Créer l'animation pour ce granule
      const moveRange = 15 + Math.random() * 25;
      const scaleMin = 0.6 + Math.random() * 0.3;
      const scaleMax = 1.2 + Math.random() * 0.4;
      
      animations += `
        @keyframes granuleFloat${i} {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg); 
            opacity: ${opacity};
          }
          25% { 
            transform: translate(${(Math.random() - 0.5) * moveRange}px, ${(Math.random() - 0.5) * moveRange}px) scale(${scaleMin}) rotate(${Math.random() * 360}deg);
            opacity: ${opacity * 0.7};
          }
          50% { 
            transform: translate(${(Math.random() - 0.5) * moveRange * 1.5}px, ${(Math.random() - 0.5) * moveRange * 1.5}px) scale(${scaleMax}) rotate(${Math.random() * 360}deg);
            opacity: ${opacity * 1.2};
          }
          75% { 
            transform: translate(${(Math.random() - 0.5) * moveRange * 0.8}px, ${(Math.random() - 0.5) * moveRange * 0.8}px) scale(${scaleMin + 0.2}) rotate(${Math.random() * 360}deg);
            opacity: ${opacity * 0.9};
          }
        }
      `;
      
      container.appendChild(granule);
    }
    
    style.textContent = animations;
    document.head.appendChild(style);
    document.body.appendChild(container);

    // Nettoyage
    return () => {
      const containerToRemove = document.getElementById('granular-container');
      const animationsToRemove = document.getElementById('granular-animations');
      if (containerToRemove) containerToRemove.remove();
      if (animationsToRemove) animationsToRemove.remove();
    };
  }, [siteSettings?.gradientType, siteSettings?.granularBaseColor, siteSettings?.granularGranuleSize, siteSettings?.granularDensity, siteSettings?.granularVariation]);

  useEffect(() => {
    if (!siteSettings) return;

    // Appliquer les styles globaux au body
    document.body.dataset.theme = siteSettings.theme || 'clair';
    
    // Gestion spécifique pour la page d'admin
    if (pathname?.startsWith('/admin')) {
      // Pour la page d'admin, s'assurer que le body n'interfère pas avec le scroll
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      return;
    } else {
      // Pour les autres pages, permettre le scroll normal
      document.body.style.overflow = 'visible';
      document.body.style.height = 'auto';
    }

    // Couleur principale (convertie en HSL pour Tailwind)
    if (siteSettings.primaryColor) {
      const hsl = hexToHSL(siteSettings.primaryColor);
      document.documentElement.style.setProperty('--primary', hsl);
    }

    // Police et taille - Configuration par page
    const currentPage = getCurrentPageName(pathname || '/');
    const pageSettings = siteSettings.pageSettings 
      ? (typeof siteSettings.pageSettings === 'string' 
          ? JSON.parse(siteSettings.pageSettings) 
          : siteSettings.pageSettings)
      : {};
    
    const currentPageConfig = pageSettings[currentPage];
    
    // Debug logs
    
    
    
    
        
    if (currentPageConfig) {
      // Appliquer la police spécifique à cette page
      if (currentPageConfig.fontFamily) {
        const font = currentPageConfig.fontFamily;
        const googleFonts = [
          'Montserrat', 'Dancing Script', 'Roboto', 'Playfair Display',
          'Lora', 'Pacifico', 'Great Vibes', 'Satisfy', 'Allura', 'Parisienne'
        ];
        if (googleFonts.includes(font)) {
          const id = 'dynamic-google-font';
          let link = document.getElementById(id) as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = `https://fonts.googleapis.com/css?family=${encodeURIComponent(font)}:400,700&display=swap`;
        }

        // Créer des styles CSS spécifiques par page
        const pageStyleId = `page-${currentPage}-styles`;
        let pageStyleElement = document.getElementById(pageStyleId);
        if (!pageStyleElement) {
          pageStyleElement = document.createElement('style');
          pageStyleElement.id = pageStyleId;
          document.head.appendChild(pageStyleElement);
        }

        // Définir les classes CSS selon la page
        let cssContent = '';
        if (currentPage === 'Accueil') {
          // Pour la page d'accueil, seul le PageHeader est impacté
          cssContent = `
            .page-header-accueil {
              font-family: '${font}', sans-serif !important;
              font-size: ${currentPageConfig.fontSize}px !important;
            }
            .page-header-accueil * {
              font-family: inherit !important;
              font-size: inherit !important;
            }
            .site-title.page-header-accueil,
            .site-title.page-header-accueil.MuiTypography-root {
              font-size: ${currentPageConfig.titleFontSize || currentPageConfig.fontSize}px !important;
            }
          `;
          
          // Ajouter aussi les styles pour les albums si configurés
          const albumsConfig = pageSettings['Albums'];
          if (albumsConfig) {
            cssContent += `
              .page-content-albums,
              .page-content-albums.MuiTypography-root {
                font-family: '${albumsConfig.fontFamily}', sans-serif !important;
                font-size: ${albumsConfig.fontSize}px !important;
              }
            `;
          }
        } else if (currentPage === 'Contact') {
          // Pour la page Contact
          // cssContent = `
          //   .page-content-contact {
          //     font-family: '${font}', sans-serif !important;
          //     font-size: ${currentPageConfig.fontSize}px !important;
          //   }
          //   .page-content-contact * {
          //     font-family: inherit !important;
          //     font-size: inherit !important;
          //   }
         //  `;
        } else if (currentPage === 'Profil') {
          // Pour la page Profil (artiste) - renforcé pour Material-UI
          cssContent = `
            .page-content-profil,
            .page-content-profil.MuiTypography-root,
            .page-content-profil.MuiButton-root {
              font-family: '${font}', sans-serif !important;
              font-size: ${currentPageConfig.fontSize}px !important;
            }
            .page-content-profil *,
            .page-content-profil.MuiTypography-root *,
            .page-content-profil.MuiButton-root * {
              font-family: inherit !important;
              font-size: inherit !important;
            }
            .artist-name.page-content-profil,
            .artist-name.page-content-profil.MuiTypography-root {
              font-size: ${currentPageConfig.artistNameFontSize || currentPageConfig.fontSize}px !important;
            }
          `;
        } else {
          // Pour les autres pages, appliquer sur le contenu principal
          cssContent = `
            .page-content-${currentPage.toLowerCase()} {
              font-family: '${font}', sans-serif !important;
              font-size: ${currentPageConfig.fontSize}px !important;
            }
            .page-content-${currentPage.toLowerCase()} * {
              font-family: inherit !important;
              font-size: inherit !important;
            }
          `;
        }

        pageStyleElement.textContent = cssContent;
        
      }
    } else {
      // Nettoyer les styles spécifiques si pas de configuration
      const pageStyleId = `page-${currentPage}-styles`;
      const existingStyle = document.getElementById(pageStyleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      
    }

  }, [siteSettings, pathname]);

  // Convertit une couleur hexadécimale en HSL (format: "h s% l%") pour Tailwind
  function hexToHSL(hex: string): string {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    return `${h} ${s}% ${l}%`;
  }

  // Génère le CSS du gradient principal selon les settings admin (angle, centre, stops)
  function getMainGradient(): string | undefined {
    if (!siteSettings?.gradientType || !siteSettings?.gradientColors) return undefined;
    
    if (siteSettings.gradientType === 'granular') {
      // Pour l'effet granulé, on retourne la couleur de base
      return siteSettings.granularBaseColor || '#f9d3e0';
    }
    
    let colors = siteSettings.gradientColors;
    if (typeof colors === 'string') {
      try { colors = JSON.parse(colors); } catch { colors = [siteSettings.primaryColor || '#ff8647', '#7c3aed']; }
    }
    if (!Array.isArray(colors) || colors.length < 1) return undefined;
    if (siteSettings.gradientType === 'none') {
      return colors[0]; // fond uni
    }
    let stops = siteSettings.gradientStops;
    if (typeof stops === 'string') {
      try { stops = JSON.parse(stops); } catch { stops = undefined; }
    }
    const colorStops = Array.isArray(stops) && stops.length === colors.length
      ? colors.map((c, i) => `${c} ${stops[i]}%`).join(', ')
      : colors.join(', ');
    switch (siteSettings.gradientType) {
      case 'radial':
        return `radial-gradient(circle at ${siteSettings.gradientCenter || '50% 50%'}, ${colorStops})`;
      case 'conic':
        return `conic-gradient(from ${siteSettings.gradientAngle || 120}deg at ${siteSettings.gradientCenter || '50% 50%'}, ${colorStops})`;
      case 'linear':
      default:
        return `linear-gradient(${siteSettings.gradientAngle || 120}deg, ${colorStops})`;
    }
  }

  // Fonction utilitaire pour convertir RGB en HSL
  function rgbToHsl(r: number, g: number, b: number): {h: number, s: number, l: number} {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: h * 360,
      s: s,
      l: l
    };
  }

  // Fonction utilitaire pour convertir HSL en RGB
  function hslToRgb(h: number, s: number, l: number): {r: number, g: number, b: number} {
    h /= 360;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  return (
    <html lang="fr">
      <head>
        <meta property="og:title" content="MielDeLune – Photographe Mariage & Événement" />
        <meta property="og:description" content="Photographe professionnel spécialisé dans les mariages et événements prestigieux. Découvrez nos galeries et réservez en ligne." />
        <meta property="og:image" content="https://mieldelune.fr/og-image.jpg" />
        <meta property="og:url" content="https://mieldelune.fr" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MielDeLune – Photographe Mariage & Événement" />
        <meta name="twitter:description" content="Photographe professionnel spécialisé dans les mariages et événements prestigieux." />
        <meta name="twitter:image" content="https://mieldelune.fr/og-image.jpg" />
      </head>
      <body style={getMainGradient() ? { 
        background: getMainGradient(), 
        overflow: pathname?.startsWith('/admin') ? 'auto' : 'visible' 
      } : { 
        overflow: pathname?.startsWith('/admin') ? 'auto' : 'visible' 
      }}>
        <SiteSettingsContext.Provider value={siteSettings}>
          <ThemeProvider>
            <NextUIProvider>
              {!pathname?.startsWith('/admin') && <NavbarClient />}
              <section className={`pt-6 m-0 pt-8 flex flex-col items-center justify-start w-full ${pathname?.startsWith('/admin') ? 'pt-0' : ''}`}>
                {children}
              </section>
              {!pathname?.startsWith('/admin') && <Footer />}
              {!pathname?.startsWith('/admin') && <ScrollToTopButton />}
              <ConnectionTracker />
              <ToastContainer 
                position="top-center" 
                autoClose={2000} 
                hideProgressBar 
                newestOnTop 
                closeOnClick 
                rtl={false} 
                pauseOnFocusLoss 
                draggable 
                pauseOnHover 
                theme="dark"
                style={{ fontSize: 16 }}
              />
              <Analytics />
              {/* <SpeedInsights /> */}
            </NextUIProvider>
          </ThemeProvider>
        </SiteSettingsContext.Provider>
      </body>
    </html>
  );
}

