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
  const [currentProcessId, setCurrentProcessId] = useState<string | null>(null);
  const [tableRowsToShow, setTableRowsToShow] = useState<5 | 11 | 15 | 'all'>(5);
  const [tablePage, setTablePage] = useState(1);
  const [showStatsTable, setShowStatsTable] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Nettoyer les stats quand on change de mariage
  const [lastWeddingId, setLastWeddingId] = useState<number | null>(null);
  
  useEffect(() => {
    if (editedWedding && editedWedding.id !== lastWeddingId) {
      console.log('🧹 Effacement des statistiques de compression (changement de mariage)');
      setCompressionStats({});
      setShowStatsTable(false);
      setFailedThumbnails([]);
      setLastWeddingId(editedWedding.id);
    }
  }, [editedWedding?.id, lastWeddingId]);

  // Fonction utilitaire pour attendre que le process soit prêt côté serveur
  const waitForProcessReady = async (processId: string, maxTries = 15, delay = 300): Promise<boolean> => {
    for (let i = 0; i < maxTries; i++) {
      try {
        const res = await fetch(`/api/thumbnail-progress?processId=${processId}`);
        if (res.ok) return true;
      } catch (e) {
        // ignore
      }
      await new Promise(r => setTimeout(r, delay));
    }
    return false;
  };

  const processThumbnailsBatch = async () => {
    setIsProcessingThumbnails(true);
    setFailedThumbnails([]);
    setCompressionStats({});
    setTablePage(1);
    setThumbnailProgress(0);
    
    // Générer un ID unique pour ce processus
    const processId = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentProcessId(processId);

    let progressInterval: NodeJS.Timeout | null = null;
    let consecutiveErrors = 0;
    let consecutive404s = 0;
    const maxConsecutiveErrors = 20; // Plus tolérant
    const max404sBeforeGiveUp = 30; // Permettre beaucoup plus d'erreurs 404 au début
    let pollingActive = true;
    let processCompleted = false;

    // Fonction pour démarrer le polling du progrès
    const startProgressPolling = () => {
      console.log(`🔄 Démarrage du polling pour le processus: ${processId}`);
      
      progressInterval = setInterval(async () => {
        if (!pollingActive || processCompleted) {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          return;
        }

        try {
          const progressResponse = await fetch(`/api/thumbnail-progress?processId=${processId}`);
          
          if (progressResponse.ok) {
            consecutiveErrors = 0; // Reset le compteur d'erreurs
            consecutive404s = 0; // Reset le compteur 404
            const progressData = await progressResponse.json();
            
            if (progressData.success) {
              console.log(`📊 Progrès reçu: ${progressData.progress}% (${progressData.processedImages}/${progressData.totalImages})`);
              setThumbnailProgress(progressData.progress || 0);
              
              // Mettre à jour les statistiques en temps réel
              if (progressData.compressionStats && Object.keys(progressData.compressionStats).length > 0) {
                console.log(`📊 Statistiques reçues: ${Object.keys(progressData.compressionStats).length} images`);
                setCompressionStats(progressData.compressionStats);
                setShowStatsTable(true);
              }
              
              // Arrêter le polling si le processus est terminé
              if (progressData.status === 'completed' || progressData.status === 'cancelled' || progressData.status === 'error') {
                console.log(`✅ Processus terminé avec le statut: ${progressData.status}`);
                processCompleted = true;
                pollingActive = false;
                if (progressInterval) {
                  clearInterval(progressInterval);
                  progressInterval = null;
                }
                
                // Finaliser le processus côté UI
                setIsProcessingThumbnails(false);
                setThumbnailProgress(100);
                
                // Réinitialiser après un délai
                setTimeout(() => {
                  setThumbnailProgress(0);
                  setCurrentProcessId(null);
                }, 3000);
                
                if (progressData.status === 'completed') {
                  // Utiliser le callback fourni par le parent pour rafraîchir les données
                  // Délai plus long pour éviter les conflits avec d'autres refreshs
                  setTimeout(() => {
                    console.log('🔄 Demande de rechargement des données via onDataRefresh (ThumbnailManager)');
                    if (onDataRefresh) {
                      onDataRefresh();
                    }
                    setUpdateKey(prev => prev + 1);
                  }, 2000); // Augmenter le délai à 2 secondes
                  
                  toast.success(`🎉 Compression terminée avec succès !`, {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    theme: "dark",
                  });
                }
              }
            }
          } else if (progressResponse.status === 404) {
            consecutive404s++;
            console.warn(`⚠️ Processus non trouvé (${consecutive404s}/${max404sBeforeGiveUp}) - Le serveur initialise peut-être encore...`);
            
            // Arrêter seulement après beaucoup d'erreurs 404
            if (consecutive404s >= max404sBeforeGiveUp) {
              console.log(`🔍 Trop d'erreurs 404 consécutives - arrêt du polling`);
              processCompleted = true;
              pollingActive = false;
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
              setIsProcessingThumbnails(false);
              
              toast.warning('⚠️ Impossible de suivre le progrès. Le traitement continue côté serveur.', {
                position: "top-center",
                autoClose: 5000,
                theme: "dark",
              });
            }
          } else {
            consecutiveErrors++;
            console.warn(`⚠️ Erreur API progrès: ${progressResponse.status}`);
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.log(`❌ Trop d'erreurs consécutives - arrêt du polling`);
              processCompleted = true;
              pollingActive = false;
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
              setIsProcessingThumbnails(false);
            }
          }
        } catch (error) {
          consecutiveErrors++;
          console.error('Erreur lors de la récupération du progrès:', error);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log(`❌ Erreur réseau persistante - arrêt du polling`);
            processCompleted = true;
            pollingActive = false;
            if (progressInterval) {
              clearInterval(progressInterval);
              progressInterval = null;
            }
            setIsProcessingThumbnails(false);
          }
        }
      }, 1000); // Réduction de l'intervalle à 1 seconde pour être très réactif
    };

    try {
      console.log(`🚀 Démarrage du processus batch avec ID: ${processId}`);

      const response = await fetch('/api/thumbnail-batch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editedWedding.folderId,
          resizePercentage: resizeValue,
          compressionStrategy: compressionStrategy,
          processId: processId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du traitement en lot');
      }

      // Attendre que le process soit prêt côté serveur avant de démarrer le polling
      const found = await waitForProcessReady(processId, 15, 300);
      if (!found) {
        toast.warning('Le suivi du progrès n\'a pas pu démarrer (process non trouvé). Le traitement continue côté serveur.', {
          position: "top-center",
          autoClose: 5000,
          theme: "dark",
        });
      } else {
        // Démarrer le polling normalement
        if (!processCompleted) {
          startProgressPolling();
        }
      }

      // Afficher un message de démarrage
      toast.info(`🚀 Traitement de ${editedWedding.images.length} images démarré`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        theme: "dark",
      });

    } catch (error) {
      console.error('Erreur lors du traitement en lot:', error);
      processCompleted = true;
      pollingActive = false;
      setIsProcessingThumbnails(false);
      setCurrentProcessId(null);

      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
    }
  };

  const handleCancelThumbnails = async () => {
    if (currentProcessId) {
      try {
        console.log(`🛑 Annulation du processus: ${currentProcessId}`);
        
        const response = await fetch(`/api/thumbnail-batch?processId=${currentProcessId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Processus annulé côté serveur:`, data);
        } else {
          console.warn(`⚠️ Erreur lors de l'annulation côté serveur: ${response.status}`);
        }
        
        // Forcer l'arrêt côté client
        setIsProcessingThumbnails(false);
        setThumbnailProgress(0);
        setCurrentProcessId(null);
        
        toast.info('🛑 Génération de miniatures annulée', {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '400px' }
        });
        
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        
        // Même en cas d'erreur, forcer l'arrêt côté client
        setIsProcessingThumbnails(false);
        setThumbnailProgress(0);
        setCurrentProcessId(null);
        
        toast.warning('⚠️ Arrêt forcé côté client. Le processus peut continuer côté serveur.', {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      }
    }
  };

  const handleProcessThumbnails = async () => {
    await processThumbnailsBatch();
    // Le rechargement des données se fait maintenant dans processThumbnailsBatch
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
                {thumbnailProgress === 100 ? 'Finalisation...' : `Compression : ${Math.round(thumbnailProgress)} %`}
              </Typography>
            </Box>
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