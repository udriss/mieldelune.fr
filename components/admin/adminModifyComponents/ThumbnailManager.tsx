import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Divide, Loader2 } from "lucide-react";
import * as Slider from '@radix-ui/react-slider';
import { Image, Wedding } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
import Masonry from 'react-masonry-css';
import { 
  Paper, 
  Typography, 
  Box, 
  Chip,
  LinearProgress,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  IconButton,
  Collapse,
  FormControl,
  FormLabel,
  FormControlLabel,
  Button as MuiButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Checkbox,
  Card,
  CardMedia,
  Divider
} from '@mui/material';
import { 
  ImageOutlined, 
  BarChartOutlined, 
  CompressOutlined,
  StopOutlined,
  ArrowForwardOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  ZoomInOutlined,
  CheckBoxOutlined,
  CheckBoxOutlineBlankOutlined,
  SelectAllOutlined,
  DeselectOutlined
} from '@mui/icons-material';

interface CompressionStat {
  imageName: string;
  originalSize: number;
  finalSize: number;
  compressionRate: number;
  targetSize: number;
  error?: string;
}

interface ThumbnailManagerProps {
  editedWedding: Wedding;
  setEditedWedding: React.Dispatch<React.SetStateAction<Wedding | null>>;
  resizeValue: number;
  setResizeValue: React.Dispatch<React.SetStateAction<number>>;
  isProcessingThumbnails: boolean;
  setIsProcessingThumbnails: React.Dispatch<React.SetStateAction<boolean>>;
  thumbnailProgress: number;
  setThumbnailProgress: React.Dispatch<React.SetStateAction<number>>;
  setUpdateKey: React.Dispatch<React.SetStateAction<number>>;
  onDataRefresh?: () => void;
}

