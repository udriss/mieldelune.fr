'use client';

import { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { Eye, EyeOff, Palette, ChevronDown } from 'lucide-react';
import { CustomPage } from './types';
import { GOOGLE_FONTS } from './constants';
import { ColorCircle } from './ColorCircle';

interface TitleSettingsProps {
  page: CustomPage;
  onUpdate: (page: CustomPage) => void;
}

export function TitleSettings({ page, onUpdate }: TitleSettingsProps) {
  return (
    <>
      {/* Titre de la page */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Informations de la page</Typography>
        <Box display="flex" gap={2} alignItems="start">
          <TextField
            fullWidth
            label="Titre de la page"
            value={page.title}
            onChange={(e) => onUpdate({ 
              ...page, 
              title: e.target.value,
              updatedAt: Date.now()
            })}
          />
          <IconButton
            onClick={() => onUpdate({ 
              ...page, 
              showTitle: !page.showTitle,
              updatedAt: Date.now()
            })}
            title={page.showTitle ? 'Masquer le titre sur la page' : 'Afficher le titre sur la page'}
            sx={{ 
              mt: 1,
              color: page.showTitle ? '#3b82f6' : '#9ca3af',
              border: '1px solid',
              borderColor: page.showTitle ? '#3b82f6' : '#e5e7eb'
            }}
          >
            {page.showTitle ? <Eye size={20} /> : <EyeOff size={20} />}
          </IconButton>
        </Box>
        <Typography variant="caption" color="textSecondary" mt={1}>
          {page.showTitle 
            ? 'Le titre sera affiché en haut de la page' 
            : 'Le titre sera masqué sur la page (visible uniquement dans l\'onglet du navigateur)'
          }
        </Typography>
      </Paper>

      {/* Personnalisation du titre - Accordéon */}
      <Accordion 
        expanded={page.showTitle !== false}
        onChange={(event, isExpanded) => {
          // Si on essaie d'ouvrir l'accordéon alors que le titre est masqué, on active d'abord le titre
          if (isExpanded && page.showTitle === false) {
            onUpdate({ 
              ...page, 
              showTitle: true,
              updatedAt: Date.now()
            });
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
            backgroundColor: page.showTitle === false ? '#f5f5f5' : 'white',
            opacity: page.showTitle === false ? 0.6 : 1,
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2
            }
          }}
        >
          <Palette size={20} />
          <Typography variant="h6">Personnalisation du titre</Typography>
          {page.showTitle === false && (
            <Chip 
              label="Titre masqué" 
              size="small" 
              color="warning" 
              sx={{ ml: 'auto', mr: 2 }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          {page.showTitle === false && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1, border: '1px solid #ffecb5' }}>
              <Typography variant="body2" color="warning.dark">
                ⚠️ Le titre est actuellement masqué. Les paramètres de personnalisation seront appliqués si vous réactivez l'affichage du titre.
              </Typography>
            </Box>
          )}
          
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Police du titre */}
            <Box>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Police du titre</InputLabel>
                <Select
                  value={page.titleSettings?.fontFamily || 'Montserrat'}
                  label="Police du titre"
                  onChange={(e) => onUpdate({
                    ...page,
                    titleSettings: {
                      ...page.titleSettings,
                      fontFamily: e.target.value
                    },
                    updatedAt: Date.now()
                  })}
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
            </Box>

            {/* Taille et graisse */}
            <Box display="flex" gap={3} alignItems="center">
              <Box flex={1}>
                <Typography variant="body2" mb={1}>
                  Taille: {page.titleSettings?.fontSize || 32}px
                </Typography>
                <Slider
                  value={page.titleSettings?.fontSize || 32}
                  onChange={(_, value) => onUpdate({
                    ...page,
                    titleSettings: {
                      ...page.titleSettings,
                      fontSize: Array.isArray(value) ? value[0] : value
                    },
                    updatedAt: Date.now()
                  })}
                  min={12}
                  max={120}
                  step={1}
                  size="small"
                />
              </Box>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Graisse</InputLabel>
                <Select
                  value={page.titleSettings?.fontWeight || 'bold'}
                  label="Graisse"
                  onChange={(e) => onUpdate({
                    ...page,
                    titleSettings: {
                      ...page.titleSettings,
                      fontWeight: e.target.value as any
                    },
                    updatedAt: Date.now()
                  })}
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
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">Couleur sélectionnée :</Typography>
              <ColorCircle
                color={page.titleSettings?.color || '#2563eb'}
                onChange={(color) => onUpdate({
                  ...page,
                  titleSettings: {
                    ...page.titleSettings,
                    color
                  },
                  updatedAt: Date.now()
                })}
              />
              <Typography variant="caption" color="textSecondary">
                {page.titleSettings?.color || '#2563eb'}
              </Typography>
            </Box>

            {/* Aperçu */}
            {useMemo(() => (
              <Box p={2} sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                bgcolor: page.showTitle === false ? '#f8f9fa' : 'white',
                opacity: page.showTitle === false ? 0.7 : 1
              }}>
                <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                  Aperçu du titre:
                </Typography>
                <Box
                  sx={{
                    fontFamily: page.titleSettings?.fontFamily ? 
                      `'${page.titleSettings.fontFamily}', Arial, sans-serif !important` : 
                      'Montserrat, Arial, sans-serif !important',
                    fontSize: `${page.titleSettings?.fontSize || 32}px !important`,
                    fontWeight: `${page.titleSettings?.fontWeight || 'bold'} !important`,
                    color: page.titleSettings?.color || '#2563eb',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    transition: 'font-family 0.3s ease, font-size 0.2s ease, font-weight 0.2s ease, color 0.2s ease',
                    minHeight: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {page.title || 'Titre de la page'}
                </Box>
              </Box>
            ), [
              page.titleSettings?.fontFamily,
              page.titleSettings?.fontSize,
              page.titleSettings?.fontWeight,
              page.titleSettings?.color,
              page.title,
              page.showTitle
            ])}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
