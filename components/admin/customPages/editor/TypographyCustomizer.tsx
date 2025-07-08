'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Collapse
} from '@mui/material';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { ContentElement } from './types';
import { GOOGLE_FONTS } from './constants';
import { useLoadFontOnDemand, useAllGoogleFonts } from './hooks';
import { ColorCircle } from './ColorCircle';

interface TypographyCustomizerProps {
  element: ContentElement;
  onUpdate: (element: ContentElement) => void;
}

export function TypographyCustomizer({ element, onUpdate }: TypographyCustomizerProps) {
  const [showCustomization, setShowCustomization] = useState(false);
  const fontFamily = element.settings?.fontFamily || 'Montserrat';
  const fontSize = element.settings?.fontSize || (element.type === 'title' ? 24 : 16);
  const fontWeight = element.settings?.fontWeight || '400';
  const color = element.settings?.color || '#000000';

  // Charger la police actuelle pour la prévisualisation
  useLoadFontOnDemand(fontFamily);
  
  // Charger seulement les polices essentielles pour l'aperçu dans le select
  useAllGoogleFonts();

  const handleSettingChange = (key: string, value: any) => {
    onUpdate({
      ...element,
      settings: { ...element.settings, [key]: value }
    });

    // Si on change la police, la charger de manière optimisée
    if (key === 'fontFamily' && value !== 'Arial' && value !== 'Times New Roman') {
      useLoadFontOnDemand(value);
    }
  };

  if (element.type !== 'title' && element.type !== 'text') {
    return null;
  }

  return (
    <Box>
      <Button
        size="small"
        startIcon={<Palette />}
        endIcon={showCustomization ? <ChevronUp /> : <ChevronDown />}
        onClick={() => setShowCustomization(!showCustomization)}
        sx={{ mb: 1 }}
      >
        Personnaliser la typographie
      </Button>
      
      <Collapse in={showCustomization}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f9fafb' }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Police</InputLabel>
              <Select
                value={fontFamily}
                label="Police"
                onChange={(e) => handleSettingChange('fontFamily', e.target.value)}
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
                {GOOGLE_FONTS.map(font => (
                  <MenuItem 
                    key={font} 
                    value={font} 
                    sx={{ 
                      fontFamily: `'${font}', Arial, sans-serif !important`,
                      fontSize: '14px !important',
                      fontWeight: '400 !important'
                    }}
                  >
                    {font}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ minWidth: 120 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Taille: {fontSize}px
              </Typography>
              <Slider
                value={fontSize}
                onChange={(e, value) => handleSettingChange('fontSize', value)}
                min={element.type === 'title' ? 14 : 10}
                max={element.type === 'title' ? 48 : 28}
                step={1}
                size="small"
              />
            </Box>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Graisse</InputLabel>
              <Select
                value={fontWeight}
                label="Graisse"
                onChange={(e) => handleSettingChange('fontWeight', e.target.value)}
              >
                <MenuItem value="300">Light</MenuItem>
                <MenuItem value="400">Normal</MenuItem>
                <MenuItem value="500">Medium</MenuItem>
                <MenuItem value="600">Semi-bold</MenuItem>
                <MenuItem value="700">Bold</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {/* Couleur */}
          <Box display="flex" alignItems="center" gap={2} mt={2}>
            <Typography variant="body2">
              Couleur du {element.type === 'title' ? 'titre' : 'texte'} :
            </Typography>
            <ColorCircle
              color={color}
              onChange={(newColor) => handleSettingChange('color', newColor)}
            />
            <Typography variant="caption" color="textSecondary">
              {color}
            </Typography>
          </Box>
          
          {/* Aperçu */}
          <Box mt={2} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'white' }}>
            <Typography variant="caption" color="textSecondary" display="block" mb={1}>
              Aperçu:
            </Typography>
            <Box
              key={`${fontFamily}-${fontSize}-${fontWeight}-${color}`} // Force re-render quand les propriétés changent
              sx={{
                fontFamily: `'${fontFamily}', Arial, sans-serif !important`,
                fontSize: `${fontSize}px !important`,
                fontWeight: `${fontWeight} !important`,
                color: color,
                lineHeight: 1.4,
                transition: 'all 0.2s ease' // Animation fluide
              }}
            >
              {element.content || 'Exemple de texte...'}
            </Box>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
}
