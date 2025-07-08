'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField,
  IconButton,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { 
  GripVertical,
  Trash2,
  Link,
  Upload,
  Eye
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { ContentElement } from './types';
import { TypographyCustomizer } from './TypographyCustomizer';
import { useLoadFontOnDemand } from './hooks';
import { getYouTubeVideoId, getVimeoVideoId, getVideoEmbedUrl } from './videoUtils';
import { CustomFileUploader } from '../CustomFileUploader';
import { MediaSelector } from '../MediaSelector';

interface PragmaticSortableContentElementProps {
  element: ContentElement;
  onUpdate: (element: ContentElement) => void;
  onDelete: (id: string) => void;
}

export function PragmaticSortableContentElement({ 
  element, 
  onUpdate, 
  onDelete 
}: PragmaticSortableContentElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dropEdge, setDropEdge] = useState<'top' | 'bottom' | null>(null);
  const [dragPreview, setDragPreview] = useState<HTMLElement | null>(null);

  const [uploadType, setUploadType] = useState<'url' | 'file' | 'existing' | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  useEffect(() => {
    const cardElement = ref.current;
    const dragHandle = dragHandleRef.current;
    
    if (!cardElement || !dragHandle) return;

    // Écouter l'événement de nettoyage des indicateurs
    const handleClearDropIndicators = () => {
      setDropEdge(null);
      setIsDragging(false);
    };

    window.addEventListener('clearDropIndicators', handleClearDropIndicators);

    const cleanup = combine(
      draggable({
        element: dragHandle,
        getInitialData: () => ({ 
          type: 'content-element',
          elementId: element.id,
          element: element
        }),
        onDragStart: () => {
          setIsDragging(true);
          
          // Créer un preview simple pour le drag
          if (cardElement) {
            const preview = cardElement.cloneNode(true) as HTMLElement;
            preview.style.position = 'fixed';
            preview.style.top = '-9999px';
            preview.style.left = '-9999px';
            preview.style.zIndex = '9999';
            preview.style.opacity = '0.8';
            preview.style.pointerEvents = 'none';
            preview.style.borderRadius = '8px';
            preview.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            document.body.appendChild(preview);
            setDragPreview(preview);
          }
        },
        onDrop: () => {
          setIsDragging(false);
          setDropEdge(null);
          
          // Nettoyer le preview
          if (dragPreview) {
            document.body.removeChild(dragPreview);
            setDragPreview(null);
          }
        },
      }),
      
      dropTargetForElements({
        element: cardElement,
        canDrop: ({ source }) => {
          return source.data.type === 'content-element' && 
                 source.data.elementId !== element.id;
        },
        getData: ({ input, element: dropElement }) => {
          // Calcul de l'edge basé sur la position de la souris - zones très sensibles
          const rect = dropElement.getBoundingClientRect();
          const mouseY = input.clientY;
          const elementTop = rect.top;
          const elementBottom = rect.bottom;
          const elementHeight = rect.height;
          
          // Zones de drop très généreuses :
          // - 40% du haut = 'top' 
          // - 40% du bas = 'bottom'
          // - 20% du centre = dépend de la position exacte
          const topZone = elementTop + (elementHeight * 0.4);
          const bottomZone = elementTop + (elementHeight * 0.6);
          
          let closestEdge: 'top' | 'bottom';
          
          if (mouseY < topZone) {
            closestEdge = 'top';
          } else if (mouseY > bottomZone) {
            closestEdge = 'bottom';
          } else {
            // Dans la zone centrale (20%), on utilise le centre exact
            const middleY = elementTop + (elementHeight / 2);
            closestEdge = mouseY < middleY ? 'top' : 'bottom';
          }
          
          return {
            type: 'content-element',
            elementId: element.id,
            closestEdge: closestEdge
          };
        },
        onDragEnter: ({ self }) => {
          const closestEdge = self.data.closestEdge;
          if (closestEdge === 'top' || closestEdge === 'bottom') {
            setDropEdge(closestEdge);
          }
        },
        onDrag: ({ self }) => {
          const closestEdge = self.data.closestEdge;
          if (closestEdge === 'top' || closestEdge === 'bottom') {
            setDropEdge(closestEdge);
          }
        },
        onDragLeave: () => {
          setDropEdge(null);
        },
      })
    );

    return () => {
      cleanup();
      window.removeEventListener('clearDropIndicators', handleClearDropIndicators);
    };
  }, [element.id, dragPreview]);

  useEffect(() => {
    if (tempUrl) {
      const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|[\da-z\.-]+\.[a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
      const isYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/i.test(tempUrl);
      const isVimeoUrl = /^(https?:\/\/)?(www\.)?vimeo\.com/i.test(tempUrl);
      const isGeneralUrl = urlPattern.test(tempUrl);
      
      setIsValidUrl(isYouTubeUrl || isVimeoUrl || isGeneralUrl);
    } else {
      setIsValidUrl(false);
    }
  }, [tempUrl]);

  const handleContentChange = (newContent: string) => {
    onUpdate({ ...element, content: newContent });
  };

  const handleSettingChange = (key: string, value: any) => {
    onUpdate({
      ...element,
      settings: { ...element.settings, [key]: value }
    });
  };

  const addMediaByUrl = () => {
    if (tempUrl.trim()) {
      handleContentChange(tempUrl.trim());
      setTempUrl('');
      setUploadType(null);
      toast.success('Vidéo ajoutée avec succès');
    } else {
      toast.error('Veuillez saisir une URL valide');
    }
  };

  const renderElementEditor = () => {
    const fontFamily = element.settings?.fontFamily || 'Montserrat';
    const fontSize = element.settings?.fontSize || (element.type === 'title' ? 24 : 16);
    const fontWeight = element.settings?.fontWeight || '400';
    const color = element.settings?.color || '#000000';

    useLoadFontOnDemand(fontFamily);

    switch (element.type) {
      case 'title':
        return (
          <Box>
            <Box display="flex" gap={2} mb={2}>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Niveau</InputLabel>
                <Select
                  value={element.settings?.level || 1}
                  label="Niveau"
                  onChange={(e) => handleSettingChange('level', e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <MenuItem key={level} value={level}>H{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              placeholder="Entrez votre titre"
              value={element.content}
              onChange={(e) => handleContentChange(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: `'${fontFamily}', Arial, sans-serif !important`,
                  fontSize: `${fontSize}px !important`,
                  fontWeight: `${fontWeight} !important`,
                  color: `${color} !important`,
                }
              }}
            />
            
            <TypographyCustomizer element={element} onUpdate={onUpdate} />
          </Box>
        );

      case 'text':
        return (
          <Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Entrez votre texte"
              value={element.content}
              onChange={(e) => handleContentChange(e.target.value)}
              variant="outlined"
              size="small"
              sx={{
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: `'${fontFamily}', Arial, sans-serif !important`,
                  fontSize: `${fontSize}px !important`,
                  fontWeight: `${fontWeight} !important`,
                  color: `${color} !important`,
                }
              }}
            />
            
            <TypographyCustomizer element={element} onUpdate={onUpdate} />
          </Box>
        );

      case 'image':
        return (
          <Box>
            {!element.content ? (
              <Box>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant={uploadType === 'url' ? 'contained' : 'outlined'}
                    startIcon={<Link />}
                    onClick={() => setUploadType('url')}
                    size="small"
                  >
                    Lien URL
                  </Button>
                  <Button
                    variant={uploadType === 'file' ? 'contained' : 'outlined'}
                    startIcon={<Upload />}
                    onClick={() => setUploadType('file')}
                    size="small"
                  >
                    Upload fichier
                  </Button>
                  <Button
                    variant={uploadType === 'existing' ? 'contained' : 'outlined'}
                    startIcon={<Eye />}
                    onClick={() => {
                      setUploadType('existing');
                      setShowMediaSelector(true);
                    }}
                    size="small"
                  >
                    Fichiers existants
                  </Button>
                </Box>

                {uploadType === 'url' && (
                  <Box display="flex" gap={2}>
                    <TextField
                      fullWidth
                      placeholder="URL de l'image"
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      size="small"
                      error={tempUrl.length > 0 && !isValidUrl}
                    />
                    <Button
                      variant="contained"
                      onClick={addMediaByUrl}
                      disabled={!isValidUrl}
                      size="small"
                    >
                      Ajouter
                    </Button>
                  </Box>
                )}

                {uploadType === 'file' && (
                  <CustomFileUploader
                    uploadType="image"
                    onUploadComplete={(url) => {
                      handleContentChange(url);
                      setUploadType(null);
                    }}
                    maxSize={25}
                  />
                )}
              </Box>
            ) : (
              <Box>
                <Box position="relative" mb={2}>
                  <Image 
                    src={element.content} 
                    alt={element.settings?.alt || 'Image'} 
                    width={300} 
                    height={200} 
                    style={{ 
                      borderRadius: 8,
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleContentChange('')}
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Texte alternatif (alt)"
                  value={element.settings?.alt || ''}
                  onChange={(e) => handleSettingChange('alt', e.target.value)}
                />
              </Box>
            )}
          </Box>
        );

      case 'video':
        return (
          <Box>
            {!element.content ? (
              <Box>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant={uploadType === 'url' ? 'contained' : 'outlined'}
                    startIcon={<Link />}
                    onClick={() => setUploadType('url')}
                    size="small"
                  >
                    Lien vidéo
                  </Button>
                  <Button
                    variant={uploadType === 'file' ? 'contained' : 'outlined'}
                    startIcon={<Upload />}
                    onClick={() => setUploadType('file')}
                    size="small"
                  >
                    Upload fichier
                  </Button>
                  <Button
                    variant={uploadType === 'existing' ? 'contained' : 'outlined'}
                    startIcon={<Eye />}
                    onClick={() => {
                      setUploadType('existing');
                      setShowMediaSelector(true);
                    }}
                    size="small"
                  >
                    Fichiers existants
                  </Button>
                </Box>

                {uploadType === 'url' && (
                  <Box>
                    <TextField
                      fullWidth
                      placeholder="URL de la vidéo (ex: https://www.youtube.com/watch?v=..."
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      size="small"
                      helperText="Formats supportés: YouTube, Vimeo, liens directs vers fichiers vidéo"
                      sx={{ mb: 1 }}
                    />
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        onClick={addMediaByUrl}
                        disabled={!tempUrl.trim()}
                        size="small"
                        fullWidth
                      >
                        Ajouter la vidéo
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setUploadType(null)}
                        size="small"
                      >
                        Annuler
                      </Button>
                    </Box>
                  </Box>
                )}

                {uploadType === 'file' && (
                  <CustomFileUploader
                    uploadType="video"
                    onUploadComplete={(url) => {
                      handleContentChange(url);
                      setUploadType(null);
                    }}
                    maxSize={500}
                  />
                )}
              </Box>
            ) : (
              <Box>
                <Box position="relative" mb={2} sx={{ textAlign: 'center' }}>
                  {(() => {
                    const embedUrl = getVideoEmbedUrl(element.content);
                    const isYouTubeOrVimeo = getYouTubeVideoId(element.content) || getVimeoVideoId(element.content);
                    const videoWidth = element.settings?.width === '50%' ? '50%' : '100%';
                    
                    if (isYouTubeOrVimeo && embedUrl) {
                      return (
                        <Box sx={{ 
                          position: 'relative', 
                          width: videoWidth,
                          margin: '0 auto',
                          maxWidth: '500px'
                        }}>
                          <iframe
                            width="100%"
                            height="300"
                            src={embedUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ borderRadius: 8 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleContentChange('')}
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      );
                    } else {
                      return (
                        <Box sx={{ 
                          position: 'relative', 
                          width: videoWidth,
                          margin: '0 auto',
                          maxWidth: '500px'
                        }}>
                          <video 
                            width="100%"
                            height="300"
                            controls={element.settings?.controls !== false}
                            autoPlay={element.settings?.autoplay || false}
                            style={{ borderRadius: 8 }}
                          >
                            <source src={element.content} />
                            Votre navigateur ne supporte pas cette vidéo.
                          </video>
                          <IconButton
                            size="small"
                            onClick={() => handleContentChange('')}
                            sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 8, 
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      );
                    }
                  })()}
                </Box>
                
                <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Largeur</InputLabel>
                    <Select
                      value={element.settings?.width || '100%'}
                      label="Largeur"
                      onChange={(e) => handleSettingChange('width', e.target.value)}
                    >
                      <MenuItem value="100%">100% (pleine largeur)</MenuItem>
                      <MenuItem value="50%">50% (demi-largeur)</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {!getYouTubeVideoId(element.content) && !getVimeoVideoId(element.content) && (
                    <>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Contrôles</InputLabel>
                        <Select
                          value={element.settings?.controls !== false ? 'true' : 'false'}
                          label="Contrôles"
                          onChange={(e) => handleSettingChange('controls', e.target.value === 'true')}
                        >
                          <MenuItem value="true">Afficher</MenuItem>
                          <MenuItem value="false">Masquer</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Lecture auto</InputLabel>
                        <Select
                          value={element.settings?.autoplay ? 'true' : 'false'}
                          label="Lecture auto"
                          onChange={(e) => handleSettingChange('autoplay', e.target.value === 'true')}
                        >
                          <MenuItem value="false">Non</MenuItem>
                          <MenuItem value="true">Oui</MenuItem>
                        </Select>
                      </FormControl>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      {/* Indicateur de drop "avant" - barre fine au-dessus de la carte */}
      {dropEdge === 'top' && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#2563eb',
            borderRadius: 1.5,
            zIndex: 1000,
            opacity: 0.9,
            boxShadow: '0 0 8px rgba(37, 99, 235, 0.6)',
          }}
        />
      )}
      
      <Card 
        ref={ref}
        elevation={isDragging ? 2 : 0}
        sx={{ 
          border: isDragging 
            ? '2px solid #2563eb' 
            : dropEdge 
            ? '2px solid #2563eb' 
            : '1px solid #e5e7eb',
          borderRadius: 2,
          background: isDragging 
            ? 'rgba(37, 99, 235, 0.05)' 
            : dropEdge === 'top'
            ? 'linear-gradient(to bottom, rgba(37, 99, 235, 0.1) 0%, rgba(37, 99, 235, 0.02) 50%, white 50%, white 100%)'
            : dropEdge === 'bottom'
            ? 'linear-gradient(to bottom, white 0%, white 50%, rgba(37, 99, 235, 0.02) 50%, rgba(37, 99, 235, 0.1) 100%)'
            : 'white',
          opacity: isDragging ? 0.6 : 1,
          transition: 'all 0.2s ease',
          transform: dropEdge ? 'scale(1.02)' : 'scale(1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box
              ref={dragHandleRef}
              sx={{ 
                cursor: isDragging ? 'grabbing' : 'grab',
                display: 'flex', 
                alignItems: 'center',
                p: 1,
                borderRadius: 1,
                bgcolor: 'rgba(107, 114, 128, 0.1)',
                '&:hover': { 
                  bgcolor: 'rgba(107, 114, 128, 0.15)',
                },
              }}
            >
              <GripVertical size={16} color="#6b7280" />
            </Box>
            
            <Chip 
              label={element.type}
              size="small"
              color="primary"
              variant="outlined"
            />
            
            <Box flex={1} />
            
            <IconButton 
              size="small" 
              onClick={() => onDelete(element.id)}
              color="error"
            >
              <Trash2 size={16} />
            </IconButton>
          </Box>
          
          {renderElementEditor()}
        </CardContent>
      </Card>
      
      {/* MediaSelector en dehors de la Card */}
      <MediaSelector
        open={showMediaSelector}
        onClose={() => {
          setShowMediaSelector(false);
          setUploadType(null);
        }}
        onSelect={(url) => {
          handleContentChange(url);
          setShowMediaSelector(false);
          setUploadType(null);
        }}
        mediaType={element.type === 'image' ? 'images' : 'videos'}
      />
      
      {/* Indicateur de drop "après" - barre fine et discrète */}
      {dropEdge === 'bottom' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -10,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: '#2563eb',
            borderRadius: 1,
            zIndex: 1000,
            opacity: 0.8,
            boxShadow: '0 0 4px rgba(37, 99, 235, 0.4)',
          }}
        />
      )}
    </Box>
  );
}
