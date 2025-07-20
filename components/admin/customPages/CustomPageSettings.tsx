'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  Paper,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Chip,
  Alert,
  Divider,
  Select,
  MenuItem,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Copy,
  ExternalLink,
  Settings as SettingsIcon,
  Palette,
  ChevronDown,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import { CustomPage, ContentElement } from './editor';

// Cache global pour éviter les rechargements de polices
const loadedFonts = new Set<string>();

// Hook pour charger dynamiquement les Google Fonts du titre
function useTitleGoogleFont(fontFamily: string) {
  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman') {
      return;
    }

    // Vérifier si la police est déjà chargée
    if (loadedFonts.has(fontFamily)) {
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

// Composant ColorCircle amélioré avec react-colorful
const ColorCircle = ({ color, onChange }: { color: string, onChange: (val: string) => void }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const [colorMode, setColorMode] = useState<'hex' | 'rgba'>('hex');

  useEffect(() => {
    setTempColor(color);
  }, [color]);

  const parseRgbaColor = (colorStr: string) => {
    if (colorStr.startsWith('rgba')) {
      const match = colorStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: parseFloat(match[4])
        };
      }
    }
    return { r: 255, g: 0, b: 0, a: 1 };
  };

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor);
  };

  const handleRgbaChange = (newRgba: { r: number, g: number, b: number, a: number }) => {
    const rgbaString = `rgba(${newRgba.r}, ${newRgba.g}, ${newRgba.b}, ${newRgba.a})`;
    setTempColor(rgbaString);
  };

  const handleClick = () => {
    setIsPickerOpen(!isPickerOpen);
  };

  const handleConfirm = () => {
    onChange(tempColor);
    setIsPickerOpen(false);
  };

  const handleCancel = () => {
    setTempColor(color);
    setIsPickerOpen(false);
  };

  return (
    <Box position="relative" display="inline-block">
      <Box
        onClick={handleClick}
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: color,
          border: '2px solid #bbb',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 0 8px #0003'
          }
        }}
        title={`Couleur actuelle: ${color}`}
      />

      {isPickerOpen && (
        <Box
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
            minWidth: 300
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle2">Choisir une couleur</Typography>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                variant={colorMode === 'hex' ? 'contained' : 'outlined'}
                onClick={() => setColorMode('hex')}
              >
                HEX
              </Button>
              <Button
                size="small"
                variant={colorMode === 'rgba' ? 'contained' : 'outlined'}
                onClick={() => setColorMode('rgba')}
              >
                RGBA
              </Button>
            </Box>
          </Box>
          
          {colorMode === 'hex' ? (
            <HexColorPicker
              color={tempColor.startsWith('#') ? tempColor : '#ff0000'}
              onChange={handleColorChange}
            />
          ) : (
            <RgbaColorPicker
              color={tempColor.startsWith('rgba') ? parseRgbaColor(tempColor) : { r: 255, g: 0, b: 0, a: 1 }}
              onChange={handleRgbaChange}
            />
          )}
          
          <TextField
            fullWidth
            label="Code couleur"
            value={tempColor}
            onChange={(e) => setTempColor(e.target.value)}
            size="small"
            sx={{ my: 2 }}
          />

          <Box display="flex" justifyContent="space-between" gap={1}>
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={handleCancel}
            >
              Annuler
            </Button>
            <Button 
              size="small" 
              variant="contained"
              onClick={handleConfirm}
            >
              Confirmer
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

interface CustomPageSettingsProps {
  page: CustomPage;
  onSave: (page: CustomPage) => void;
  onSlugGenerate: () => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

export function CustomPageSettings({ page, onSave, onSlugGenerate, onUnsavedChanges }: CustomPageSettingsProps) {
  const [editedPage, setEditedPage] = useState<CustomPage>(page);
  const [showPassword, setShowPassword] = useState(false);
  const [customSlug, setCustomSlug] = useState(page.slug);
  const [slugError, setSlugError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Synchroniser les données quand la page change depuis l'extérieur
  useEffect(() => {
    setEditedPage(page);
    setCustomSlug(page.slug);
    setHasUnsavedChanges(false); // Reset changes when page changes
  }, [page]);

  // Détecter les changements
  useEffect(() => {
    const hasChanges = JSON.stringify(editedPage) !== JSON.stringify(page) || customSlug !== page.slug;
    setHasUnsavedChanges(hasChanges);
    
    // Notifier le parent des changements non sauvegardés
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [editedPage, customSlug, page, onUnsavedChanges]);

  // Charger la police du titre dynamiquement avec optimisation
  const titleFontToLoad = useMemo(() => 
    editedPage.titleSettings?.fontFamily || 'Montserrat', 
    [editedPage.titleSettings?.fontFamily]
  );
  
  useTitleGoogleFont(titleFontToLoad);

  // Hook pour charger dynamiquement les Google Fonts du titre
  useEffect(() => {
    if (!editedPage.titleSettings?.fontFamily || editedPage.titleSettings.fontFamily === 'Arial' || editedPage.titleSettings.fontFamily === 'Times New Roman') {
      return;
    }

    const fontId = `google-font-title-${editedPage.titleSettings.fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    let link = document.getElementById(fontId) as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(editedPage.titleSettings.fontFamily)}:wght@300;400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [editedPage.titleSettings?.fontFamily]);

  const validateSlug = (slug: string) => {
    if (!slug) {
      setSlugError('Le slug est requis');
      return false;
    }
    
    if (slug.length < 3) {
      setSlugError('Le slug doit contenir au moins 3 caractères');
      return false;
    }
    
    if (slug.length > 50) {
      setSlugError('Le slug ne peut pas dépasser 50 caractères');
      return false;
    }
    
    const slugPattern = /^[a-zA-Z0-9-_]+$/;
    if (!slugPattern.test(slug)) {
      setSlugError('Le slug ne peut contenir que des lettres, chiffres, tirets et underscores');
      return false;
    }
    
    setSlugError('');
    return true;
  };

  const handleSlugChange = (newSlug: string) => {
    setCustomSlug(newSlug);
    if (validateSlug(newSlug)) {
      setEditedPage(prev => ({
        ...prev,
        slug: newSlug,
        isRandomSlug: false,
        updatedAt: Date.now()
      }));
    }
  };

  const generateRandomSlug = () => {
    onSlugGenerate();
    // Synchroniser immédiatement avec les nouvelles données
    setTimeout(() => {
      setCustomSlug(page.slug);
      setEditedPage(prev => ({
        ...prev,
        slug: page.slug,
        isRandomSlug: true,
        updatedAt: Date.now()
      }));
    }, 100);
  };

  const togglePasswordProtection = () => {
    const newValue = !editedPage.isPasswordProtected;
    setEditedPage(prev => ({
      ...prev,
      isPasswordProtected: newValue,
      password: newValue ? (prev.password || '') : undefined,
      updatedAt: Date.now()
    }));
  };

  const togglePublished = () => {
    setEditedPage(prev => ({
      ...prev,
      isPublished: !prev.isPublished,
      updatedAt: Date.now()
    }));
  };

  const handlePasswordChange = (newPassword: string) => {
    setEditedPage(prev => ({
      ...prev,
      password: newPassword,
      updatedAt: Date.now()
    }));
  };

  const copyPageUrl = () => {
    const url = `${window.location.origin}/page/${customSlug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiée dans le presse-papiers');
  };

  const openPageInNewTab = () => {
    if (editedPage.isPublished) {
      window.open(`/page/${customSlug}`, '_blank');
    } else {
      toast.info('La page doit être publiée pour être visualisée');
    }
  };

  const handleSave = () => {
    if (!validateSlug(customSlug)) {
      return;
    }
    
    if (editedPage.isPasswordProtected && !editedPage.password) {
      toast.error('Un mot de passe est requis pour une page protégée');
      return;
    }

    onSave(editedPage);
    setHasUnsavedChanges(false); // Reset changes after successful save
    // toast.success('Paramètres sauvegardés');
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Barre sticky avec bouton de sauvegarde */}
      <Box 
        sx={{
          position: 'sticky',
          top: 60, // Décalé pour laisser place aux tabs (hauteur approximative)
          zIndex: 1000,
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          px: 3,
          py: 2,
          mb: 3,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Paramètres de la page {' '}
            <span
              style={{
                fontFamily: editedPage.titleSettings?.fontFamily
                  ? `'${editedPage.titleSettings.fontFamily}', Arial, sans-serif`
                  : 'Montserrat, Arial, sans-serif',
                color: editedPage.titleSettings?.color || '#333333',
              }}
            >
              {editedPage.title}
            </span>
          </Typography>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => {
                // Réinitialiser les changements
                setEditedPage(page);
                setCustomSlug(page.slug);
                setHasUnsavedChanges(false);
                // Notifier le parent qu'il n'y a plus de changements
                if (onUnsavedChanges) {
                  onUnsavedChanges(false);
                }
              }}
              startIcon={<X />}
              disabled={!hasUnsavedChanges}
              size="small"
            >
              Annuler modifications
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Save />}
              onClick={handleSave}
              size="small"
              sx={{ 
                bgcolor: hasUnsavedChanges ? '#f97316' : '#3b82f6', 
                '&:hover': { bgcolor: hasUnsavedChanges ? '#ea580c' : '#2563eb' },
                transition: 'background-color 0.3s ease'
              }}
            >
              {hasUnsavedChanges ? 'Sauvegarder modifications' : 'Sauvegarder'}
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {/* Informations générales */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <SettingsIcon size={20} />
            <Typography variant="h6">Informations générales</Typography>
          </Box>
        
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" gap={2} alignItems="start">
            <TextField
              fullWidth
              label="Titre de la page"
              value={editedPage.title}
              onChange={(e) => setEditedPage(prev => ({ 
                ...prev, 
                title: e.target.value,
                updatedAt: Date.now()
              }))}
              helperText="Ce titre sera affiché dans l'onglet du navigateur"
            />
            <IconButton
              onClick={() => setEditedPage(prev => ({ 
                ...prev, 
                showTitle: !prev.showTitle,
                updatedAt: Date.now()
              }))}
              title={editedPage.showTitle ? 'Masquer le titre sur la page' : 'Afficher le titre sur la page'}
              sx={{ 
                mt: 1,
                color: editedPage.showTitle ? '#3b82f6' : '#9ca3af',
                border: '1px solid',
                borderColor: editedPage.showTitle ? '#3b82f6' : '#e5e7eb'
              }}
            >
              {editedPage.showTitle ? <Eye size={20} /> : <EyeOff size={20} />}
            </IconButton>
          </Box>
          {!editedPage.showTitle && (
            <Typography variant="caption" color="warning.main" sx={{ mt: -2, ml: 2 }}>
              ⚠️ Le titre sera masqué sur la page (visible uniquement dans l'onglet du navigateur)
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Personnalisation du titre - Accordéon */}
      <Accordion 
        expanded={editedPage.showTitle !== false}
        onChange={(event, isExpanded) => {
          // Si on essaie d'ouvrir l'accordéon alors que le titre est masqué, on active d'abord le titre
          if (isExpanded && editedPage.showTitle === false) {
            setEditedPage(prev => ({ 
              ...prev, 
              showTitle: true,
              updatedAt: Date.now()
            }));
          }
        }}
        sx={{ 
          mb: 3,
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
          border: '1px solid #e0e0e0',
          '&.Mui-expanded': {
            margin: '0 0 24px 0',
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ChevronDown />}
          sx={{
            backgroundColor: editedPage.showTitle === false ? '#f5f5f5' : 'white',
            opacity: editedPage.showTitle === false ? 0.6 : 1,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            }
          }}
        >
          <Palette size={20} />
          <Typography variant="h6">Personnalisation du titre</Typography>
          {editedPage.showTitle === false && (
            <Chip 
              label="Titre masqué" 
              size="small" 
              color="warning" 
              sx={{ ml: 'auto', mr: 2 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          {editedPage.showTitle === false && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffecb5' }}>
              <Typography variant="body2" color="warning.dark">
                ⚠️ Le titre est actuellement masqué. Les paramètres de personnalisation seront appliqués si vous réactivez l'affichage du titre.
              </Typography>
            </Box>
          )}
          
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Police du titre */}
            <FormControl fullWidth>
              <InputLabel>Police du titre</InputLabel>
              <Select
                value={editedPage.titleSettings?.fontFamily || 'Montserrat'}
                onChange={(e) => setEditedPage(prev => ({
                  ...prev,
                  titleSettings: {
                    ...prev.titleSettings,
                    fontFamily: e.target.value
                  },
                  updatedAt: Date.now()
                }))}
                label="Police du titre"
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

            {/* Taille de police du titre */}
            <Box>
              <Typography variant="body2" mb={1}>
                Taille de police du titre
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                  value={editedPage.titleSettings?.fontSize || 32}
                  min={12}
                  max={120}
                  step={1}
                  onChange={(_, newValue) => {
                    setEditedPage(prev => ({
                      ...prev,
                      titleSettings: {
                        ...prev.titleSettings,
                        fontSize: Array.isArray(newValue) ? newValue[0] : newValue
                      },
                      updatedAt: Date.now()
                    }));
                  }}
                  sx={{ flex: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                  {editedPage.titleSettings?.fontSize || 32}px
                </Typography>
              </Box>
            </Box>

            {/* Graisse de police du titre */}
            <FormControl fullWidth>
              <InputLabel>Graisse de police</InputLabel>
              <Select
                value={editedPage.titleSettings?.fontWeight || '600'}
                onChange={(e) => setEditedPage(prev => ({
                  ...prev,
                  titleSettings: {
                    ...prev.titleSettings,
                    fontWeight: e.target.value as any
                  },
                  updatedAt: Date.now()
                }))}
                label="Graisse de police"
              >
                <MenuItem value="300">Léger</MenuItem>
                <MenuItem value="400">Normal</MenuItem>
                <MenuItem value="500">Médium</MenuItem>
                <MenuItem value="600">Semi-gras</MenuItem>
                <MenuItem value="700">Gras</MenuItem>
                <MenuItem value="800">Très gras</MenuItem>
              </Select>
            </FormControl>

            {/* Couleur du titre */}
            <Box>
              <Typography variant="body2" mb={1}>
                Couleur du titre
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <ColorCircle
                  color={editedPage.titleSettings?.color || '#333333'}
                  onChange={(newColor) => setEditedPage(prev => ({
                    ...prev,
                    titleSettings: {
                      ...prev.titleSettings,
                      color: newColor
                    },
                    updatedAt: Date.now()
                  }))}
                />
                <Typography variant="body2" color="text.secondary">
                  {editedPage.titleSettings?.color || '#333333'}
                </Typography>
              </Box>
            </Box>

            {/* Aperçu du titre */}
            {useMemo(() => (
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 2, 
                bgcolor: editedPage.showTitle === false ? '#f8f9fa' : '#fafafa',
                opacity: editedPage.showTitle === false ? 0.7 : 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Aperçu du titre
                </Typography>
                <Box
                  sx={{
                    fontFamily: editedPage.titleSettings?.fontFamily ? 
                      `'${editedPage.titleSettings.fontFamily}', Arial, sans-serif !important` : 
                      'Montserrat, Arial, sans-serif !important',
                    fontSize: `${editedPage.titleSettings?.fontSize || 32}px !important`,
                    fontWeight: `${editedPage.titleSettings?.fontWeight || '600'} !important`,
                    color: editedPage.titleSettings?.color || '#333333',
                    lineHeight: 1.2,
                    transition: 'font-family 0.3s ease, font-size 0.2s ease, font-weight 0.2s ease, color 0.2s ease',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {editedPage.title || 'Titre de la page'}
                </Box>
              </Box>
            ), [
              editedPage.titleSettings?.fontFamily,
              editedPage.titleSettings?.fontSize,
              editedPage.titleSettings?.fontWeight,
              editedPage.titleSettings?.color,
              editedPage.title,
              editedPage.showTitle
            ])}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* URL et accès */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>URL et accès</Typography>
        
        <Box display="flex" flexDirection="column" gap={3}>
            <Box>
            <Typography variant="subtitle2" color="textSecondary" mb={1}>
              URL de la page
            </Typography>
            <Box display="flex" gap={2} alignItems="start">
              <TextField
              fullWidth
              label="Slug de la page"
              value={customSlug}
              onChange={(e) => handleSlugChange(e.target.value)}
              error={!!slugError}
              helperText={slugError || `URL: ${window.location.origin}/page/${customSlug}`}
              slotProps={{
                input: {
                startAdornment: (
                  <InputAdornment position="start">
                  <Typography variant="body2" color="textSecondary">
                    {window.location.origin}/page/
                  </Typography>
                  </InputAdornment>
                ),
                },
              }}
              />
              <Button
              variant="outlined"
              onClick={generateRandomSlug}
              startIcon={<RefreshCw />}
              sx={{ minWidth: 'auto', height: 56 }}
              >
              Générer
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Vous pouvez saisir votre propre code ou cliquer sur <Typography component="span" variant="overline" sx={{ fontSize: 'inherit' }}>"Générer"</Typography> pour obtenir un code aléatoire.
            </Typography>
            
            {editedPage.isRandomSlug && (
              <Chip 
                label="Slug généré automatiquement" 
                size="small" 
                color="info" 
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* Statut de publication dans la section URL et accès */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" mb={1}>
              Statut de publication
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editedPage.isPublished}
                    onChange={togglePublished}
                    color="primary"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    {editedPage.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                    {editedPage.isPublished ? 'Page publiée' : 'Page en brouillon'}
                  </Box>
                }
              />
              {editedPage.isPublished ? (
                <Chip 
                  label="✓ Accessible publiquement" 
                  size="small" 
                  color="success" 
                />
              ) : (
                <Chip 
                  label="⚠ Non accessible" 
                  size="small" 
                  color="warning" 
                />
              )}
            </Box>
          </Box>

          {/* Actions sur l'URL */}
          <Box>
            <Typography variant="subtitle2" color="textSecondary" mb={1}>
              Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Copy />}
                onClick={copyPageUrl}
                size="small"
              >
                Copier l'URL
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExternalLink />}
                onClick={openPageInNewTab}
                disabled={!editedPage.isPublished}
                size="small"
              >
                Ouvrir dans un nouvel onglet
              </Button>
            </Box>
            
            {!editedPage.isPublished && (
              <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                💡 Astuce : Publiez la page pour pouvoir l'ouvrir dans un nouvel onglet et la rendre accessible aux visiteurs
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Protection par mot de passe */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Protection par mot de passe</Typography>
        
        <Box display="flex" flexDirection="column" gap={3}>
          <FormControlLabel
            control={
              <Switch
                checked={editedPage.isPasswordProtected}
                onChange={togglePasswordProtection}
                color="primary"
              />
            }
            label={
                <Box display="flex" alignItems="center" gap={1}>
                {editedPage.isPasswordProtected ? <Lock size={16} /> : <Unlock size={16} />}
                <Typography
                  sx={
                  editedPage.isPasswordProtected
                    ? { color: 'error.main', fontWeight: 700 }
                    : { color: 'success.main', fontWeight: 500 }
                  }
                >
                  {editedPage.isPasswordProtected
                  ? 'Page protégée par mot de passe'
                  : 'Accès libre à la page'}
                </Typography>
                </Box>
            }
          />

          {editedPage.isPasswordProtected && (
            <FormControl fullWidth variant="outlined">
              <InputLabel>Mot de passe</InputLabel>
              <OutlinedInput
                type={showPassword ? 'text' : 'password'}
                value={editedPage.password || ''}
                onChange={(e) => handlePasswordChange(e.target.value)}
                label="Mot de passe"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          )}

          {editedPage.isPasswordProtected && (
            <Alert severity="warning">
              Les visiteurs devront entrer ce mot de passe pour accéder à la page
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Statistiques */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Informations</Typography>
        
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Créé le
            </Typography>
            <Typography variant="body2">
              {new Date(editedPage.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Dernière modification
            </Typography>
            <Typography variant="body2">
              {new Date(editedPage.updatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Box>
          
          <Divider />
          
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="textSecondary">
              Nombre d'éléments
            </Typography>
            <Typography variant="body2">
              {editedPage.content.length}
            </Typography>
          </Box>
        </Box>
      </Paper>
      </Box>
    </Box>
  );
}
