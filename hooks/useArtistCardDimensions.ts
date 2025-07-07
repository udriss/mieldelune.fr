import { useState, useEffect } from 'react';

interface ArtistCardDimensionsProps {
  artistNameFontSize: number;
  hasSubTitle: boolean;
  baseContentHeight?: number;
  descriptionLength?: number; // Ajout pour prendre en compte la longueur du texte
}

export const useArtistCardDimensions = ({
  artistNameFontSize,
  hasSubTitle,
  baseContentHeight = 750,
  descriptionLength = 0
}: ArtistCardDimensionsProps) => {
  const [dimensions, setDimensions] = useState({
    artistNameHeight: 0,
    descriptionMaxHeight: 0,
    cardHeight: 400
  });

  useEffect(() => {
    // Calcul de la hauteur du nom d'artiste
    const artistNameLineHeight = Math.ceil(artistNameFontSize * 1.4);
    const artistNameMargin = 16; // mb-4
    const artistNameTotalHeight = artistNameLineHeight + artistNameMargin;

    // Sous-titre si présent
    const subTitleHeight = hasSubTitle ? Math.ceil(artistNameFontSize * 0.6 * 1.4) + 16 : 0;

    // Éléments fixes (padding CardContent + padding Box interne + bouton si présent)
    const cardContentPadding = 48; // 24px * 2 (top + bottom)
    const boxInternalPadding = 32; // 16px * 2 (top + bottom)
    const buttonHeight = 40; // Hauteur approximative du bouton
    const buttonMargin = 16; // margin-bottom de la description
    const fixedElementsHeight = cardContentPadding + boxInternalPadding + buttonHeight + buttonMargin;

    // Calcul des éléments de contenu (nom + sous-titre)
    const contentElementsHeight = artistNameTotalHeight + subTitleHeight;

    // Estimation de la hauteur de la description
    let descriptionHeight = 0;
    if (descriptionLength > 0) {
      const estimatedLines = Math.ceil(descriptionLength / 60); // Plus agressif: 60 caractères par ligne
      descriptionHeight = estimatedLines * 22; // Plus d'espace: 22px par ligne
    }

    // Hauteur totale de la carte = éléments fixes + contenu + description
    let cardHeight = fixedElementsHeight + contentElementsHeight + descriptionHeight;

    // Minimum de 200px seulement s'il y a du contenu
    if (cardHeight > 0) {
      cardHeight = Math.max(200, cardHeight);
    }

    // Pour beaucoup de texte, permettre d'aller jusqu'à 750px
    if (descriptionLength > 400) {
      cardHeight = Math.min(750, Math.max(cardHeight, 600)); // Au moins 600px pour beaucoup de texte
    }

    // Maximum absolu de 800px avec scroll si nécessaire
    if (cardHeight > 800) {
      cardHeight = 800;
    }

    // Si pas de description, la hauteur peut être très petite
    if (descriptionLength === 0) {
      cardHeight = fixedElementsHeight + contentElementsHeight;
    }

    setDimensions({
      artistNameHeight: artistNameTotalHeight,
      descriptionMaxHeight: descriptionHeight,
      cardHeight
    });
  }, [artistNameFontSize, hasSubTitle, baseContentHeight, descriptionLength]);

  return dimensions;
};
