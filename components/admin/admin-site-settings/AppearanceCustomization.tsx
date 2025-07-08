import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import { Plus } from 'lucide-react';
import { OverlaySuccess } from '../OverlaySuccess';

// Liste des polices disponibles
const AVAILABLE_FONTS = [
  'Montserrat',
  'Roboto',
  'Playfair Display',
  'Lora',
  'Pacifico',
  'Dancing Script',
  'Great Vibes',
  'Satisfy',
  'Allura',
  'Parisienne',
  'Sacramento',
  'Herr Von Muellerhoff',
  'Tangerine',
  'Yellowtail',
  'Arial',
  'Times New Roman'
];

// Hook pour charger dynamiquement les Google Fonts
function useGoogleFont(fontFamily: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman') {
      setIsLoaded(true);
      return; // Polices système, pas besoin de charger
    }

    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Vérifier si la police est déjà chargée
    let link = document.getElementById(fontId) as HTMLLinkElement;
    
    if (!link) {
      // Créer le lien pour charger la police
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
      
      // Ajouter les événements de chargement
      link.onload = () => {
        
        setIsLoaded(true);
      };
      
      link.onerror = () => {
        console.error(`Erreur lors du chargement de la police ${fontFamily}`);
        setIsLoaded(true); // Considérer comme chargée même en cas d'erreur
      };
      
      document.head.appendChild(link);
      
      // Ajouter un style CSS spécifique pour contourner le CSS admin
      const styleId = `font-preview-override-${fontFamily.replace(/\s+/g, '-')}`;
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.innerHTML = `
          .font-preview-text-${fontFamily.replace(/\s+/g, '-')} {
            font-family: '${fontFamily}', 'Arial', sans-serif !important;
          }
          .admin-content .font-preview-text-${fontFamily.replace(/\s+/g, '-')},
          .admin-content * .font-preview-text-${fontFamily.replace(/\s+/g, '-')},
          div .font-preview-text-${fontFamily.replace(/\s+/g, '-')} {
            font-family: '${fontFamily}', 'Arial', sans-serif !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // Fallback timer pour s'assurer que l'état est mis à jour
      const timer = setTimeout(() => {
        
        setIsLoaded(true);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // La police est déjà dans le DOM
      setIsLoaded(true);
    }
  }, [fontFamily]);

  return isLoaded;
}

// Hook pour charger toutes les polices disponibles pour la prévisualisation
function useAllFonts() {
  useEffect(() => {
    // Charger toutes les polices Google Fonts pour les aperçus dans les selects
    const fontsToLoad = AVAILABLE_FONTS.filter(font => 
      font !== 'Arial' && font !== 'Times New Roman'
    );

    fontsToLoad.forEach(fontFamily => {
      const fontId = `google-font-preview-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, []);
}

// Composant d'aperçu amélioré avec chargement de police
const FontPreview = React.memo(({ 
  fontFamily, 
  fontSize, 
  text, 
  label, 
  isBold = false 
}: { 
  fontFamily: string; 
  fontSize: number; 
  text: string; 
  label: string; 
  isBold?: boolean; 
}) => {
  // Charger la police Google Fonts
  const isFontLoaded = useGoogleFont(fontFamily);
  
  return (
    <Box sx={{ 
      flex: 1, 
      minWidth: 150, 
      maxWidth: 350,
      textAlign: 'center', 
      p: 2, 
      border: '1px solid #ddd', 
      borderRadius: 1, 
      bgcolor: 'white',
      height: 'auto',
      minHeight: 120, // Augmentation de la hauteur minimale pour permettre les grandes tailles
      maxHeight: 200, // Ajout d'une hauteur maximale pour éviter les débordements excessifs
      overflow: 'hidden'
    }}>
      <Typography variant="caption" color="text.secondary" mb={1} display="block">
        {label}
      </Typography>
      
      {/* Texte d'aperçu avec police forcée */}
      <Typography 
        className={`font-preview-text font-preview-text-${fontFamily.replace(/\s+/g, '-')}`}
        sx={{ 
          fontFamily: `'${fontFamily}', 'Arial', sans-serif !important`,
          fontSize: `${fontSize}px !important`, // Suppression de la limite pour permettre l'aperçu de toutes les tailles
          lineHeight: 1.2,
          fontWeight: isBold ? 'bold' : 'normal',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2, // Permet 2 lignes maximum
          WebkitBoxOrient: 'vertical',
          wordWrap: 'break-word',
          maxWidth: '100%',
          // Forcer le navigateur à utiliser la police avec spécificité maximale
          fontDisplay: 'swap',
          [`&.font-preview-text-${fontFamily.replace(/\s+/g, '-')}`]: {
            fontFamily: `'${fontFamily}', 'Arial', sans-serif !important`
          }
        }}
        style={{
          fontFamily: `'${fontFamily}', 'Arial', sans-serif`
        }}
        title={`${fontFamily} - ${fontSize}px - ${isFontLoaded ? 'Chargée' : 'En cours...'}`}
      >
        {text}
      </Typography>
      
      {/* Informations sur la police */}
      <Typography variant="caption" color="text.secondary" sx={{ 
        fontSize: '10px', 
        mt: 0.5, 
        display: 'block',
        opacity: 0.7
      }}>
        {fontFamily} - {fontSize}px
        {!isFontLoaded && (
          <Box component="span" sx={{ color: 'orange', ml: 0.5 }}>
            ⏳
          </Box>
        )}
        {isFontLoaded && (
          <Box component="span" sx={{ color: 'green', ml: 0.5 }}>
            ✓
          </Box>
        )}
      </Typography>
    </Box>
  );
});

