import { useState, useEffect } from 'react';
import { Image as MuiImage } from '@mui/icons-material';
import { Loader2, ExternalLink } from "lucide-react";
import Slider from '@mui/material/Slider';
import { toast } from 'react-toastify';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { FileUploader } from '@/components/admin/admin-file-uploader';
import { myFetch } from '@/lib/fetch-wrapper';
import { 
  Paper, 
  Typography, 
  IconButton, 
  Box, 
  Grid, 
  Chip,
  LinearProgress,
  Collapse,
  Button as MuiButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  BarChartOutlined, 
  CompressOutlined,
  StopOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  ArrowForwardOutlined,
  ZoomInOutlined
} from '@mui/icons-material';


interface CompressionStat {
  imageName: string;
  originalSize: number;
  finalSize: number;
  compressionRate: number;
  targetSize: number;
}

interface CoverImageSectionProps {
  editedWedding: Wedding;
  setEditedWedding: React.Dispatch<React.SetStateAction<Wedding | null>>;
  newImageUrlCover: string;
  setNewImageUrlCover: React.Dispatch<React.SetStateAction<string>>;
  isValidUrlCover: boolean;
  setIsValidUrlCover: React.Dispatch<React.SetStateAction<boolean>>;
  handleUrlChangeCover: (e: { target: { value: string } }) => void;
  uploadType: 'url' | 'regularFile' | 'coverUrl' | 'coverFile' | 'coverThumbnail' | null;
  setUploadType: React.Dispatch<React.SetStateAction<'url' | 'regularFile' | 'coverUrl' | 'coverFile' | 'coverThumbnail' | null>>;
  showAddCoverImage: boolean;
  setShowAddCoverImage: React.Dispatch<React.SetStateAction<boolean>>;
  handleAddImageByUrl: (fileTypeReceived: 'link' | 'coverLink') => Promise<void>;
  handleUploadComplete: (image: WeddingImage) => void;
  resizeValueCover: number;
  setResizeValueCover: React.Dispatch<React.SetStateAction<number>>;
  updateKey: number;
  setUpdateKey: React.Dispatch<React.SetStateAction<number>>;
  selectedWedding: string;
  isProcessingCoverThumbnails: boolean;
  onDataRefresh?: () => void;
}

