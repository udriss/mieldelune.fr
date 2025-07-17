import { useState, useRef } from 'react';
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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { 
  ImageOutlined, 
  BarChartOutlined, 
  CompressOutlined,
  StopOutlined
} from '@mui/icons-material';

interface ThumbnailManagerProps {
  editedWedding: Wedding;
  setEditedWedding: React.Dispatch<React.SetStateAction<Wedding | null>>;
  resizeValue: number;
  setResizeValue: React.Dispatch<React.SetStateAction<number>>;
  isProcessingThumbnails: boolean;
  setIsProcessingThumbnails: React.Dispatch<React.SetStateAction<boolean>>;
  thumbnailProgress: number;
  setThumbnailProgress: React.Dispatch<React.SetStateAction<number>>;
}

export function ThumbnailManager({
  editedWedding,
  setEditedWedding,
  resizeValue,
  setResizeValue,
  isProcessingThumbnails,
  setIsProcessingThumbnails,
  thumbnailProgress,
  setThumbnailProgress
}: ThumbnailManagerProps) {
  const [failedThumbnails, setFailedThumbnails] = useState<string[]>([]);
  const [processedSizes, setProcessedSizes] = useState<{ [key: string]: { target: number, actual: number } }>({});
  const [compressionStrategy, setCompressionStrategy] = useState<'best' | 'worst'>('worst');
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateThumbnail = async (image: Image, signal: AbortSignal) => {
    try {
      const response = await fetch('/api/generate-thumbnail/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: editedWedding.folderId,
          imageUrl: image.fileUrl,
          resizePercentage: resizeValue,
          compressionStrategy: compressionStrategy,
        }),
        signal: signal,
      });
  
      if (signal.aborted) {
        throw new Error('Opération annulée');
      }

      const data = await response.json();
  
      if (!response.ok || !data.success) {
        setFailedThumbnails(prev => [...prev, image.fileUrl]);
        toast.error(`Échec pour ${image.fileUrl.split('/').pop()}`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '400px' }
        });
        return false;
      }
      
      // Enregistrer les tailles pour affichage
      if (data.finalSizeKB && data.targetSizeKB) {
        setProcessedSizes(prev => ({
          ...prev,
          [image.fileUrl]: {
            target: data.targetSizeKB,
            actual: data.finalSizeKB
          }
        }));
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      setFailedThumbnails(prev => [...prev, image.fileUrl]);
      toast.error(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
      return false;
    }
  };
  
  const processThumbnails = async () => {
    setIsProcessingThumbnails(true);
    setFailedThumbnails([]);
    setProcessedSizes({});
    let completed = 0;
    let succeeded = 0;
    
    // Créer un nouvel AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    try {
      for (const image of editedWedding.images) {
        // Vérifier si l'opération a été annulée
        if (controller.signal.aborted) {
          break;
        }
        
        const success = await generateThumbnail(image, controller.signal);
        completed++;
        if (success) succeeded++;
        setThumbnailProgress((completed / editedWedding.images.length) * 100);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('Génération de miniatures annulée', {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '300px' }
        });
      }
    }
  
    setTimeout(() => {
      setIsProcessingThumbnails(false);
      setThumbnailProgress(0);
      abortControllerRef.current = null;
      
      if (!controller.signal.aborted) {
        if (succeeded === editedWedding.images.length) {
          toast.success('Miniatures optimisées avec compression adaptative', {
            position: "top-center",
            autoClose: 2000,
            className: 'text-center',
            hideProgressBar: false,
            theme: "dark",
            style: { width: '500px' }
          });
        } else {
          toast.warning(`${succeeded}/${editedWedding.images.length} miniatures générées`, {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: false,
            theme: "dark",
            style: { width: '300px' }
          });
        }
      }
    }, 1500);
  };

  const handleProcessThumbnails = async () => {
    await processThumbnails();
    
    // Recharger les données du mariage pour obtenir les dimensions mises à jour
    try {
      const response = await fetch('/api/mariages');
      if (response.ok) {
        const data = await response.json();
        const updatedWedding = data.weddings.find((w: Wedding) => w.id === editedWedding.id);
        if (updatedWedding) {
          setEditedWedding(updatedWedding);
        }
      }
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
    }
  };

  const handleCancelThumbnails = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessingThumbnails(false);
      setThumbnailProgress(0);
      toast.info('Génération de miniatures annulée', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '300px' }
      });
    }
  };

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ImageOutlined />
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
            Compression adaptative : {resizeValue}%
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
        
        <Box sx={{ gridColumn: 'span 3' }}>
          <FormControl component="fieldset" size="small">
            <FormLabel component="legend" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
              Stratégie de compression
            </FormLabel>
            <RadioGroup
              value={compressionStrategy}
              onChange={(e) => setCompressionStrategy(e.target.value as 'best' | 'worst')}
              sx={{ mt: 0.5 }}
            >
              <FormControlLabel 
                value="worst" 
                control={<Radio size="small" />} 
                label={<Typography variant="caption">Moins bonne qualité</Typography>}
                sx={{ height: 24 }}
              />
              <FormControlLabel 
                value="best" 
                control={<Radio size="small" />} 
                label={<Typography variant="caption">Meilleure qualité</Typography>}
                sx={{ height: 24 }}
              />
            </RadioGroup>
          </FormControl>
        </Box>
        
        <Box sx={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 1 }}>
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

        {/* Indicateur de progression des vignettes */}
        {isProcessingThumbnails && (
          <Box sx={{ gridColumn: 'span 3', p: 2, bgcolor: 'rgba(194, 194, 194, 0.29)', borderRadius: 1, border: '1px solid', borderColor: 'primary.main' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                <Typography variant="body2" color="primary.dark" fontWeight={500}>
                  Production : {Math.round(thumbnailProgress)} %
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
      </Box>
      
      {/* Affichage des statistiques de compression */}
      {Object.keys(processedSizes).length > 0 && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'success.50', 
          borderRadius: 1, 
          border: '1px solid', 
          borderColor: 'success.200'
        }}>
          <Typography variant="body2" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 500 }}>
            <BarChartOutlined fontSize="small" />
            Statistiques de compression
          </Typography>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille cible moyenne :</Typography>
                <Chip 
                  size="small" 
                  label={`${(Object.values(processedSizes).reduce((acc, curr) => acc + curr.target, 0) / Object.values(processedSizes).length).toFixed(1)}KB`}
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
                  label={`${(Object.values(processedSizes).reduce((acc, curr) => acc + curr.actual, 0) / Object.values(processedSizes).length).toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Écart type :</Typography>
                <Chip 
                  size="small" 
                  label={`${(() => {
                    const sizes = Object.values(processedSizes).map(s => s.actual);
                    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                    const variance = sizes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / sizes.length;
                    return Math.sqrt(variance).toFixed(1);
                  })()}KB`}
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
                  label={Object.keys(processedSizes).length}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}