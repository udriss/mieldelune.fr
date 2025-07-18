import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import * as Slider from '@radix-ui/react-slider';
import { Image, Wedding } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
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
} from '@mui/material';
import { 
  ImageOutlined, 
  BarChartOutlined, 
  CompressOutlined,
  StopOutlined,
  ArrowForwardOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined
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
      setLastWeddingId(editedWedding.id);
    }
  }, [editedWedding?.id, lastWeddingId]);

  // Traitement image par image
  const processThumbnailsSequentially = async () => {
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
    
    const images = editedWedding.images;
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
          const imageName = image.fileUrl.split('/').pop() || image.fileUrl;
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
          const imageName = image.fileUrl.split('/').pop() || image.fileUrl;
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
        
        const imageName = image.fileUrl.split('/').pop() || image.fileUrl;
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

      toast.success(`🎉 Compression terminée ! ${success}/${images.length} images traitées avec succès`, {
        position: "top-center",
        autoClose: 4000,
        theme: "dark",
      });
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
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 1 }}>
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
          <Button 
            onClick={handleProcessThumbnails}
            disabled={isProcessingThumbnails}
            variant="outline"
            size="sm"
            className="bg-white border-gray-300 text-black hover:bg-green-100 w-full"
          >
            {isProcessingThumbnails ? (
              <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> En cours...</span>
            ) : (
              <span className="flex items-center">
                <ImageOutlined className="w-4 h-4 mr-1" />
                Générer
              </span>
            )}
          </Button>
          
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
    </Paper>
  );
}