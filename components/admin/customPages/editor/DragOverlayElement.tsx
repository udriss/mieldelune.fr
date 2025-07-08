'use client';

import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { GripVertical } from 'lucide-react';
import { ContentElement } from './types';
import { getYouTubeVideoId, getVimeoVideoId } from './videoUtils';

interface DragOverlayElementProps {
  element: ContentElement;
}

export function DragOverlayElement({ element }: DragOverlayElementProps) {
  const getElementPreview = () => {
    switch (element.type) {
      case 'title':
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              📝 Titre {element.settings?.level ? `H${element.settings.level}` : 'H1'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: element.settings?.fontFamily || 'Montserrat',
                fontSize: `${element.settings?.fontSize || 24}px`,
                fontWeight: element.settings?.fontWeight || '600',
                color: '#333',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {element.content || 'Titre vide'}
            </Typography>
          </Box>
        );
      
      case 'text':
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              📄 Texte
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: element.settings?.fontFamily || 'Montserrat',
                fontSize: `${element.settings?.fontSize || 16}px`,
                fontWeight: element.settings?.fontWeight || '400',
                color: '#666',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {element.content || 'Texte vide'}
            </Typography>
          </Box>
        );
      
      case 'image':
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🖼️ Image
            </Typography>
            {element.content ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 40,
                    backgroundImage: `url(${element.content})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  {element.settings?.alt || 'Image sans description'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Aucune image sélectionnée
              </Typography>
            )}
          </Box>
        );
      
      case 'video':
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              🎥 Vidéo
            </Typography>
            {element.content ? (
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {getYouTubeVideoId(element.content) ? '📺 YouTube' :
                   getVimeoVideoId(element.content) ? '📺 Vimeo' :
                   '🎬 Fichier vidéo'}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    maxWidth: '300px'
                  }}
                >
                  {element.content}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Aucune vidéo sélectionnée
              </Typography>
            )}
          </Box>
        );
      
      default:
        return (
          <Typography variant="body1">
            Élément inconnu
          </Typography>
        );
    }
  };

  return (
    <Card 
      sx={{ 
        minWidth: 200,
        maxWidth: 300,
        opacity: 0.9,
        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
        border: '2px solid #3b82f6',
        cursor: 'grabbing',
        bgcolor: 'white',
        transform: 'rotate(2deg)',
        transformOrigin: 'center',
        pointerEvents: 'none',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <GripVertical size={20} color="#3b82f6" />
          <Chip 
            label={element.type}
            size="small"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="caption" color="primary" fontWeight={600}>
            🔄 Déplacement...
          </Typography>
        </Box>
        
        {getElementPreview()}
      </CardContent>
    </Card>
  );
}
