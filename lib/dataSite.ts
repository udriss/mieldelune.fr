/**
 * Interface pour les données du si  gradularVariation?: number; // variation de taille des granules (0-100)
  showWeddingLocation?: boolean; // Afficher ou non la localisation sur les cartes de mariage
  showWeddingDescription?: boolean; // Afficher ou non la description sur les cartes de mariage
  // Paramètres de police par page
  pageSettings?: {
    [pageName: string]: {
      fontFamily?: string;
      fontSize?: number;
      titleFontSize?: number;
      artistNameFontSize?: number;
    };
  }; * Les données réelles sont maintenant stockées dans siteData.json
 */
export interface SiteData {
  titleSite: string;
  descriptionSite: string;
  dynamicElements?: string[];
  dynamicElements1?: string[];
  dynamicElements2?: string[];
  dynamicElements3?: string[];
  animationStyles?: {
    default: string;
    type1: string;
    type2: string;
    type3: string;
  };
  // Personnalisation ajoutée
  theme?: string;
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontSizePx?: number;
  layout?: string;
  buttonShape?: string;
  iconStyle?: string;
  widgetCountdown?: boolean;
  widgetPlaylist?: boolean;
  widgetGuestbook?: boolean;
  widgetMap?: boolean;
  gradientType?: string; // 'linear' | 'radial' | 'conic' | 'granular'
  gradientColors?: string[]; // jusqu'à 4 couleurs hexadécimales
  gradientAngle?: number | string; // angle en degrés pour linear/conic
  gradientCenter?: string; // ex: '50% 50%' pour radial/conic
  gradientStops?: number[] | string; // positions des couleurs (0-100)
  // Paramètres pour l'effet granulé
  granularBaseColor?: string; // couleur de base pour l'effet granulé
  granularGranuleSize?: number; // taille moyenne des granules (1-50)
  granularDensity?: number; // densité des granules (1-100)
  granularVariation?: number; // variation de taille des granules (0-100)
  showWeddingLocation?: boolean; // Afficher ou non la localisation sur les cartes de mariage
  showWeddingDescription?: boolean; // Afficher ou non la description sur les cartes de mariage
}

/**
 * Note: Les données réelles sont maintenant stockées dans /lib/siteData.json
 * Ce fichier fournit uniquement l'interface TypeScript pour le typage
 */

