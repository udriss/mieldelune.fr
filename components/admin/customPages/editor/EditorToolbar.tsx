'use client';

import { Box, Typography, Button } from '@mui/material';
import { Type, FileText, Image as ImageIcon, Video, Save, X } from 'lucide-react';
import { ContentElement } from './types';

interface TitleSettings {
  fontFamily?: string;
  color?: string;
}

interface EditorToolbarProps {
  title: string;
  titleSettings?: TitleSettings;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  onReset?: () => void; // Nouvelle prop pour réinitialiser sans changer d'onglet
  onAddElement: (type: ContentElement['type']) => void;
}

export function EditorToolbar({ title, titleSettings, hasUnsavedChanges, onSave, onCancel, onReset, onAddElement }: EditorToolbarProps) {
  return (
    <Box 
      sx={{
        position: 'sticky',
        top: 60,
        zIndex: 1002, // Au-dessus des deux barres Tabs
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        px: 3,
        py: 2,
        mb: 3
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Édition de la page {' '}
          <span
            style={{
              fontFamily: titleSettings?.fontFamily
                ? `'${titleSettings.fontFamily}', Arial, sans-serif`
                : 'Montserrat, Arial, sans-serif',
              color: titleSettings?.color || '#333333',
            }}
          >
            {title}
          </span>
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={onReset || onCancel}
            startIcon={<X />}
            disabled={onReset && !hasUnsavedChanges}
            size="small"
          >
            {onReset ? 'Annuler modifications' : 'Annuler'}
          </Button>
          <Button
            variant="contained"
            onClick={onSave}
            startIcon={<Save />}
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

      {/* Boutons d'ajout d'éléments */}
      <Box display="flex" gap={2} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          startIcon={<Type />}
          onClick={() => onAddElement('title')}
        >
          Titre
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileText />}
          onClick={() => onAddElement('text')}
        >
          Texte
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ImageIcon />}
          onClick={() => onAddElement('image')}
        >
          Image
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Video />}
          onClick={() => onAddElement('video')}
        >
          Vidéo
        </Button>
      </Box>
    </Box>
  );
}