interface AppearanceCustomizationProps {
  fieldValues: any;
  setFieldValues: (values: any) => void;
  handleInputChange: (field: string, value: string) => void;
  handleColorInputChange: (field: string, value: string) => void;
  allAccordionsExpanded?: boolean;
  accordionExpandTrigger?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function isColorLight(color: string) {
  // Gérer les couleurs RGBA et HEX
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    // Parser la couleur RGBA
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const alpha = match[4] ? parseFloat(match[4]) : 1;
      
      // Calculer la luminance perçue
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      
      // Prendre en compte l'opacité : une couleur claire avec faible opacité paraît plus foncée
      const effectiveLuminance = luminance * alpha + (1 - alpha) * 255; // Assume fond blanc
      
      return effectiveLuminance > 180; // Seuil ajusté pour l'opacité
    }
  } else if (color.startsWith('#')) {
    // Couleur HEX (existant)
    let c = color.replace('#', '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const r = parseInt(c.substring(0,2),16);
    const g = parseInt(c.substring(2,4),16);
    const b = parseInt(c.substring(4,6),16);
    // Perception luminance
    return (0.299*r + 0.587*g + 0.114*b) > 220;
  }
  
  // Par défaut, considérer comme couleur foncée
  return false;
}

// Sélecteur de couleur amélioré avec react-colorful - popup only closes by user action

