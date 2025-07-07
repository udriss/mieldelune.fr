'use client'

import { useState, useEffect, useRef } from 'react';
import { type SiteData } from '@/lib/dataSite';
import { myFetch } from '@/lib/fetch-wrapper';
import { Box, Typography } from '@mui/material';

// Nouveau composant pour gérer le texte dynamique avec animation
function DynamicTextCycler({ 
  text, 
  dynamicElements,
  dynamicElements1,
  dynamicElements2,
  dynamicElements3,
  animationStyles
}: { 
  text: string, 
  dynamicElements?: string[],
  dynamicElements1?: string[],
  dynamicElements2?: string[],
  dynamicElements3?: string[],
  animationStyles?: {
    default: string;
    type1: string;
    type2: string;
    type3: string;
  }
}) {
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [currentElement1Index, setCurrentElement1Index] = useState(0);
  const [currentElement2Index, setCurrentElement2Index] = useState(0);
  const [currentElement3Index, setCurrentElement3Index] = useState(0);
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTransitioning1, setIsTransitioning1] = useState(false);
  const [isTransitioning2, setIsTransitioning2] = useState(false);
  const [isTransitioning3, setIsTransitioning3] = useState(false);
  
  // Références pour stopper les animations lors du démontage du composant
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const interval1Ref = useRef<NodeJS.Timeout | null>(null);
  const interval2Ref = useRef<NodeJS.Timeout | null>(null);
  const interval3Ref = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction pour configurer l'animation de rotation des mots
  const setupAnimation = (
    elementsArray: string[] | undefined, 
    setIndex: React.Dispatch<React.SetStateAction<number>>,
    setTransition: React.Dispatch<React.SetStateAction<boolean>>,
    intervalRefObj: React.MutableRefObject<NodeJS.Timeout | null>,
    delay: number
  ) => {
    if (!elementsArray || elementsArray.length === 0) return;
    
    intervalRefObj.current = setInterval(() => {
      setTransition(true);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % elementsArray.length);
        setTransition(false);
      }, 500); // Temps de transition de sortie
    }, delay);
    
    return () => {
      if (intervalRefObj.current) {
        clearInterval(intervalRefObj.current);
      }
    };
  };
  
  useEffect(() => {
    // Configurer les animations avec des délais différents pour éviter la synchronisation
    const cleanup1 = setupAnimation(dynamicElements, setCurrentElementIndex, setIsTransitioning, intervalRef, 3000);
    const cleanup2 = setupAnimation(dynamicElements1, setCurrentElement1Index, setIsTransitioning1, interval1Ref, 3500);
    const cleanup3 = setupAnimation(dynamicElements2, setCurrentElement2Index, setIsTransitioning2, interval2Ref, 4000);
    const cleanup4 = setupAnimation(dynamicElements3, setCurrentElement3Index, setIsTransitioning3, interval3Ref, 4500);
    
    // Nettoyage à la fin
    return () => {
      cleanup1 && cleanup1();
      cleanup2 && cleanup2();
      cleanup3 && cleanup3();
      cleanup4 && cleanup4();
    };
  }, [dynamicElements, dynamicElements1, dynamicElements2, dynamicElements3]);
  
  // Retourner les styles d'animation en fonction du type
  const getAnimationStyle = (type: string, isTransitioning: boolean) => {
    const style = animationStyles ? animationStyles[type as keyof typeof animationStyles] || 'fade' : 'fade';
    
    const baseStyle = {
      transition: 'all 0.5s ease',
      color: 'var(--color-primary)',
      fontWeight: 'bold',
      fontFamily: 'inherit', // Hérite la police du body
      fontSize: 'inherit' // Hérite la taille de police du body
    };
    
    switch(style) {
      case 'slide':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(10px)' : 'translateX(0)'
        };
      case 'zoom':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(1.1)' : 'scale(1)'
        };
      case 'bounce':
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(-3px)' : 'translateY(0)'
        };
      case 'fade':
      default:
        return {
          ...baseStyle,
          opacity: isTransitioning ? 0 : 1
        };
    }
  };
  
  // Si aucun élément dynamique, retourner le texte tel quel avec Material-UI
  if ((!dynamicElements || dynamicElements.length === 0) && 
      (!dynamicElements1 || dynamicElements1.length === 0) && 
      (!dynamicElements2 || dynamicElements2.length === 0) && 
      (!dynamicElements3 || dynamicElements3.length === 0)) {
    return (
      <Typography component="span" sx={{ 
        display: 'inline-block', 
        textAlign: 'center',
        fontFamily: 'inherit',
        fontSize: 'inherit'
      }}>
        {text}
      </Typography>
    );
  }
  
  // Helper function to replace dynamic placeholders
  const replaceDynamicPlaceholder = (part: string, index: number) => {
    // Placeholder standard {{...}}
    if (part.startsWith('{{') && part.endsWith('}}') && dynamicElements) {
      const animStyle = getAnimationStyle('default', isTransitioning);
      return (
        <Box
          key={index}
          component="span"
          sx={{
        background: "rgba(255, 255, 255, 0.12)",
        padding: "10px",
        borderRadius: "10px",
        display: 'inline-block',
        minWidth: 'fit-content',
        backdropFilter: 'blur(6px)', // Ajoute l'effet de flou
        WebkitBackdropFilter: 'blur(6px)', // Pour compatibilité Safari
        color: 'rgb(0, 0, 0)',
          }}
        >
          <Box 
            component="span"
            sx={{
              ...animStyle,
              display: 'inline-block',
              minWidth: 'max-content'
            }}
          >
            {dynamicElements[currentElementIndex]}
          </Box>
        </Box>
      );
    }
    // Placeholder type1 {[...]}
    else if (part.startsWith('{[') && part.endsWith(']}') && dynamicElements1) {
      const animStyle = getAnimationStyle('type1', isTransitioning1);
      return (
        <Box key={index} component="span" sx={{ display: 'inline-block', minWidth: 'fit-content' }}>
          <Box 
            component="span"
            sx={{
              ...animStyle,
              display: 'inline-block',
              minWidth: 'max-content'
            }}
          >
            {dynamicElements1[currentElement1Index]}
          </Box>
        </Box>
      );
    }
    // Placeholder type2 {(...)}
    else if (part.startsWith('{(') && part.endsWith(')}') && dynamicElements2) {
      const animStyle = getAnimationStyle('type2', isTransitioning2);
      return (
        <Box key={index} component="span" sx={{ display: 'inline-block', minWidth: 'fit-content' }}>
          <Box 
            component="span"
            sx={{
              ...animStyle,
              display: 'inline-block',
              minWidth: 'max-content'
            }}
          >
            {dynamicElements2[currentElement2Index]}
          </Box>
        </Box>
      );
    }
    // Placeholder type3 {<...>}
    else if (part.startsWith('{<') && part.endsWith('>}') && dynamicElements3) {
      const animStyle = getAnimationStyle('type3', isTransitioning3);
      return (
        <Box key={index} component="span" sx={{ display: 'inline-block', minWidth: 'fit-content' }}>
          <Box 
            component="span"
            sx={{
              ...animStyle,
              display: 'inline-block',
              minWidth: 'max-content'
            }}
          >
            {dynamicElements3[currentElement3Index]}
          </Box>
        </Box>
      );
    }
    // Texte normal
    return <Typography key={index} component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit' }}>{part}</Typography>;
  };
  
  // Parser le texte pour remplacer les différents marqueurs par les éléments dynamiques
  const parts = text.split(/(\{\{[^}]+\}\}|\{\[[^}]+\]\}|\{\([^}]+\)\}|\{\<[^}]+\>\})/);
  
  return (
    <Typography 
      component="div"
      sx={{ 
        display: 'inline-block',
        textAlign: 'center',
        maxWidth: '90vw',
        lineHeight: 1.6,
        fontFamily: 'inherit',
        fontSize: 'inherit'
      }}
    >
      {parts.map((part, index) => replaceDynamicPlaceholder(part, index))}
    </Typography>
  );
}

