import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import * as Slider from '@radix-ui/react-slider';
import { Image, Wedding } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
import { Paper, Typography } from '@mui/material';

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

  const generateThumbnail = async (image: Image) => {
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
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok || !data.success) {
        setFailedThumbnails(prev => [...prev, image.fileUrl]);
        toast.error(`❌ Échec pour ${image.fileUrl.split('/').pop()}`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '400px' }
        });
        return false;
      }
      return true;
    } catch (error) {
      setFailedThumbnails(prev => [...prev, image.fileUrl]);
      toast.error(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, {
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
    let completed = 0;
    let succeeded = 0;
  
    for (const image of editedWedding.images) {
      const success = await generateThumbnail(image);
      completed++;
      if (success) succeeded++;
      setThumbnailProgress((completed / editedWedding.images.length) * 100);
    }
  
    setTimeout(() => {
      setIsProcessingThumbnails(false);
      setThumbnailProgress(0);
      
      if (succeeded === editedWedding.images.length) {
        toast.success('✨ Miniatures prêtes', {
          position: "top-center",
          autoClose: 1500,
          className: 'text-center',
          hideProgressBar: false,
          theme: "dark",
          style: { width: '300px' }
        });
      } else {
        toast.warning(`⚠️ ${succeeded}/${editedWedding.images.length} miniatures générées`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          theme: "dark",
          style: { width: '300px' }
        });
      }
    }, 1500);
  };

  const handleProcessThumbnails = () => {
    processThumbnails().then(() => {
      setEditedWedding((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map(img => ({
            ...img,
            fileUrl: img.fileUrl
          }))
        };
      });
    });
  };

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
    <Typography variant="h6" fontWeight={600} mb={2}>
      Miniatures
    </Typography>
      <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-md border border-gray-200 grid grid-cols-10">
        <div className="flex flex-col col-span-3">
          <span className="text-sm text-gray-500 font-medium">Taille des vignettes : {resizeValue}%</span>
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
        </div>
        <Button 
          onClick={handleProcessThumbnails}
          disabled={isProcessingThumbnails}
          variant="outline"
          size="sm"
          className="bg-white border-gray-300 text-black hover:bg-green-100 col-span-3"
        >
          {isProcessingThumbnails ? (
            <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> En cours...</span>
          ) : (
            '🖼️ Générer vignettes'
          )}
        </Button>

              {/* Indicateur de progression des vignettes */}
      {isProcessingThumbnails && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 transition-opacity duration-300 col-span-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
              <div className="text-sm font-medium text-blue-700">
                Production : {Math.round(thumbnailProgress)}%
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${thumbnailProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      </div>


    </Paper>
  );
}