const ColorCircle = React.memo(({ color, onChange }: { color: string, onChange: (val: string) => void }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const [tempRgbaColor, setTempRgbaColor] = useState({ r: 255, g: 136, b: 71, a: 1 });
  const [hasChanged, setHasChanged] = useState(false);
  const [colorMode, setColorMode] = useState<'hex' | 'rgba'>('rgba');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fonction pour convertir hex en RGBA
  const hexToRgba = (hex: string) => {
    // Nettoyer et normaliser la couleur hex
    const cleanHex = hex.replace('#', '');
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : { r: 255, g: 136, b: 71, a: 1 };
  };

  // Fonction pour convertir RGBA en hex (sans alpha)
  const rgbaToHex = (rgba: { r: number, g: number, b: number, a: number }) => {
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  // Fonction pour convertir RGBA en string CSS
  const rgbaToString = (rgba: { r: number, g: number, b: number, a: number }) => {
    return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${rgba.a})`;
  };

  // Fonction pour parser une couleur en RGBA
  const parseColorToRgba = (colorString: string) => {
    if (colorString.startsWith('#')) {
      return hexToRgba(colorString);
    } else if (colorString.startsWith('rgba') || colorString.startsWith('rgb')) {
      const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: match[4] ? parseFloat(match[4]) : 1
        };
      }
    }
    // Couleur par défaut si parsing échoue
    return { r: 255, g: 136, b: 71, a: 1 };
  };

  // Initialiser correctement les couleurs au montage ET lors du changement de prop
  useEffect(() => {
    // Toujours synchroniser avec la couleur reçue
    setTempColor(color);
    const rgbaColor = parseColorToRgba(color);
    setTempRgbaColor(rgbaColor);
    
    // Réinitialiser les changements
    setHasChanged(false);
  }, [color]);

  // Effet séparé pour fermer le picker si nécessaire
  useEffect(() => {
    if (!isPickerOpen) {
      setHasChanged(false);
    }
  }, [isPickerOpen]);

  // Stabiliser les callbacks pour éviter les re-renders non nécessaires
  const handleColorChange = useCallback((newColor: string) => {
    setTempColor(newColor);
    setHasChanged(true);
    // Synchroniser avec RGBA
    if (newColor.startsWith('#')) {
      const rgbaColor = hexToRgba(newColor);
      setTempRgbaColor(rgbaColor);
    }
  }, []);

  const handleRgbaChange = useCallback((newRgba: { r: number, g: number, b: number, a: number }) => {
    setTempRgbaColor(newRgba);
    setHasChanged(true);
    // Synchroniser avec HEX (ignorer l'alpha pour la version hex)
    const hexEquivalent = rgbaToHex(newRgba);
    setTempColor(hexEquivalent);
  }, []);

  const handleColorModeToggle = useCallback(() => {
    setColorMode(mode => {
      const newMode = mode === 'hex' ? 'rgba' : 'hex';
      return newMode;
    });
  }, []);

  const getCurrentColorValue = useCallback(() => {
    const currentValue = colorMode === 'rgba' ? rgbaToString(tempRgbaColor) : tempColor;
    return currentValue;
  }, [colorMode, tempRgbaColor, tempColor]);

  const handleClick = useCallback(() => {
    setIsPickerOpen(open => {
      const newOpen = !open;
      if (!open) {
        // Lors de l'ouverture, s'assurer que les couleurs sont synchronisées
        const rgbaColor = parseColorToRgba(color);
        setTempRgbaColor(rgbaColor);
        setTempColor(color.startsWith('#') ? color : rgbaToHex(rgbaColor));
        setHasChanged(false);
      }
      return newOpen;
    });
  }, [color]);

  const handleConfirm = useCallback(() => {
    if (hasChanged) {
      const colorToSave = getCurrentColorValue();
      
      // Créer un objet avec les deux formats pour la sauvegarde
      const colorData = {
        hex: colorMode === 'hex' ? colorToSave : rgbaToHex(tempRgbaColor),
        rgba: colorMode === 'rgba' ? colorToSave : rgbaToString(tempRgbaColor),
        current: colorToSave
      };
      
      // Pour l'instant, on envoie la couleur actuelle, mais on pourrait étendre pour sauvegarder les deux formats
      onChange(colorToSave);
      
      // Afficher un toast de confirmation après sauvegarde
      // toast.success('🎨 Couleur sauvegardée avec succès', {
      //   position: "top-center",
      //   autoClose: 800,
      //   hideProgressBar: false,
      //   theme: "dark",
      //   style: { width: '300px' },
      // });
    }
    setIsPickerOpen(false);
    setHasChanged(false);
  }, [hasChanged, onChange, getCurrentColorValue, colorMode, tempRgbaColor]);

  const handleCancel = useCallback(() => {
    setTempColor(color);
    setIsPickerOpen(false);
    setHasChanged(false);
  }, [color]);

  const handleClose = useCallback(() => {
    setIsPickerOpen(false);
  }, []);

  return (
    <Box position="relative" display="inline-block" sx={{ width: 32, height: 32 }}>
      {/* Cercle de couleur cliquable */}
      <Box
        onClick={handleClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: color,
          border: hasChanged ? '2px solid #f59e0b' : '2px solid #bbb',
          boxShadow: isPickerOpen ? '0 0 8px #0004' : '0 0 4px #0002',
          cursor: 'pointer',
          display: 'inline-block',
          position: 'relative',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 8px #0003'
          },
          '&::after': hasChanged ? {
            content: '""',
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#f59e0b',
            border: '1px solid white',
            display: 'block'
          } : {}
        }}
        title={hasChanged ? 
          `Couleur modifiée: ${getCurrentColorValue()} (cliquez sur Sauvegarder pour confirmer)` : 
          `Couleur actuelle: ${color} | HEX: ${color.startsWith('#') ? color : rgbaToHex(parseColorToRgba(color))} | RGBA: ${color.startsWith('rgba') ? color : rgbaToString(parseColorToRgba(color))}`
        }
      />

      {/* Picker personnalisé amélioré avec react-colorful */}
      {isPickerOpen && (
        <Box
          ref={pickerRef}
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute',
            top: 40,
            left: -60,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            p: 2,
            minWidth: 400,
            width: 400,
            animation: 'fadeIn 0.2s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-10px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          {/* Titre avec indicateur de changement et sélecteur de mode */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Sélecteur de couleur
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            </Box>
          </Box>

          {/* React-colorful picker principal */}
          <Box sx={{ mb: 2 }}>
            {colorMode === 'hex' ? (
              <HexColorPicker 
                color={tempColor} 
                onChange={handleColorChange}
                style={{
                  width: '100%',
                  height: '120px'
                }}
              />
            ) : (
              <RgbaColorPicker 
                color={tempRgbaColor} 
                onChange={handleRgbaChange}
                style={{
                  width: '100%',
                  height: '160px'
                }}
              />
            )}
          </Box>

          {/* Couleurs prédéfinies populaires */}
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
            Couleurs populaires
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.5, mb: 2 }}>
            {[
              '#ff8647', '#7c3aed', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b',
              '#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f97316', '#6366f1',
              '#000000', '#ffffff', '#6b7280', '#fbbf24', '#f87171', '#34d399'
            ].map((presetColor) => (
              <Box
                key={presetColor}
                onClick={(e) => {
                  e.stopPropagation();
                  if (colorMode === 'hex') {
                    handleColorChange(presetColor);
                  } else {
                    const rgbaColor = hexToRgba(presetColor);
                    handleRgbaChange(rgbaColor);
                  }
                }}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: presetColor,
                  border: presetColor === tempColor ? '2px solid #333' : '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }
                }}
                title={`Cliquer pour sélectionner ${presetColor}`}
              />
            ))}
          </Box>

          {/* Affichage de la valeur hexadécimale/RGBA avec couleur actuelle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            </Typography>
            {colorMode === 'hex' ? (
              <TextField
                value={tempColor}
                onChange={e => {
                  const newColor = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
                    handleColorChange(newColor);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                  handleConfirm();
                  }
                }}
                size="small"
                sx={{ 
                  '& .MuiInputBase-input': { 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '4px 8px'
                  },
                  width: 80
                }}
                slotProps={{
                  input: {
                    inputProps: {
                      maxLength: 7, // Limite à 7 caractères pour #RRGGBB
                      style: { textTransform: 'uppercase', textAlign: 'center' },
                    }
                  }
                }}
                placeholder="#000000"
                />
              ) : (
              <Typography variant="caption" sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.75rem',
                padding: '4px 8px',
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                minWidth: 120,
                textAlign: 'center'
              }}>
                {rgbaToString(tempRgbaColor)}
              </Typography>
            )}
            <Box sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: getCurrentColorValue(),
              border: '1px solid #ddd',
              ml: 1
            }} />
          </Box>

          {/* Informations sur l'opacité et valeurs détaillées en mode RGBA */}
          {colorMode === 'rgba' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.7rem' }}>
              </Box>
            </Box>
          )}

          {/* Boutons d'action */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 2 }}>
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={handleCancel}
              sx={{ fontSize: '0.75rem' }}
              disabled={!hasChanged}
            >
              Annuler
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {hasChanged && (
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  onClick={handleConfirm}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Sauvegarder
                </Button>
              )}
              <Button 
                size="small" 
                variant="outlined" 
                onClick={handleClose}
                sx={{ fontSize: '0.75rem' }}
              >
                Fermer
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
});

export function AppearanceCustomization({ 
  fieldValues, 
  setFieldValues, 
  handleInputChange, 
  handleColorInputChange,
  allAccordionsExpanded = false,
  accordionExpandTrigger = 0,
  expanded = false,
  onExpandedChange
}: AppearanceCustomizationProps) {
  
  // Charger toutes les polices pour les aperçus dans les selects
  useAllFonts();
  
  // États pour les overlays de succès séparés
  const [showPageSettingsOverlay, setShowPageSettingsOverlay] = useState(false);
  const [pageSettingsAnimation, setPageSettingsAnimation] = useState<'none' | 'enter' | 'exit'>('none');
  const [showAppearanceOverlay, setShowAppearanceOverlay] = useState(false);
  const [appearanceAnimation, setAppearanceAnimation] = useState<'none' | 'enter' | 'exit'>('none');
  
  // États pour gérer l'ouverture/fermeture des accordéons
  const [accordionStates, setAccordionStates] = useState({
    pageSettings: false,
    appearanceSettings: expanded
  });

  // Synchroniser l'état avec la prop expanded
  useEffect(() => {
    setAccordionStates(prev => ({
      ...prev,
      appearanceSettings: expanded
    }));
  }, [expanded]);

  // Écouter les événements de succès pour ce composant
  useEffect(() => {
    const handlePageSettingsSuccess = () => {
      console.log('Événement de succès reçu pour Page Settings');
      setShowPageSettingsOverlay(true);
      setPageSettingsAnimation('enter');
      
      // Masquer l'overlay après 1 seconde
      setTimeout(() => {
        setPageSettingsAnimation('exit');
        setTimeout(() => {
          setShowPageSettingsOverlay(false);
          setPageSettingsAnimation('none');
        }, 400);
      }, 1000);
    };

    const handleAppearanceSuccess = () => {
      console.log('Événement de succès reçu pour Appearance Settings');
      setShowAppearanceOverlay(true);
      setAppearanceAnimation('enter');
      
      // Masquer l'overlay après 1 seconde
      setTimeout(() => {
        setAppearanceAnimation('exit');
        setTimeout(() => {
          setShowAppearanceOverlay(false);
          setAppearanceAnimation('none');
        }, 400);
      }, 1000);
    };

    // Écouter les événements personnalisés spécifiques
    window.addEventListener('pageSettingsSuccess', handlePageSettingsSuccess);
    window.addEventListener('appearanceCustomizationSuccess', handleAppearanceSuccess);
    
    return () => {
      window.removeEventListener('pageSettingsSuccess', handlePageSettingsSuccess);
      window.removeEventListener('appearanceCustomizationSuccess', handleAppearanceSuccess);
    };
  }, []);

  // Effet pour synchroniser avec le bouton global
  useEffect(() => {
    if (accordionExpandTrigger > 0) {
      setAccordionStates({
        pageSettings: allAccordionsExpanded,
        appearanceSettings: allAccordionsExpanded
      });
    }
  }, [accordionExpandTrigger, allAccordionsExpanded]);

  // Fonction pour gérer le changement d'état des accordéons
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setAccordionStates(prev => ({
      ...prev,
      [panel]: isExpanded
    }));
    
    // Notifier le parent si c'est l'accordéon principal qui change
    if (panel === 'appearanceSettings') {
      onExpandedChange?.(isExpanded);
    }
  };
  
  // Configuration par page - structure par défaut
  const defaultPageSettings = {
    fontFamily: 'Montserrat',
    fontSize: 16
  };

  const pageSettings = fieldValues.pageSettings 
    ? (typeof fieldValues.pageSettings === 'string' 
        ? JSON.parse(fieldValues.pageSettings) 
        : fieldValues.pageSettings)
    : {
        Accueil: { ...defaultPageSettings },
        Contact: { ...defaultPageSettings },
        Profil: { ...defaultPageSettings },
        Albums: { ...defaultPageSettings }
      };

  // Fonction pour mettre à jour les paramètres d'une page spécifique
  const handlePageSettingChange = useCallback((pageName: string, setting: string, value: string | number) => {
    const newPageSettings = {
      ...pageSettings,
      [pageName]: {
        ...pageSettings[pageName],
        [setting]: value
      }
    };
    handleInputChange('pageSettings', JSON.stringify(newPageSettings));
  }, [pageSettings, handleInputChange]);

  const gradientColors = Array.isArray(fieldValues.gradientColors)
    ? fieldValues.gradientColors
    : typeof fieldValues.gradientColors === 'string'
      ? JSON.parse(fieldValues.gradientColors)
      : ['#ff8647', '#7c3aed'];

  // Ajout angle/centre et stops pour le gradient
  const gradientType = fieldValues.gradientType || 'linear';
  const gradientAngle = fieldValues.gradientAngle || 120;
  const gradientCenter = fieldValues.gradientCenter || '50% 50%';
  const gradientStops = Array.isArray(fieldValues.gradientStops)
    ? fieldValues.gradientStops
    : typeof fieldValues.gradientStops === 'string'
      ? JSON.parse(fieldValues.gradientStops)
      : gradientColors.map((_: string, i: number) => Math.round((i / (gradientColors.length - 1)) * 100));

  // Paramètres pour l'effet granulé
  const granularBaseColor = fieldValues.granularBaseColor || '#f9d3e0';
  const granularGranuleSize = fieldValues.granularGranuleSize || 15;
  const granularDensity = fieldValues.granularDensity || 40;
  const granularVariation = fieldValues.granularVariation || 30;

  // Callback pour la première couleur du gradient
  const handleFirstGradientColorChange = useCallback((val: string) => {
    const newColors = [val];
    handleColorInputChange('gradientColors', JSON.stringify(newColors));
  }, [handleColorInputChange]);

  // Callback pour les couleurs multiples du gradient
  const handleGradientColorChange = useCallback((idx: number) => {
    return (val: string) => {
      const newColors = [...gradientColors];
      newColors[idx] = val;
      handleColorInputChange('gradientColors', JSON.stringify(newColors));
    };
  }, [gradientColors, handleColorInputChange]);

  // Ajout du composant CenterPicker pour choisir le centre du gradient
  const CenterPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [dragging, setDragging] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    
    // Parse value
    let [x, y] = value.split(' ').map(v => parseFloat(v));
    if (isNaN(x)) x = 50;
    if (isNaN(y)) y = 50;

    // Taille du rectangle (CSS)
    const boxW = 200, boxH = 100;

    // Convert % to px for display
    const px = (x / 100) * boxW;
    const py = (y / 100) * boxH;

    // Déplacement du point lors du drag
    function handleDrag(clientX: number, clientY: number) {
      if (!boxRef.current) return;
      const rect = boxRef.current.getBoundingClientRect();
      let nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(`${Math.round(nx * 100)}% ${Math.round(ny * 100)}%`);
    }

    function startDrag(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      setDragging(true);
      handleDrag(e.clientX, e.clientY);
      window.addEventListener('mousemove', moveDrag);
      window.addEventListener('mouseup', stopDrag);
    }
    
    function moveDrag(e: MouseEvent) {
      handleDrag(e.clientX, e.clientY);
    }
    
    function stopDrag() {
      setDragging(false);
      window.removeEventListener('mousemove', moveDrag);
      window.removeEventListener('mouseup', stopDrag);
    }

    // Clic direct dans le rectangle
    function handleBoxClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (!boxRef.current) return;
      handleDrag(e.clientX, e.clientY);
    }

    return (
      <Box display="flex" justifyContent="center" alignItems="center" my={1}>
        <Box
          ref={boxRef}
          onClick={handleBoxClick}
          sx={{
            width: boxW,
            height: boxH,
            backgroundColor: '#eee',
            borderRadius: 1,
            position: 'relative',
            border: '1px solid #bbb',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          <Box
            onMouseDown={startDrag}
            sx={{
              position: 'absolute',
              left: px - 8,
              top: py - 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: dragging ? 'primary.main' : '#333',
              border: '2px solid white',
              boxShadow: '0 0 4px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: 2,
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: 'primary.main'
              }
            }}
            title={`Centre: ${x}% ${y}%`}
          />
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: '#ccc',
              transform: 'translateX(-50%)'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: '#ccc',
              transform: 'translateY(-50%)'
            }}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Premier accordéon : Configuration de polices par page */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* Overlay de succès pour les paramètres de page */}
        <OverlaySuccess 
          show={showPageSettingsOverlay} 
          animation={pageSettingsAnimation}
        />
        
        <Accordion elevation={0} sx={{ 
          width: '100%', 
          borderRadius: 0, 
          border: 'none', 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&:first-of-type': {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },
          '&:last-of-type': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
          '&.MuiAccordion-root': {
            borderRadius: 0,
          }
        }}
          expanded={accordionStates.pageSettings}
          onChange={handleAccordionChange('pageSettings')}
        >
        <AccordionSummary
          expandIcon={<Plus style={{ transition: 'transform 0.3s', transform: accordionStates.pageSettings ? 'rotate(45deg)' : 'none' }} />}
          aria-controls="page-settings-content"
          id="page-settings-header"
          sx={{ 
            borderRadius: 0,
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Configuration de polices par page
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, borderRadius: 0 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Configurez une police et une taille différentes pour chaque page de votre site.
          </Typography>
        
        {['Accueil', 'Contact', 'Profil', 'Albums'].map((pageName) => {
          const currentPageSettings = pageSettings[pageName] || { fontFamily: 'Montserrat', fontSize: 16 };
          
          return (
            <Box key={pageName} mb={4} p={2} sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2, 
              bgcolor: '#fafafa',
              position: 'relative' // Nécessaire pour l'overlay
            }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2} color="primary.main">
                Page {pageName}
              </Typography>
              
              {/* Overlay pour Contact */}
              {pageName === 'Contact' && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(200, 200, 200, 0.3)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 16px',
                    borderRadius: 2,
                    fontWeight: 600
                  }}>
                    Configuration non modifiable
                  </Typography>
                </Box>
              )}
              
              {/* Layout spécial pour les pages Accueil et Profil avec sliders empilés */}
              {pageName === 'Accueil' ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  {/* Première ligne : Sélecteur de police et Aperçu */}
                  <Box display="flex" flexDirection={{ xs: 'column', md: 'column' }} gap={3} alignItems="flex-start">
                    <FormControl sx={{ flex: 1, minWidth: 200, width: '100%' }}>
                      <InputLabel>Police</InputLabel>
                      <Select
                        label="Police"
                        value={currentPageSettings.fontFamily}
                        onChange={(e) => handlePageSettingChange(pageName, 'fontFamily', e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 400,
                              '& .MuiMenuItem-root': {
                                fontSize: '14px',
                                padding: '8px 16px'
                              }
                            }
                          }
                        }}
                      >
                        {AVAILABLE_FONTS.map(font => {
                          const displayText = font === 'Great Vibes' ? 'Great Vibes (calligraphie)' :
                                             font === 'Satisfy' ? 'Satisfy (calligraphie)' :
                                             font === 'Allura' ? 'Allura (calligraphie)' :
                                             font === 'Parisienne' ? 'Parisienne (calligraphie)' :
                                             font === 'Sacramento' ? 'Sacramento (calligraphie)' :
                                             font === 'Herr Von Muellerhoff' ? 'Herr Von Muellerhoff (calligraphie)' :
                                             font === 'Tangerine' ? 'Tangerine (calligraphie)' :
                                             font === 'Yellowtail' ? 'Yellowtail (calligraphie)' :
                                             font;
                          
                          return (
                            <MenuItem 
                              key={font} 
                              value={font} 
                              sx={{ 
                                fontFamily: `'${font}', Arial, sans-serif !important`,
                                fontSize: '14px !important',
                                fontWeight: '400 !important'
                              }}
                            >
                              {displayText}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>

                    {/* Aperçus */}
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, 
                      alignItems: 'center', flexWrap: 'wrap',
                      justifyContent: 'space-around', flex: 1,
                      width: '100%' }}>
                      <FontPreview
                        fontFamily={currentPageSettings.fontFamily}
                        fontSize={currentPageSettings.titleFontSize || currentPageSettings.fontSize}
                        text="Titre principal"
                        label="Aperçu titre principal"
                        isBold={true}
                      />
                      
                      <FontPreview
                        fontFamily={currentPageSettings.fontFamily}
                        fontSize={currentPageSettings.fontSize}
                        text="Éléments dynamiques"
                        label="Aperçu texte dynamique"
                      />
                    </Box>
                  </Box>
                  {/* Troisième ligne : Slider de taille du titre */}
                  <Box>
                    <Typography variant="body2" mb={1}>Taille du titre</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={currentPageSettings.titleFontSize || currentPageSettings.fontSize}
                        min={8}
                        max={150}
                        step={1}
                        onChange={(_, newValue) => {
                          const newSettings = {
                            ...pageSettings,
                            [pageName]: {
                              ...currentPageSettings,
                              titleFontSize: Array.isArray(newValue) ? newValue[0] : newValue
                            }
                          };
                          setFieldValues((prev: any) => ({
                            ...prev,
                            pageSettings: newSettings
                          }));
                        }}
                        onChangeCommitted={(_, newValue) => {
                          handlePageSettingChange(pageName, 'titleFontSize', Array.isArray(newValue) ? newValue[0] : newValue);
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {currentPageSettings.titleFontSize || currentPageSettings.fontSize}px
                      </Typography>
                    </Box>
                  </Box>
                  {/* Deuxième ligne : Slider de taille de police */}
                  <Box>
                    <Typography variant="body2" mb={1}>Taille de la police</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={currentPageSettings.fontSize}
                        min={8}
                        max={120}
                        step={1}
                        onChange={(_, newValue) => {
                          const newSettings = {
                            ...pageSettings,
                            [pageName]: {
                              ...currentPageSettings,
                              fontSize: Array.isArray(newValue) ? newValue[0] : newValue
                            }
                          };
                          setFieldValues((prev: any) => ({
                            ...prev,
                            pageSettings: newSettings
                          }));
                        }}
                        onChangeCommitted={(_, newValue) => {
                          handlePageSettingChange(pageName, 'fontSize', Array.isArray(newValue) ? newValue[0] : newValue);
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {currentPageSettings.fontSize}px
                      </Typography>
                    </Box>
                  </Box>


                </Box>
              ) : pageName === 'Profil' ? (
                <Box display="flex" flexDirection="column" gap={3}>
                  {/* Première ligne : Sélecteur de police et Aperçu */}
                  <Box display="flex" flexDirection={{ xs: 'column', md: 'column' }} gap={3} alignItems="flex-start">
                    <FormControl sx={{ flex: 1, minWidth: 200, width: '100%' }}>
                      <InputLabel>Police</InputLabel>
                      <Select
                        label="Police"
                        value={currentPageSettings.fontFamily}
                        onChange={(e) => handlePageSettingChange(pageName, 'fontFamily', e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 400,
                              '& .MuiMenuItem-root': {
                                fontSize: '14px',
                                padding: '8px 16px'
                              }
                            }
                          }
                        }}
                      >
                        {AVAILABLE_FONTS.map(font => {
                          const displayText = font === 'Great Vibes' ? 'Great Vibes (calligraphie)' :
                                             font === 'Satisfy' ? 'Satisfy (calligraphie)' :
                                             font === 'Allura' ? 'Allura (calligraphie)' :
                                             font === 'Parisienne' ? 'Parisienne (calligraphie)' :
                                             font === 'Sacramento' ? 'Sacramento (calligraphie)' :
                                             font === 'Herr Von Muellerhoff' ? 'Herr Von Muellerhoff (calligraphie)' :
                                             font === 'Tangerine' ? 'Tangerine (calligraphie)' :
                                             font === 'Yellowtail' ? 'Yellowtail (calligraphie)' :
                                             font;
                          
                          return (
                            <MenuItem 
                              key={font} 
                              value={font} 
                              sx={{ 
                                fontFamily: `'${font}', Arial, sans-serif !important`,
                                fontSize: '14px !important',
                                fontWeight: '400 !important'
                              }}
                            >
                              {displayText}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>

                    {/* Aperçus */}
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, 
                      alignItems: 'center', flexWrap: 'wrap',
                      justifyContent: 'space-around', flex: 1,
                      width: '100%' }}>
                      <FontPreview
                        fontFamily={currentPageSettings.fontFamily}
                        fontSize={currentPageSettings.artistNameFontSize || currentPageSettings.fontSize}
                        text="Nom d'artiste"
                        label="Aperçu nom d'artiste"
                        isBold={true}
                      />
                      
                      <FontPreview
                        fontFamily={currentPageSettings.fontFamily}
                        fontSize={currentPageSettings.fontSize}
                        text="Éléments profil"
                        label="Aperçu texte profil"
                      />
                    </Box>
                  </Box>
                  {/* Troisième ligne : Slider de taille du nom d'artiste */}
                  <Box>
                    <Typography variant="body2" mb={1}>Taille du nom d'artiste</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={currentPageSettings.artistNameFontSize || currentPageSettings.fontSize}
                        min={8}
                        max={150}
                        step={1}
                        onChange={(_, newValue) => {
                          const newSettings = {
                            ...pageSettings,
                            [pageName]: {
                              ...currentPageSettings,
                              artistNameFontSize: Array.isArray(newValue) ? newValue[0] : newValue
                            }
                          };
                          setFieldValues((prev: any) => ({
                            ...prev,
                            pageSettings: newSettings
                          }));
                        }}
                        onChangeCommitted={(_, newValue) => {
                          handlePageSettingChange(pageName, 'artistNameFontSize', Array.isArray(newValue) ? newValue[0] : newValue);
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {currentPageSettings.artistNameFontSize || currentPageSettings.fontSize}px
                      </Typography>
                    </Box>
                  </Box>
                  {/* Deuxième ligne : Slider de taille de police */}
                  <Box>
                    <Typography variant="body2" mb={1}>Taille de la police</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={currentPageSettings.fontSize}
                        min={8}
                        max={120}
                        step={1}
                        onChange={(_, newValue) => {
                          const newSettings = {
                            ...pageSettings,
                            [pageName]: {
                              ...currentPageSettings,
                              fontSize: Array.isArray(newValue) ? newValue[0] : newValue
                            }
                          };
                          setFieldValues((prev: any) => ({
                            ...prev,
                            pageSettings: newSettings
                          }));
                        }}
                        onChangeCommitted={(_, newValue) => {
                          handlePageSettingChange(pageName, 'fontSize', Array.isArray(newValue) ? newValue[0] : newValue);
                        }}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {currentPageSettings.fontSize}px
                      </Typography>
                    </Box>
                  </Box>


                </Box>
              ) : (
                /* Layout standard pour les autres pages - Contact désactivé */
                <Box display="flex" flexDirection="column" gap={3} 
                     sx={{ 
                       opacity: pageName === 'Contact' ? 0.5 : 1,
                       pointerEvents: pageName === 'Contact' ? 'none' : 'auto'
                     }}>

                  {/* Première ligne : Sélecteur de police et Aperçu */}
                  <Box display="flex" flexDirection={{ xs: 'column', md: 'column' }} gap={3} alignItems="flex-start">
                    <FormControl sx={{ flex: 1, minWidth: 200,
                      width: '100%' 
                     }} disabled={pageName === 'Contact'}>
                      <InputLabel>Police</InputLabel>
                      <Select
                        label="Police"
                        value={currentPageSettings.fontFamily}
                        onChange={(e) => handlePageSettingChange(pageName, 'fontFamily', e.target.value)}
                        disabled={pageName === 'Contact'}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 400,
                              '& .MuiMenuItem-root': {
                                fontSize: '14px',
                                padding: '8px 16px'
                              }
                            }
                          }
                        }}
                      >
                        {AVAILABLE_FONTS.map(font => {
                          const displayText = font === 'Great Vibes' ? 'Great Vibes (calligraphie)' :
                                             font === 'Satisfy' ? 'Satisfy (calligraphie)' :
                                             font === 'Allura' ? 'Allura (calligraphie)' :
                                             font === 'Parisienne' ? 'Parisienne (calligraphie)' :
                                             font === 'Sacramento' ? 'Sacramento (calligraphie)' :
                                             font === 'Herr Von Muellerhoff' ? 'Herr Von Muellerhoff (calligraphie)' :
                                             font === 'Tangerine' ? 'Tangerine (calligraphie)' :
                                             font === 'Yellowtail' ? 'Yellowtail (calligraphie)' :
                                             font;
                          
                          return (
                            <MenuItem 
                              key={font} 
                              value={font} 
                              sx={{ 
                                fontFamily: `'${font}', Arial, sans-serif !important`,
                                fontSize: '14px !important',
                                fontWeight: '400 !important'
                              }}
                            >
                              {displayText}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>



                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, 
                      alignItems: 'center', flexWrap: 'wrap',
                      justifyContent: 'space-around', flex: 1,
                      width: '100%' }}>
                    {/* Aperçu */}
                    <FontPreview
                      fontFamily={currentPageSettings.fontFamily}
                      fontSize={currentPageSettings.fontSize}
                      text="Exemple de texte"
                      label="Aperçu"
                    />
                    </Box>
                  </Box>

                  {/* Deuxième ligne : Slider de taille de police - ligne complète */}
                  <Box>
                    <Typography variant="body2" mb={1}>Taille de la police</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Slider
                        value={currentPageSettings.fontSize}
                        min={8}
                        max={120}
                        step={1}
                        onChange={(_, newValue) => {
                          const newSettings = {
                            ...pageSettings,
                            [pageName]: {
                              ...currentPageSettings,
                              fontSize: Array.isArray(newValue) ? newValue[0] : newValue
                            }
                          };
                          setFieldValues((prev: any) => ({
                            ...prev,
                            pageSettings: newSettings
                          }));
                        }}
                        onChangeCommitted={(_, newValue) => {
                          handlePageSettingChange(pageName, 'fontSize', Array.isArray(newValue) ? newValue[0] : newValue);
                        }}
                        sx={{ flex: 1 }}
                        disabled={pageName === 'Contact'}
                      />
                      <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                        {currentPageSettings.fontSize}px
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}        </AccordionDetails>
      </Accordion>
      </Box>

      <Divider sx={{ borderWidth: '1px' }} />

      {/* Deuxième accordéon : Personnalisation de l'apparence */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* Overlay de succès pour l'apparence */}
        <OverlaySuccess 
          show={showAppearanceOverlay} 
          animation={appearanceAnimation}
        />

        <Accordion elevation={0} sx={{ 
          width: '100%', 
          borderRadius: 0, 
          border: 'none', 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&:first-of-type': {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          },
          '&:last-of-type': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
          '&.MuiAccordion-root': {
            borderRadius: 0,
          }
        }}
          expanded={accordionStates.appearanceSettings}
          onChange={handleAccordionChange('appearanceSettings')}
        >
        <AccordionSummary
          expandIcon={<Plus style={{ transition: 'transform 0.3s', transform: accordionStates.appearanceSettings ? 'rotate(45deg)' : 'none' }} />}
          aria-controls="appearance-settings-content"
          id="appearance-settings-header"
          sx={{ 
            borderRadius: 0,
            minHeight: 48,
            '&.Mui-expanded': {
              minHeight: 48,
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Personnalisation de l'apparence
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, borderRadius: 0 }}>
      {/* Thème/Couleur principale */}
      <Box mb={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3} alignItems="center">
        <Box flex={1} display="flex" flexDirection="row" alignItems="center"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'start',
          alignItems: 'center',
          gap: 2,
        }}
        >
          <Typography variant="body2">Couleur principale des boutons</Typography>
          <ColorCircle
            color={fieldValues.primaryColor || '#7c3aed'}
            onChange={(val: string) => handleInputChange('primaryColor', val)}
          />
          <Typography variant="caption" color="text.secondary">
            {fieldValues.primaryColor || '#7c3aed'}
          </Typography>
        </Box>
      </Box>
      {/* Sélecteur de type de gradient sur une ligne séparée */}
      <Typography variant="body2" sx={{ mb: 1 }}>Arrière plan du site web</Typography>
      <Box mb={2}>
        <FormControl fullWidth>
          <InputLabel>Type de gradient</InputLabel>
          <Select
            label="Type de gradient"
            value={gradientType}
            onChange={e => handleInputChange('gradientType', e.target.value)}
          >
            <MenuItem value="none">Sans gradient (fond uni)</MenuItem>
            <MenuItem value="linear">Linéaire</MenuItem>
            <MenuItem value="radial">Circulaire (radial)</MenuItem>
            <MenuItem value="conic">Conique</MenuItem>
            <MenuItem value="granular">Granulé dynamique</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Contrôles spécifiques au type de gradient */}
      {gradientType === 'none' && (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" mb={2} color="primary.main">
            Couleur de fond unie
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">Couleur de fond :</Typography>
            <ColorCircle
              color={gradientColors[0] || '#ff8647'}
              onChange={handleFirstGradientColorChange}
            />
            <Typography variant="caption" color="text.secondary">
              {gradientColors[0] || '#ff8647'}
            </Typography>
          </Box>
        </Box>
      )}

      {(gradientType === 'linear' || gradientType === 'radial' || gradientType === 'conic') && (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" mb={2} color="primary.main">
            Configuration du gradient {gradientType === 'linear' ? 'linéaire' : gradientType === 'radial' ? 'radial' : 'conique'}
          </Typography>

          {/* Centre du gradient pour radial et conic */}
          {(gradientType === 'radial' || gradientType === 'conic') && (
            <Box mb={2}>
              <Typography variant="body2" mb={1}>Centre du gradient</Typography>
              <CenterPicker value={gradientCenter} onChange={val => handleInputChange('gradientCenter', val)} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                {gradientCenter}
              </Typography>
            </Box>
          )}

          {/* Angle pour linear et conic */}
          {(gradientType === 'linear' || gradientType === 'conic') && (
            <Box mb={2}>
              <Typography variant="body2" mb={1}>Angle (degrés)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={Number(gradientAngle) || 120}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(_, newValue) => {
                    setFieldValues((prev: any) => ({
                      ...prev,
                      gradientAngle: newValue
                    }));
                  }}
                  onChangeCommitted={(_, newValue) => {
                    handleInputChange('gradientAngle', String(newValue));
                  }}
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                  {gradientAngle} °
                </Typography>
              </Box>
            </Box>
          )}

          {/* Couleurs et positions du gradient */}
          <Box>
            <Typography variant="body2" mb={1}>Couleurs du gradient (2 à 5) et positions</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {gradientColors.map((color: string, idx: number) => (
                <Box key={idx} display="flex" alignItems="center" gap={2}>
                  <ColorCircle
                    color={color}
                    onChange={handleGradientColorChange(idx)}
                  />
                  <Slider
                    value={gradientStops[idx]}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(_, newValue) => {
                      // MAJ locale uniquement
                      const newStops = [...gradientStops];
                      newStops[idx] = Number(newValue);
                      setFieldValues((prev: any) => ({
                        ...prev,
                        gradientStops: newStops
                      }));
                    }}
                    onChangeCommitted={(_, newValue) => {
                      // Sauvegarde effective seulement au relâchement
                      const newStops = [...gradientStops];
                      newStops[idx] = Number(newValue);
                      handleInputChange('gradientStops', JSON.stringify(newStops));
                    }}
                    sx={{
                      flex: 1,
                      minWidth: 130,
                      color: color,
                      border: isColorLight(color) ? '1px solid #bbb' : undefined,
                      background: isColorLight(color) ? '#e0e0e0' : undefined,
                      borderRadius: 1
                    }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 32, textAlign: 'right' }}>{gradientStops[idx]}%</Typography>
                </Box>
              ))}
              <Box display="flex" gap={1} mt={1}>
                {gradientColors.length < 5 && (
                  <Button size="small" variant="outlined" onClick={() => {
                    const newColors = [...gradientColors, '#ffffff'];
                    const newStops = [...gradientStops, 100];
                    handleInputChange('gradientColors', JSON.stringify(newColors));
                    handleInputChange('gradientStops', JSON.stringify(newStops));
                  }}>+</Button>
                )}
                {gradientColors.length > 2 && (
                  <Button size="small" variant="outlined" color="error" onClick={() => {
                    const newColors = [...gradientColors];
                    const newStops = [...gradientStops];
                    newColors.pop();
                    newStops.pop();
                    handleInputChange('gradientColors', JSON.stringify(newColors));
                    handleInputChange('gradientStops', JSON.stringify(newStops));
                  }}>-</Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Contrôles pour l'effet granulé */}
      {gradientType === 'granular' && (
        <Box mt={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" mb={2} color="primary.main">
            Paramètres de l'effet granulé
          </Typography>
          
          {/* Couleur de base */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body2" sx={{ minWidth: 130, textAlign: 'right' }}>
              Couleur de base :
            </Typography>
            <ColorCircle
              color={granularBaseColor}
              onChange={(val: string) => handleColorInputChange('granularBaseColor', val)}
            />
            <Typography variant="caption" color="text.secondary">
              {granularBaseColor}
            </Typography>
          </Box>

          {/* Taille des granules */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body2" sx={{ minWidth: 130, textAlign: 'right' }}>
              Taille des granules :
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
              <Slider
                value={granularGranuleSize}
                min={0.5}
                max={50}
                step={0.5}
                onChange={(_, newValue) => {
                  setFieldValues((prev: any) => ({
                    ...prev,
                    granularGranuleSize: newValue
                  }));
                }}
                onChangeCommitted={(_, newValue) => {
                  handleInputChange('granularGranuleSize', String(newValue));
                }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                {granularGranuleSize} px
              </Typography>
            </Box>
          </Box>

          {/* Densité */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography variant="body2" sx={{ minWidth: 130, textAlign: 'right' }}>
              Densité :
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
              <Slider
                value={granularDensity}
                min={1}
                max={100}
                step={1}
                onChange={(_, newValue) => {
                  setFieldValues((prev: any) => ({
                    ...prev,
                    granularDensity: newValue
                  }));
                }}
                onChangeCommitted={(_, newValue) => {
                  handleInputChange('granularDensity', String(newValue));
                }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                {granularDensity} %
              </Typography>
            </Box>
          </Box>

          {/* Variation de taille */}
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" sx={{ minWidth: 130, textAlign: 'right' }}>
              Variation de taille :
            </Typography>
            <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
              <Slider
                value={granularVariation}
                min={0}
                max={100}
                step={1}
                onChange={(_, newValue) => {
                  setFieldValues((prev: any) => ({
                    ...prev,
                    granularVariation: newValue
                  }));
                }}
                onChangeCommitted={(_, newValue) => {
                  handleInputChange('granularVariation', String(newValue));
                }}
                sx={{ flex: 1 }}
              />
              <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                {granularVariation} %
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
        </AccordionDetails>
      </Accordion>
      </Box>
    </Box>
  );
}
