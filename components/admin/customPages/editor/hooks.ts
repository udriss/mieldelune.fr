'use client';

import { useEffect, useState } from 'react';
import { CustomPage } from './types';

// Cache global pour éviter les rechargements de polices
const loadedFonts = new Set<string>();

// Hook optimisé pour charger les Google Fonts
export function useGoogleFont(fontFamily: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman') {
      setIsLoaded(true);
      return;
    }

    // Vérifier si la police est déjà chargée
    if (loadedFonts.has(fontFamily)) {
      setIsLoaded(true);
      return;
    }

    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    let link = document.getElementById(fontId) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
      link.onload = () => {
        loadedFonts.add(fontFamily);
        setIsLoaded(true);
      };
      link.onerror = () => {
        loadedFonts.add(fontFamily); // Marquer comme "chargé" même en cas d'erreur
        setIsLoaded(true);
      };
      document.head.appendChild(link);
    } else {
      loadedFonts.add(fontFamily);
      setIsLoaded(true);
    }
  }, [fontFamily]);

  return isLoaded;
}

// Hook optimisé pour charger toutes les Google Fonts disponibles pour la prévisualisation
export function useAllGoogleFonts() {
  useEffect(() => {
    // Charger seulement les polices les plus utilisées au démarrage
    const essentialFonts = ['Montserrat', 'Roboto', 'Open Sans', 'Poppins', 'Playfair Display'];
    
    essentialFonts.forEach(fontFamily => {
      if (!loadedFonts.has(fontFamily)) {
        const fontId = `google-font-preview-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
        
        if (!document.getElementById(fontId)) {
          const link = document.createElement('link');
          link.id = fontId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
          link.onload = () => loadedFonts.add(fontFamily);
          document.head.appendChild(link);
        }
      }
    });
  }, []);
}

// Hook pour charger une police à la demande
export function useLoadFontOnDemand(fontFamily: string) {
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman' || loadedFonts.has(fontFamily)) {
      return;
    }

    // Charger la police avec un délai pour éviter les appels simultanés
    const timeout = setTimeout(() => {
      const fontId = `google-font-demand-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
        link.onload = () => loadedFonts.add(fontFamily);
        document.head.appendChild(link);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [fontFamily]);
}

// Hook pour charger dynamiquement les Google Fonts du titre
export function useTitleGoogleFont(fontFamily: string) {
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman') {
      return;
    }

    const fontId = `google-font-title-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    let link = document.getElementById(fontId) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
      link.onload = () => loadedFonts.add(fontFamily);
      document.head.appendChild(link);
    }
  }, [fontFamily]);
}

// Hook optimisé pour charger toutes les Google Fonts utilisées dans la page
export function useGoogleFontsForEditor(page: CustomPage) {
  useEffect(() => {
    const fontsToLoad = new Set<string>();
    
    // Ajouter la police du titre si elle existe
    if (page.titleSettings?.fontFamily && page.titleSettings.fontFamily !== 'Arial' && page.titleSettings.fontFamily !== 'Times New Roman') {
      fontsToLoad.add(page.titleSettings.fontFamily);
    }
    
    // Ajouter les polices utilisées dans le contenu
    page.content.forEach(element => {
      if (element.type === 'title' || element.type === 'text') {
        const fontFamily = element.settings?.fontFamily;
        if (fontFamily && fontFamily !== 'Arial' && fontFamily !== 'Times New Roman') {
          fontsToLoad.add(fontFamily);
        }
      }
    });

    // Charger seulement les polices nécessaires avec un délai
    const timeout = setTimeout(() => {
      fontsToLoad.forEach(fontFamily => {
        if (!loadedFonts.has(fontFamily)) {
          const fontId = `google-font-page-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          
          if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
            link.onload = () => loadedFonts.add(fontFamily);
            document.head.appendChild(link);
          }
        }
      });
    }, 50);

    return () => clearTimeout(timeout);
  }, [page.titleSettings?.fontFamily, page.content]);
}

// Fonction pour précharger les polices essentielles dans le head du document
export function preloadEssentialFonts() {
  if (typeof window === 'undefined') return;
  
  const essentialFonts = ['Montserrat', 'Roboto', 'Open Sans', 'Poppins'];
  
  essentialFonts.forEach(fontFamily => {
    if (!loadedFonts.has(fontFamily)) {
      const linkId = `preload-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      
      if (!document.getElementById(linkId)) {
        // Créer un link de préchargement
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'style';
        preloadLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
        preloadLink.id = linkId;
        document.head.appendChild(preloadLink);
        
        // Créer le link stylesheet avec un délai
        setTimeout(() => {
          const stylesheetLink = document.createElement('link');
          stylesheetLink.rel = 'stylesheet';
          stylesheetLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
          stylesheetLink.id = `stylesheet-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
          stylesheetLink.onload = () => loadedFonts.add(fontFamily);
          document.head.appendChild(stylesheetLink);
        }, 50);
      }
    }
  });
}