export function CoverImageSection({
  editedWedding,
  setEditedWedding,
  newImageUrlCover,
  setNewImageUrlCover,
  isValidUrlCover,
  setIsValidUrlCover,
  handleUrlChangeCover,
  uploadType,
  setUploadType,
  showAddCoverImage,
  setShowAddCoverImage,
  handleAddImageByUrl,
  handleUploadComplete,
  resizeValueCover,
  setResizeValueCover,
  updateKey,
  setUpdateKey,
  selectedWedding,
  isProcessingCoverThumbnails,
  onDataRefresh,
}: CoverImageSectionProps) {
  const [isProcessingCoverThumbnail, setIsProcessingCoverThumbnail] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStat | null>(null);
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTabValue, setPreviewTabValue] = useState(0);

  // Nettoyer les stats quand on change de mariage (basé sur l'ID du mariage)
  const [lastWeddingId, setLastWeddingId] = useState<number | null>(null);
  
  useEffect(() => {
    if (editedWedding && editedWedding.id !== lastWeddingId) {
      setCompressionStats(null);
      setShowStatsDetails(false);
      setLastWeddingId(editedWedding.id);
    }
  }, [editedWedding?.id, lastWeddingId]);

  const generateCoverThumbnail = async () => {
    if (!editedWedding?.coverImage) return;
  
    setIsProcessingCoverThumbnail(true);
    setCompressionStats(null);
    setThumbnailProgress(0);
    
    try {
      // Simuler le progrès pendant le traitement
      const progressInterval = setInterval(() => {
        setThumbnailProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      const response = await fetch('/api/generate-thumbnail/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editedWedding.folderId,
          imageUrl: editedWedding.coverImage.fileUrl,
          resizePercentage: resizeValueCover,
          isCover: true
        }),
      });

      clearInterval(progressInterval);
      setThumbnailProgress(100);
  
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        toast.error(`Échec de la génération de la vignette : ${data.error || 'Erreur inconnue'}`, {
          position: "top-center",
          autoClose: 2000,
          style: {
            width: '400px'
          }
        });
        return;
      }

      // Créer les statistiques de compression
      if (data.originalSizeKB && data.finalSizeKB) {
        const fileName = editedWedding.coverImage.fileUrl.split('/').pop() || '';
        // Extraire le nom et l'extension
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        let imageName = fileName.replace(/\.\w+$/, ''); // Retirer l'extension temporairement
        
        // Retirer le timestamp du début (format: 1745416603190-nom_image)
        if (imageName.includes('-')) {
          const dashIndex = imageName.indexOf('-');
          imageName = imageName.substring(dashIndex + 1);
        }
        
        // Remettre l'extension
        const fullImageName = `${imageName}${fileExtension}`;
        
        // Calcul correct du taux de compression
        const compressionRate = data.finalSizeKB < data.originalSizeKB 
          ? Math.round((1 - data.finalSizeKB / data.originalSizeKB) * 100)
          : Math.round((data.finalSizeKB / data.originalSizeKB - 1) * 100); // Expansion si plus grand
        
        setCompressionStats({
          imageName: fullImageName,
          originalSize: data.originalSizeKB, // Déjà en KB
          finalSize: data.finalSizeKB, // Déjà en KB
          compressionRate,
          targetSize: data.targetSizeKB // Déjà en KB
        });
        setShowStatsDetails(true);
      }
  
      // Prepare the thumbnail file name with timestamp
      const fileName = editedWedding.coverImage.fileUrl.split('/').pop();
      const fileExtension = fileName?.substring(fileName.lastIndexOf('.'));
      const fileNameWithoutExt = fileName?.substring(0, fileName.lastIndexOf('.'));
      const timestamp = Date.now();
      const thumbFileName = `${fileNameWithoutExt}_THUMBEL_${timestamp}${fileExtension}`;
  
      // Update cover image with new thumbnail URL
      setEditedWedding((prev) => {
        if (!prev) return null;
        if (!prev.coverImage) return prev; 
        return {
          ...prev,
          coverImage: {
            ...prev.coverImage,
            fileUrlThumbnail: `/${editedWedding.folderId}/thumbnails/${thumbFileName}`
          }
        };
      });

      // Force une mise à jour de l'image en incrémentant imageRefreshKey
      setImageRefreshKey(prev => prev + 1);
      setUpdateKey(prev => prev + 1);
      
      // Forcer le rafraîchissement de l'état du wedding pour mettre à jour l'URL
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
          // Forcer un second refresh pour s'assurer que l'URL est bien mise à jour
          setTimeout(() => {
            setImageRefreshKey(prev => prev + 1);
          }, 500);
        }, 500);
      }
  
      const durationInSeconds = (data.duration / 1000).toFixed(1);
      toast.success(`✨ Vignette produite en ${durationInSeconds} s`, {
        position: "top-center",
        autoClose: 1500,
      });
  
    } catch (error) {
      setThumbnailProgress(0);
      toast.error(`Erreur : ${error instanceof Error ? error.message : 'Erreur inconnue'}`, {
        position: "top-center",
        autoClose: 2000,
      });
    } finally {
      setIsProcessingCoverThumbnail(false);
      setTimeout(() => setThumbnailProgress(0), 2000);
    }
  };

  const handleGenerateThumbnails = () => {
    generateCoverThumbnail();
  };

  const getImageUrl = (image: WeddingImage, thumbnail: boolean = true, disableCache: boolean = true) => {
    if (image.fileType === 'storage' || image.fileType === 'coverStorage') {
      const url = thumbnail && image.fileUrlThumbnail ? 
        image.fileUrlThumbnail : 
        image.fileUrl;
      const cacheParam = disableCache ? `&isCachingTriggle=true&t=${Date.now()}` : '';
      return `/api/images?fileUrl=${url}${cacheParam}`;
    }
    return `${image.fileUrl}${disableCache ? `?t=${Date.now()}` : ''}`;
  };

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Image de couverture
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => window.open('/', '_blank')}
            title="Voir la page d'accueil"
            sx={{ 
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#eff6ff',
                borderColor: '#2563eb'
              }
            }}
          >
            <ExternalLink size={16} />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            Voir la page d'accueil
          </Typography>
        </Box>
      </Box>
      
      <Grid container spacing={2} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1, minHeight: 150 }}>
        <Grid size={{ xs: 4, md: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" height="100%">
            {editedWedding.coverImage ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={editedWedding.coverImage.fileUrlThumbnail 
                      ? getImageUrl(editedWedding.coverImage, true, true) 
                      : getImageUrl(editedWedding.coverImage, false, true)}
                    alt={`Wedding image ${editedWedding.coverImage.id}`}
                    sx={{
                      objectFit: 'cover',
                      borderRadius: '16px',
                      width: 128,
                      height: 'auto',
                    }}
                    key={`cover-${editedWedding.coverImage.id}-${imageRefreshKey}-${editedWedding.coverImage.fileUrlThumbnail || 'no-thumb'}`}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setShowPreviewDialog(true)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: '#3b82f6',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      },
                      width: 24,
                      height: 24,
                    }}
                  >
                    <ZoomInOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {editedWedding.coverImage.fileType === 'coverStorage' 
                    ? '(Stockage local)'  
                    : '(URL externe)'}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Pas d'image de couverture
              </Typography>
            )}
          </Box>
        </Grid>
        
        <Grid size={{ xs: 8, md: 3 }}>
          <Box 
          sx={{
            minHeight: 100,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: {
              xs: 'center',
              md: 'center',
            },
          }
          }>
            {/* ToggleButtonGroup pour le choix du type d'upload */}
            <Box 
            sx ={{
              width: {
                xs: '100%',
                md: '100%',
              },
              maxWidth: {
                xs: 350,
                md: '100%',
              },
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            >
              <ToggleButtonGroup
                orientation="vertical"
                value={uploadType}
                exclusive
                onChange={(_, newType) => {
                  if (newType) {
                    setUploadType(newType);
                    setShowAddCoverImage(true);
                  }
                }}
                size="small"
                sx={{ width: '100%' }}
              >
                <ToggleButton value="coverUrl" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'center' }}>
                  Lien web
                </ToggleButton>
                <ToggleButton value="coverFile" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'center' }}>
                  Upload de fichier
                </ToggleButton>
                <ToggleButton value="coverThumbnail" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'center' }} disabled={isProcessingCoverThumbnails}>
                  Produire la vignette
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Grid>
        {showAddCoverImage && (
          <Grid size={{ xs: 12, md: 6, }}
          sx={{
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
          }}
          >
            <Box sx={{ 
              height: 200, 
              maxHeight: 230, 
              p: 2, 
              bgcolor: '#f9fafb', 
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'space-around',
            }}>
              {uploadType === 'coverUrl' && (
                <Box 
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                    <Box
                      component="textarea"
                      value={newImageUrlCover}
                      onChange={handleUrlChangeCover}
                      placeholder="Entrez l'URL de l'image"
                      rows={3}
                      style={{
                      width: '100%',
                      resize: 'vertical',
                      overflow: 'auto',
                      border: `2px solid ${isValidUrlCover ? '#aae4acff' : '#f44336'}`,
                      borderRadius: '4px',
                      padding: '8px',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      outline: 'none',
                      }}
                    />
                  <MuiButton
                  variant="outlined"
                  onClick={() => handleAddImageByUrl('coverLink')}
                  sx={{
                    bgcolor: 'white',
                    borderColor: 'gray.300',
                    color: 'black',
                    '&:hover': {
                    bgcolor: 'green.100',
                    borderColor: 'gray.300',
                    },
                  }}
                  >
                  Ajouter
                  </MuiButton>
                </Box>
              )}
              
              {uploadType === 'coverFile' && (
                <FileUploader
                  selectedWedding={selectedWedding}
                  uploadType={uploadType}
                  onUploadComplete={handleUploadComplete}
                  h3Title={false}
                />
              )}
              
              {uploadType === 'coverThumbnail' && (
                <Box>
                  {editedWedding.coverImage && editedWedding.coverImage.fileType === 'coverLink' && (
                    <Box display="flex" alignItems="center" height="100%">
                      <Typography variant="body2" color="text.secondary">
                        Impossible de produire une vignette pour une image externe
                      </Typography>
                    </Box>
                  )}
                  
                  {editedWedding.coverImage && editedWedding.coverImage.fileType === 'coverStorage' && (
                    <Box display="flex" flexDirection="column" justifyContent="center" gap={2}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0,
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          <CompressOutlined fontSize="small" sx={{ mr: 1 }} />
                          Taille finale à conserver
                        </Typography>
                        <Typography variant="overline" color="text.secondary">
                          {resizeValueCover} % (compression à {100 - resizeValueCover} %)
                        </Typography>
                        <Slider
                          value={resizeValueCover}
                          min={1}
                          max={100}
                          step={1}
                          onChange={(_, value) => {
                            if (typeof value === 'number') setResizeValueCover(value);
                          }}
                          valueLabelDisplay="auto"
                          sx={{ width: '100%', mt: 1 }}
                          aria-label="Pourcentage de compression"
                        />
                      </Box>
                      
                      <Box display="flex" justifyContent="center">
                        <MuiButton
                          variant="outlined"
                          onClick={handleGenerateThumbnails}
                          disabled={isProcessingCoverThumbnail}
                          sx={{
                          bgcolor: 'white',
                          borderColor: 'gray.300',
                          color: 'black',
                          '&:hover': {
                            bgcolor: 'green.100',
                            borderColor: 'gray.300',
                          },
                          }}
                        >
                          {isProcessingCoverThumbnail ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            En cours...
                          </Box>
                          ) : (
                          'Lancer'
                          )}
                        </MuiButton>
                      </Box>
                      
                      {isProcessingCoverThumbnail && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(194, 194, 194, 0.29)', borderRadius: 1, border: '1px solid', borderColor: 'primary.main' }}>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <Typography variant="body2" color="primary.dark" fontWeight={500}>
                                Production : {Math.round(thumbnailProgress)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={thumbnailProgress} 
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
      <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#f3f4f6',
              borderRadius: 1,
              p: 2,
              border: '1px dashed #cbd5e1',
              mt:2, 
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Une <strong>vignette&nbsp;</strong>est une version compressée de l’image de couverture, générée pour accélérer le chargement côté client et réduire la consommation de données. Elle est utilisée sur la page d’accueil pour un affichage plus rapide.
            </Typography>
          </Box>
        </Grid>
      {/* Statistiques de compression */}
      {compressionStats && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'success.50', 
          borderRadius: 1, 
          border: '1px solid', 
          borderColor: 'success.200'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
              <BarChartOutlined fontSize="small" />
              Statistiques de compression - Image de couverture
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowStatsDetails(!showStatsDetails)}
              sx={{ color: 'success.dark' }}
            >
              {showStatsDetails ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            </IconButton>
          </Box>
          
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille originale :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.originalSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="info"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille finale :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.finalSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille cible :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.targetSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taux de compression :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.compressionRate}%`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color={compressionStats.compressionRate > 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Détails de compression */}
          <Collapse in={showStatsDetails}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={500} color="success.dark" sx={{ mb: 1 }}>
                Détail de compression
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: 'monospace',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={compressionStats.imageName}
                >
                  {compressionStats.imageName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={`${compressionStats.originalSize.toFixed(1)}KB`}
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    color="info"
                    variant="outlined"
                  />
                  <ArrowForwardOutlined fontSize="small" sx={{ color: 'success.dark' }} />
                  <Chip
                    size="small"
                    label={`${compressionStats.finalSize.toFixed(1)}KB`}
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Dialog pour l'aperçu de l'image */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => {
          setShowPreviewDialog(false);
          setPreviewTabValue(0);
        }}
        maxWidth='xl'
        fullWidth
        sx={{
          maxWidth: '1350px',
          margin: '0 auto',
        }}
      >
        <DialogTitle>
          Aperçu de l'image de couverture
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs 
            value={previewTabValue} 
            onChange={(_, newValue) => setPreviewTabValue(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Image originale" />
            <Tab 
              label="Vignette" 
              disabled={!editedWedding.coverImage?.fileUrlThumbnail}
            />
          </Tabs>
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            {editedWedding.coverImage && (
              <>
                {previewTabValue === 0 && (
                  <Box
                    component="img"
                    src={getImageUrl(editedWedding.coverImage, false, true)}
                    alt="Aperçu image de couverture - Originale"
                    sx={{
                      maxWidth: '1200px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      maxHeight: 'auto',
                    }}
                    key={`original-${imageRefreshKey}`}
                  />
                )}
                {previewTabValue === 1 && editedWedding.coverImage.fileUrlThumbnail && (
                  <Box
                    component="img"
                    src={getImageUrl(editedWedding.coverImage, true, true)}
                    alt="Aperçu image de couverture - Vignette"
                    sx={{
                      maxWidth: '1200px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      maxHeight: 'auto',
                    }}
                    key={`thumbnail-${imageRefreshKey}`}
                  />
                )}
                {previewTabValue === 1 && !editedWedding.coverImage.fileUrlThumbnail && (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Aucune vignette disponible
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => {
            setShowPreviewDialog(false);
            setPreviewTabValue(0);
          }} color="primary">
            Fermer
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}