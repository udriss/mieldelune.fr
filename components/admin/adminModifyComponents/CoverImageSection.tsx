import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink } from "lucide-react";
import * as Slider from '@radix-ui/react-slider';
import { toast } from 'react-toastify';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { FileUploader } from '@/components/admin/admin-file-uploader';
import { myFetch } from '@/lib/fetch-wrapper';
import { Paper, Typography, IconButton, Box } from '@mui/material';


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
  selectedWedding: string;
  isProcessingCoverThumbnails: boolean;
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
  selectedWedding,
  isProcessingCoverThumbnails,
}: CoverImageSectionProps) {
  const [isProcessingCoverThumbnail, setIsProcessingCoverThumbnail] = useState(false);

  const generateCoverThumbnail = async () => {
    if (!editedWedding?.coverImage) return;
  
    setIsProcessingCoverThumbnail(true);
    try {
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
  
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        toast.error(`Échec de la génération de la miniature : ${data}`, {
          position: "top-center",
          autoClose: 2000,
          style: {
            width: '400px'
          }
        });
        return;
      }
  
      // Prepare the thumbnail file name
      const fileName = editedWedding.coverImage.fileUrl.split('/').pop();
      const fileExtension = fileName?.substring(fileName.lastIndexOf('.'));
      const fileNameWithoutExt = fileName?.substring(0, fileName.lastIndexOf('.'));
      const thumbFileName = `${fileNameWithoutExt}_THUMBEL${fileExtension}`;
  
      // Update cover image with new thumbnail URL
      setEditedWedding((prev) => {
        if (!prev) return null;
        // Ensure coverImage exists before spreading
        if (!prev.coverImage) return prev; 
        return {
          ...prev,
          coverImage: {
            ...prev.coverImage,
            fileUrlThumbnail: `/${editedWedding.folderId}/thumbnails/${thumbFileName}`
          }
        };
      });
  
      const durationInSeconds = (data.duration / 1000).toFixed(1);
      toast.success(`✨ Miniature produite en ${durationInSeconds} s`, {
        position: "top-center",
        autoClose: 1500,
      });
  
    } catch (error) {
      toast.error(`Erreur : ${error instanceof Error ? error.message : ' inconnue'}`, {
        position: "top-center",
        autoClose: 2000,
      });
    } finally {
      setIsProcessingCoverThumbnail(false);
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
      const cacheParam = disableCache ? '&isCachingTriggle=true' : '';
      return `/api/images?fileUrl=${url}${cacheParam}`;
    }
    return image.fileUrl;
  };

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
      <div className="grid grid-cols-4 border rounded-lg p-1 min-h-[200px]">
        {editedWedding.coverImage ? (
          <div key={`${editedWedding.coverImage.id}-${updateKey}`} className='flex flex-col items-center justify-center'>
            <Image
              src={editedWedding.coverImage.fileUrlThumbnail 
                ? getImageUrl(editedWedding.coverImage, true, true) 
                : getImageUrl(editedWedding.coverImage, false, true)}
              alt={`Wedding image ${editedWedding.coverImage.id}`}
              width={128}
              height={128}
              className="w-32 h-32 object-cover rounded-2xl"
              priority={false}
              quality={25}
              key={`${editedWedding.coverImage.id}-${updateKey}`}
            />
            <p className="text-sm mt-1 text-center">
              {editedWedding.coverImage.fileType === 'coverStorage' 
                ? '(Stockage local)'  
                : '(URL externe)'}
            </p>
          </div>
        ) : (
          <p className="text-sm mt-1 text-center">Pas d&apos;image de couverture</p>
        )}
        
        <div className="flex gap-4 flex-col justify-center m-2">
          <Button 
            variant={uploadType === 'coverUrl' ? 'default' : 'outline'}
            size="sm"
            className='font-semibold border-gray-300'
            onClick={() => {
              setUploadType('coverUrl');
              setShowAddCoverImage(true);
            }}
          >
            Lien web
          </Button>
          <Button 
            variant={uploadType === 'coverFile' ? 'default' : 'outline'}
            size="sm" 
            className='font-semibold border-gray-300'
            onClick={() => {
              setUploadType('coverFile');
              setShowAddCoverImage(true);
            }}
          >
            Upload de fichier
          </Button>
          <Button 
            variant={uploadType === 'coverThumbnail' ? 'default' : 'outline'}
            size="sm"
            className='font-semibold border-gray-300'
            onClick={() => {
              setUploadType('coverThumbnail');
              setShowAddCoverImage(true);
            }}
            disabled={isProcessingCoverThumbnails}
          >
            Produire la vignette
          </Button>
        </div>

        {showAddCoverImage && (
          <div className="max-h-[170px] col-span-2 rounded-lg m-2">
            {uploadType === 'coverUrl' && (
              <div className="flex items-center space-x-2 h-full">
                <Input 
                  type="text" 
                  placeholder="Entrez l&apos;URL de l&apos;image"
                  value={newImageUrlCover}
                  onChange={handleUrlChangeCover}
                  className={`flex-1 ${isValidUrlCover ? 'border-green-500 border-2' : 'border-red-500'}`}
                />
                <Button 
                  variant="outline" 
                  onClick={() => handleAddImageByUrl('coverLink')}
                  className="bg-white border-gray-300 text-black hover:bg-green-100 border-gray-300"
                >
                  Ajouter
                </Button>
              </div>
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
              <div className="max-h-[160px] col-span-2 rounded-lg">
                {editedWedding.coverImage && editedWedding.coverImage.fileType === 'coverLink' && (
                  <div className="flex items-center space-x-2 h-full">
                    Impossible de produire une miniature pour une image externe
                  </div>
                )}
                
                {editedWedding.coverImage && editedWedding.coverImage.fileType === 'coverStorage' && (
                  <div className="flex items-center flex-col justify-center gap-4 mb-4 mt-4">
                    <div className="flex items-center flex-row justify-around gap-4">
                      <span className="text-sm">Taille : {resizeValueCover}%</span>
                      <Slider.Root
                        className="relative flex items-center w-[200px] h-5"
                        defaultValue={[20]}
                        max={100}
                        min={1}
                        step={1}
                        onValueChange={([value]) => setResizeValueCover(value)}
                      >
                        <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                          <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                        </Slider.Track>
                        <Slider.Thumb
                          className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full hover:bg-blue-50 focus:outline-none"
                          aria-label="Resize percentage"
                        />
                      </Slider.Root>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateThumbnails}
                      className="bg-white border-gray-300 text-black hover:bg-green-100 border-gray-300"
                    >
                      Lancer
                    </Button>
                    
                    {isProcessingCoverThumbnail && (
                      <div className="flex flex-col items-center gap-2 bg-gray-50 rounded-lg mt-4 p-2">
                        <div className="text-sm text-gray-600 flex justify-around items-center">
                          <p>Production de la miniature... </p> 
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Paper>
  );
}