export function ThumbnailManager({
  editedWedding,
  setEditedWedding,
  resizeValue,
  setResizeValue,
  isProcessingThumbnails,
  setIsProcessingThumbnails,
  thumbnailProgress,
  setThumbnailProgress,
  setUpdateKey,
  onDataRefresh,
}: ThumbnailManagerProps) {
  const [failedThumbnails, setFailedThumbnails] = useState<string[]>([]);
  const [compressionStats, setCompressionStats] = useState<{ [key: string]: CompressionStat }>({});
  const [compressionStrategy, setCompressionStrategy] = useState<'best' | 'worst'>('worst');
  const [tableRowsToShow, setTableRowsToShow] = useState<5 | 11 | 15 | 'all'>(5);
  const [tablePage, setTablePage] = useState(1);
  const [showStatsTable, setShowStatsTable] = useState(false);
  const [processingStopped, setProcessingStopped] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [targetSizeKB, setTargetSizeKB] = useState<number>(0);
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Nettoyer les stats quand on change de mariage
  const [lastWeddingId, setLastWeddingId] = useState<number | null>(null);
  
  useEffect(() => {
    if (editedWedding && editedWedding.id !== lastWeddingId) {
      setCompressionStats({});
      setShowStatsTable(false);
      setFailedThumbnails([]);
      setCurrentImageIndex(0);
      setTotalImages(0);
      setTargetSizeKB(0);
      setSelectedImages([]);
      setShowImageSelection(false);
      setPreviewImage(null);
      setLastWeddingId(editedWedding.id);
    }
  }, [editedWedding?.id, lastWeddingId]);

  // Traitement image par image
  const processThumbnailsSequentially = async (imagesToProcess?: string[]) => {
    setIsProcessingThumbnails(true);
    setFailedThumbnails([]);
    setCompressionStats({});
    setTablePage(1);
    setThumbnailProgress(0);
    setProcessingStopped(false);
    setCurrentImageIndex(0);
    
    // Créer un nouveau AbortController pour ce processus
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Utiliser les images sélectionnées ou toutes les images
    const allImages = editedWedding.images;
    const images = imagesToProcess 
      ? allImages.filter(img => imagesToProcess.includes(img.fileUrl))
      : allImages;
    
    setTotalImages(images.length);
    
    if (images.length === 0) {
      setIsProcessingThumbnails(false);
      toast.warning('Aucune image à traiter', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    // Calculer la taille cible moyenne basée sur le pourcentage de réduction
    let estimatedTargetKB = 50; // Valeur par défaut
    
    // Estimer la taille cible en se basant sur les tailles d'images existantes
    try {
      if (images.length > 0) {
        // Utiliser une estimation simple basée sur le pourcentage
        const sampleImage = images[0];
        const imageName = sampleImage.fileUrl.split('/').pop();
        if (imageName) {
          // Estimation simple : taille cible = resizeValue% de la taille moyenne estimée
          // Pour une image typique de 1MB, 20% = 200KB
          const averageImageSizeKB = 1000; // Estimation moyenne
          estimatedTargetKB = Math.round((averageImageSizeKB * resizeValue) / 100);
          estimatedTargetKB = Math.max(30, Math.min(500, estimatedTargetKB)); // Entre 30KB et 500KB
        }
      }
    } catch (error) {
      console.warn('Impossible d\'estimer la taille cible:', error);
    }
    
    setTargetSizeKB(estimatedTargetKB);
    setShowStatsTable(true);

    toast.info(`🚀 Traitement de ${images.length} images démarré (cible: ${estimatedTargetKB}KB)`, {
      position: "top-center",
      autoClose: 3000,
      theme: "dark",
    });

    // Traiter chaque image séquentiellement
    for (let i = 0; i < images.length; i++) {
      // Vérifier l'annulation au début de chaque itération
      if (processingStopped || abortController.signal.aborted) {
        console.log('🛑 Traitement arrêté par l\'utilisateur');
        break;
      }

      const image = images[i];
      setCurrentImageIndex(i + 1);
      
      // Mettre à jour la progression
      const progressPercent = (i / images.length) * 100;
      setThumbnailProgress(progressPercent);

      try {
        const response = await fetch('/api/generate-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderId: editedWedding.folderId,
            imageUrl: image.fileUrl,
            resizePercentage: resizeValue,
            compressionStrategy: compressionStrategy,
            targetSizeKB: estimatedTargetKB, // Passer la taille cible explicitement
            isCover: false
          }),
          signal: abortController.signal // Permettre l'annulation de la requête
        });

        const data = await response.json();

        if (data.success) {
          const imageName = cleanImageName(image.fileUrl.split('/').pop() || image.fileUrl);
          const compressionRate = data.originalSizeKB ? 
            Math.round(((data.originalSizeKB - data.finalSizeKB) / data.originalSizeKB) * 100) : 0;

          // Ajouter les statistiques en temps réel
          setCompressionStats(prev => ({
            ...prev,
            [image.fileUrl]: {
              imageName,
              originalSize: (data.originalSizeKB || 0) * 1024,
              finalSize: (data.finalSizeKB || 0) * 1024,
              compressionRate,
              targetSize: (data.targetSizeKB || estimatedTargetKB) * 1024
            }
          }));

          console.log(`✅ Image ${i + 1}/${images.length} traitée: ${imageName} (${data.finalSizeKB}KB)`);
        } else {
          // Ajouter l'erreur aux statistiques
          const imageName = cleanImageName(image.fileUrl.split('/').pop() || image.fileUrl);
          setCompressionStats(prev => ({
            ...prev,
            [image.fileUrl]: {
              imageName,
              originalSize: 0,
              finalSize: 0,
              compressionRate: 0,
              targetSize: estimatedTargetKB * 1024,
              error: data.error || 'Erreur inconnue'
            }
          }));

          setFailedThumbnails(prev => [...prev, image.fileUrl]);
          console.error(`❌ Erreur image ${i + 1}/${images.length}: ${data.error}`);
        }
      } catch (error) {
        // Vérifier si c'est une annulation
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🛑 Requête annulée pour l\'image:', image.fileUrl);
          break; // Sortir de la boucle
        }
        
        const imageName = cleanImageName(image.fileUrl.split('/').pop() || image.fileUrl);
        setCompressionStats(prev => ({
          ...prev,
          [image.fileUrl]: {
            imageName,
            originalSize: 0,
            finalSize: 0,
            compressionRate: 0,
            targetSize: estimatedTargetKB * 1024,
            error: error instanceof Error ? error.message : 'Erreur réseau'
          }
        }));

        setFailedThumbnails(prev => [...prev, image.fileUrl]);
        console.error(`❌ Erreur réseau image ${i + 1}/${images.length}:`, error);
      }
    }

    // Finalisation
    setThumbnailProgress(100);
    setIsProcessingThumbnails(false);
    
    // Nettoyer l'AbortController
    abortControllerRef.current = null;
    
    // Calculer le résumé final avec les stats actuelles
    const currentStats = Object.values(compressionStats);
    const failed = currentStats.filter(stat => stat.error).length;
    const success = currentStats.length - failed;
    
    // Rafraîchir les données si non arrêté
    if (!processingStopped && !abortController.signal.aborted) {
      setTimeout(() => {
        if (onDataRefresh) {
          onDataRefresh();
        }
        setUpdateKey(prev => prev + 1);
      }, 1500);

      // toast.success(`🎉 Compression terminée ! ${success}/${images.length} images traitées avec succès`, {
      //   position: "top-center",
      //   autoClose: 4000,
      //   theme: "dark",
      // });
    } else {
      // Afficher un résumé même en cas d'annulation
      toast.info(`🛑 Traitement annulé. ${success} images traitées avant l'arrêt.`, {
        position: "top-center",
        autoClose: 4000,
        theme: "dark",
      });
    }

    // Réinitialiser après un délai
    setTimeout(() => {
      setThumbnailProgress(0);
      setCurrentImageIndex(0);
    }, 3000);
  };

  const handleCancelThumbnails = () => {
    console.log('🚨 EMERGENCY STOP - Annulation du traitement');
    
    // Arrêt immédiat des requêtes en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Mise à jour immédiate de l'état
    setProcessingStopped(true);
    setIsProcessingThumbnails(false);
    
    // Calculer le résumé avec les stats actuelles
    const currentStats = Object.values(compressionStats);
    const failed = currentStats.filter(stat => stat.error).length;
    const success = currentStats.length - failed;
    
    toast.error(`🛑 Traitement annulé ! ${success} images traitées avant l'arrêt.`, {
      position: "top-center",
      autoClose: 3000,
      theme: "dark",
    });
    
    // Réinitialiser après un court délai
    setTimeout(() => {
      setThumbnailProgress(0);
      setCurrentImageIndex(0);
    }, 1000);
  };

  const handleProcessThumbnails = async () => {
    await processThumbnailsSequentially();
  };

  const handleSelectiveProcess = () => {
    setSelectedImages([]);
    setShowImageSelection(true);
  };

  const handleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl) 
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleSelectAll = () => {
    setSelectedImages(editedWedding.images.map(img => img.fileUrl));
  };

  const handleDeselectAll = () => {
    setSelectedImages([]);
  };

  const handleProcessSelectedImages = async () => {
    if (selectedImages.length === 0) {
      toast.warning('Aucune image sélectionnée', {
        position: "top-center",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }
    
    setShowImageSelection(false);
    await processThumbnailsSequentially(selectedImages);
  };

  const getImageUrl = (image: Image, thumbnail: boolean = true) => {
    if (image.fileType === 'storage') {
      const url = thumbnail && image.fileUrlThumbnail ? 
        image.fileUrlThumbnail : 
        image.fileUrl;
      return `/api/images?fileUrl=${url}`;
    }
    return image.fileUrl;
  };

  // Fonction pour nettoyer le nom d'image (enlever timestamp)
  const cleanImageName = (imageName: string): string => {
    // Si le nom contient un tiret, on cherche le premier tiret et on garde ce qui suit
    const dashIndex = imageName.indexOf('-');
    if (dashIndex !== -1 && dashIndex < imageName.length - 1) {
      // Vérifier si la partie avant le tiret ressemble à un timestamp (que des chiffres)
      const beforeDash = imageName.substring(0, dashIndex);
      if (/^\d+$/.test(beforeDash)) {
        return imageName.substring(dashIndex + 1);
      }
    }
    return imageName;
  };

  // Calculer les données pour le tableau
  const statsArray = Object.entries(compressionStats).map(([url, stats]) => ({
    url,
    ...stats
  }));

  const totalPages = tableRowsToShow === 'all' ? 1 : Math.ceil(statsArray.length / tableRowsToShow);
  const startIndex = tableRowsToShow === 'all' ? 0 : (tablePage - 1) * tableRowsToShow;
  const endIndex = tableRowsToShow === 'all' ? statsArray.length : startIndex + tableRowsToShow;
  const displayedStats = statsArray.slice(startIndex, endIndex);

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        Miniatures
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
        Nivelle la qualité entre toutes les images
      </Typography>
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 2, alignItems: 'center', bgcolor: 'white', 
        p: 2, borderRadius: 1, border: '1px solid #e5e7eb' }}>
        
        <Box sx={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompressOutlined fontSize="small" />
            Taille finale à conserver : {resizeValue}% (compression : {100 - resizeValue}%)
          </Typography>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5 mt-1"
            value={[resizeValue]}
            onValueChange={([value]) => setResizeValue(value)}
            max={100}
            min={1}
            step={1}
          >
            <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none"
              aria-label="Resize percentage"
            />
          </Slider.Root>
        </Box>
        
        <Box sx={{ gridColumn: 'span 5' }}>
          <Typography variant="overline" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
            Stratégie de compression
          </Typography>
          <ToggleButtonGroup
            value={compressionStrategy}
            exclusive
            onChange={(_, newStrategy) => newStrategy && setCompressionStrategy(newStrategy)}
            size="small"
            sx={{ width: '100%' }}
          >
            <ToggleButton value="worst" sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}>
              Moins bonne
            </ToggleButton>
            <ToggleButton value="best" sx={{ flex: 1, fontSize: '0.75rem', py: 0.5 }}>
              Meilleure
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MuiButton 
            onClick={handleProcessThumbnails}
            disabled={isProcessingThumbnails}
            variant="outlined"
            size="small"
            startIcon={isProcessingThumbnails ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageOutlined />}
            sx={{
              bgcolor: 'white',
              borderColor: 'gray.300',
              color: 'black',
              '&:hover': {
                bgcolor: 'green.100',
                borderColor: 'gray.300',
              },
              '&:disabled': {
                bgcolor: 'gray.100',
                borderColor: 'gray.300',
                color: 'gray.500',
              },
              width: '100%'
            }}
          >
            {isProcessingThumbnails ? 'En cours...' : 'Générer tout'}
          </MuiButton>
          
          <MuiButton 
            onClick={handleSelectiveProcess}
            disabled={isProcessingThumbnails}
            variant="outlined"
            size="small"
            startIcon={<CheckBoxOutlined />}
            sx={{
              bgcolor: 'white',
              borderColor: 'blue.300',
              color: 'blue.700',
              '&:hover': {
                bgcolor: 'blue.50',
                borderColor: 'blue.400',
              },
              '&:disabled': {
                bgcolor: 'gray.100',
                borderColor: 'gray.300',
                color: 'gray.500',
              },
              width: '100%'
            }}
          >
            Sélectionner
          </MuiButton>
          
          {isProcessingThumbnails && (
            <Button 
              onClick={handleCancelThumbnails}
              variant="outline"
              size="sm"
              className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100 w-full"
            >
              <span className="flex items-center">
                <StopOutlined className="w-4 h-4 mr-1" />
                Annuler
              </span>
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Indicateur de progression des vignettes */}
      {isProcessingThumbnails && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'rgba(194, 194, 194, 0.29)', 
          borderRadius: 1, 
          border: '1px solid', 
          borderColor: 'primary.main',
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
              <Typography variant="body2" color="primary.dark" fontWeight={500}>
                {thumbnailProgress === 100 ? 'Finalisation...' : 
                 `Compression : ${currentImageIndex}/${totalImages} images (${Math.round(thumbnailProgress)}%)`}
              </Typography>
            </Box>
            {targetSizeKB > 0 && (
              <Typography variant="caption" color="text.secondary">
                Taille cible : {targetSizeKB}KB
              </Typography>
            )}
            <LinearProgress 
              variant="determinate" 
              value={thumbnailProgress} 
              sx={{ width: '100%', height: 8, borderRadius: 1 }}
            />
          </Box>
        </Box>
      )}
      
      {/* Affichage des statistiques de compression */}
      {(Object.keys(compressionStats).length > 0 || isProcessingThumbnails) && (
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
              Statistiques de compression
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowStatsTable(!showStatsTable)}
              sx={{ color: 'success.dark' }}
            >
              {showStatsTable ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            </IconButton>
          </Box>
          
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille cible :</Typography>
                <Chip 
                  size="small" 
                  label={(() => {
                    if (isProcessingThumbnails && targetSizeKB > 0) {
                      return `${targetSizeKB}KB`;
                    }
                    
                    const validStats = Object.values(compressionStats).filter(stat => !stat.error);
                    const totalStats = Object.values(compressionStats);
                    
                    if (totalStats.length === 0) return "En cours...";
                    if (validStats.length === 0) return "Aucune valide";
                    
                    // Prendre la targetSize de la première stat valide (elle devrait être la même pour toutes)
                    const targetSize = validStats[0]?.targetSize;
                    return targetSize ? `${(targetSize / 1024).toFixed(1)}KB` : "Non définie";
                  })()}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille réelle moyenne :</Typography>
                <Chip 
                  size="small" 
                  label={(() => {
                    const validStats = Object.values(compressionStats).filter(stat => !stat.error);
                    const totalStats = Object.values(compressionStats);
                    if (totalStats.length === 0) return "En cours...";
                    if (validStats.length === 0) return "Aucune valide";
                    return `${(validStats.reduce((acc, curr) => acc + curr.finalSize, 0) / validStats.length / 1024).toFixed(1)}KB`;
                  })()}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taux de compression moyen :</Typography>
                <Chip 
                  size="small" 
                  label={(() => {
                    const validStats = Object.values(compressionStats).filter(stat => !stat.error);
                    const totalStats = Object.values(compressionStats);
                    if (totalStats.length === 0) return "En cours...";
                    if (validStats.length === 0) return "Aucune valide";
                    return `${(validStats.reduce((acc, curr) => acc + curr.compressionRate, 0) / validStats.length).toFixed(1)}%`;
                  })()}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="info"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Images traitées :</Typography>
                <Chip 
                  size="small" 
                  label={(() => {
                    const total = Object.keys(compressionStats).length;
                    const errors = Object.values(compressionStats).filter(stat => stat.error).length;
                    const success = total - errors;
                    if (total === 0) return "En cours...";
                    if (isProcessingThumbnails) {
                      return `${success}/${total} ${errors > 0 ? `(${errors} erreurs)` : ''}`;
                    }
                    return `${success}/${total}${errors > 0 ? ` (${errors} erreurs)` : ''}`;
                  })()}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color={Object.values(compressionStats).some(stat => stat.error) ? 'warning' : 'primary'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Tableau détaillé des statistiques */}
          <Collapse in={showStatsTable}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={500} color="success.dark">
                  Détail par image
                </Typography>
                <ToggleButtonGroup
                  value={tableRowsToShow}
                  exclusive
                  onChange={(_, newValue) => newValue && setTableRowsToShow(newValue)}
                  size="small"
                >
                  <ToggleButton value={5} sx={{ fontSize: '0.7rem', px: 1, py: 0.25 }}>5</ToggleButton>
                  <ToggleButton value={11} sx={{ fontSize: '0.7rem', px: 1, py: 0.25 }}>11</ToggleButton>
                  <ToggleButton value={15} sx={{ fontSize: '0.7rem', px: 1, py: 0.25 }}>15</ToggleButton>
                  <ToggleButton value="all" sx={{ fontSize: '0.7rem', px: 1, py: 0.25 }}>Tout</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <TableContainer 
                sx={{ 
                  maxHeight: tableRowsToShow === 'all' ? 300 : 'auto',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'success.300'
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'success.100' }}>Nom de l'image</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'success.100' }}>Tailles</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, bgcolor: 'success.100' }}>Compression</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedStats.map((stat, index) => (
                      <TableRow key={stat.url} sx={{ '&:nth-of-type(odd)': { bgcolor: 'success.50' } }}>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          <Box sx={{ 
                            maxWidth: '150px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {stat.imageName}
                            {stat.error && (
                              <Chip
                                size="small"
                                label="ERREUR"
                                color="error"
                                variant="filled"
                                sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {stat.error ? (
                            <Typography variant="caption" color="error" sx={{ fontStyle: 'italic' }}>
                              {stat.error}
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <span>{(stat.originalSize / 1024).toFixed(1)}KB</span>
                              <ArrowForwardOutlined fontSize="small" sx={{ color: 'success.dark' }} />
                              <span style={{ color: stat.finalSize < stat.originalSize ? 'green' : 'orange' }}>
                                {(stat.finalSize / 1024).toFixed(1)}KB
                              </span>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {stat.error ? (
                            <Chip
                              size="small"
                              label="ECHEC"
                              color="error"
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', minWidth: 60 }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label={`${stat.compressionRate}%`}
                              color={stat.compressionRate > 50 ? 'success' : stat.compressionRate > 20 ? 'warning' : 'error'}
                              variant="outlined"
                              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', minWidth: 60 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Pagination
                    count={totalPages}
                    page={tablePage}
                    onChange={(_, page) => setTablePage(page)}
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Dialog de sélection d'images */}
      <Dialog 
        open={showImageSelection} 
        onClose={() => setShowImageSelection(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: { 
              height: '90vh',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <ImageOutlined />
            Sélection des images pour la compression
          </Box>
        </DialogTitle>
        
        {/* Barre d'outils sticky */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 9,
          background: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          p: 2,
          display: 'flex', 
          flexDirection: 'row',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <MuiButton
              variant="outlined"
              startIcon={<SelectAllOutlined />}
              onClick={handleSelectAll}
              sx={{ 
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                '&:hover': {
                  background: 'rgba(239, 246, 255, 0.9)',
                }
              }}
            >
              Tout sélectionner
            </MuiButton>
            <MuiButton
              variant="outlined"
              startIcon={<DeselectOutlined />}
              onClick={handleDeselectAll}
              sx={{ 
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                '&:hover': {
                  background: 'rgba(249, 250, 251, 0.9)',
                }
              }}
            >
              Tout désélectionner
            </MuiButton>
            <Chip 
              label={`${selectedImages.length} / ${editedWedding.images.length} images`}
              sx={{ 
                background: 'rgba(34, 197, 94, 0.1)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 600
              }}
              color="success"
              variant="outlined"
            />
          </Box>
          <Divider orientation="vertical" flexItem />
          {/* Bouton de validation */}
        <DialogActions sx={{ 
          p: 1, 
          bgcolor: 'rgba(248, 250, 252, 0.95)',
          backdropFilter: 'blur(10px)',
          // borderLeft: '1px solid #e2e8f0',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          gap: 2 
        }}>
          <MuiButton 
            onClick={() => setShowImageSelection(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(5px)'
            }}
          >
            Annuler
          </MuiButton>
          <MuiButton 
            onClick={handleProcessSelectedImages}
            variant="contained"
            disabled={selectedImages.length === 0}
            startIcon={<ImageOutlined />}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              }
            }}
          >
            Lancer {selectedImages.length} miniature{selectedImages.length > 1 ? 's' : ''}
          </MuiButton>
        </DialogActions>
        </Box>
        
        <DialogContent sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          p: 3, 
          bgcolor: '#f8fafc'
        }}>
          <Masonry
            breakpointCols={{
              default: 4,
              1100: 3,
              700: 2,
              500: 1
            }}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {editedWedding.images.map((image, index) => {
              const isSelected = selectedImages.includes(image.fileUrl);
              const imageName = cleanImageName(image.fileUrl.split('/').pop() || '');
              
              return (
                <div key={image.fileUrl} style={{ marginBottom: '16px' }}>
                  <Card 
                    sx={{ 
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: isSelected ? '3px solid #4CAF50' : '2px solid transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: 3
                      }
                    }}
                    onClick={() => handleImageSelection(image.fileUrl)}
                  >
                    <CardMedia
                      component="img"
                      image={getImageUrl(image, true)}
                      alt={imageName}
                      sx={{ 
                        objectFit: 'cover',
                        width: '100%',
                        height: 'auto',
                        aspectRatio: image.width && image.height 
                          ? `${image.width}/${image.height}` 
                          : '4/3'
                      }}
                    />
                    
                    {/* Checkbox en haut à gauche */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: isSelected ? '#4CAF50' : 'rgba(255, 255, 255, 0.9)',
                        color: isSelected ? 'white' : '#666',
                        width: 32,
                        height: 32,
                        backdropFilter: 'blur(5px)',
                        '&:hover': {
                          backgroundColor: isSelected ? '#45a049' : 'rgba(255, 255, 255, 1)',
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageSelection(image.fileUrl);
                      }}
                    >
                      {isSelected ? (
                        <CheckBoxOutlined sx={{ fontSize: 18 }} />
                      ) : (
                        <CheckBoxOutlineBlankOutlined sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                    
                    {/* Bouton loupe en haut à droite */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#3b82f6',
                        width: 32,
                        height: 32,
                        backdropFilter: 'blur(5px)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(getImageUrl(image, false));
                      }}
                    >
                      <ZoomInOutlined sx={{ fontSize: 18 }} />
                    </IconButton>
                    
                    {/* Nom de l'image */}
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      color: 'white',
                      p: 1.5,
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      fontWeight: 500
                    }}>
                      {imageName.length > 20 ? `${imageName.substring(0, 17)}...` : imageName}
                    </Box>
                  </Card>
                </div>
              );
            })}
          </Masonry>
        </DialogContent>
        

      </Dialog>

      {/* Dialog d'aperçu d'image */}
      <Dialog 
        open={!!previewImage} 
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {previewImage && (
            <img
              src={previewImage}
              alt="Aperçu"
              style={{ 
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setPreviewImage(null)}>
            Fermer
          </MuiButton>
        </DialogActions>
      </Dialog>
      
      <style jsx global>{`
        /* Styles pour react-masonry-css */
        .masonry-grid {
          display: flex;
          margin-left: -16px; /* gutter size offset */
          width: auto;
        }
        
        .masonry-grid_column {
          padding-left: 16px; /* gutter size */
          background-clip: padding-box;
        }
      `}</style>
    </Paper>
  );
}