interface PageHeaderProps {
  title?: string;
  description?: string;
  classNameAddedTitle?: string;
  classNameAddedDescription?: string;
}

export function PageHeader({ title, description, classNameAddedDescription, classNameAddedTitle }: PageHeaderProps) {
  const [siteData, setSiteData] = useState<SiteData>({
    titleSite: '',
    descriptionSite: ''
  });

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const response = await myFetch('/api/siteSettings');
        const data = await response.json();
        if (data.success) {
          setSiteData(data.site);
        }
      } catch (error) {
        console.error('Error loading site data:', error);
      }
    };
    loadSiteData();
  }, []);

  return (
    <Box 
      className="page-header-accueil" // Classe CSS pour appliquer la personnalisation de police
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        mb: 8,
        p: 1
      }}
    >
      <Typography
        variant="h1"
        className={`site-title page-header-accueil ${classNameAddedTitle}`}
        sx={{
          fontWeight: 'bold',
          fontFamily: 'inherit', // Hérite la police du body
          mb: "1rem", // Ajout d'une marge en bas pour espacer du texte suivant
        }}
      >
        {title || siteData.titleSite}
      </Typography>
      
      {(siteData.descriptionSite || description) && (
        <Box 
          className={classNameAddedDescription}
          sx={{ 
            color: 'text.secondary',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            fontSize: 'inherit', // Hérite de la taille de police globale
            fontFamily: 'inherit' // Hérite la police du body
          }}
        >
          <DynamicTextCycler 
            text={description || siteData.descriptionSite} 
            dynamicElements={siteData.dynamicElements}
            dynamicElements1={siteData.dynamicElements1}
            dynamicElements2={siteData.dynamicElements2}
            dynamicElements3={siteData.dynamicElements3}
            animationStyles={siteData.animationStyles}
          />
        </Box>
      )}
    </Box>
  );
}