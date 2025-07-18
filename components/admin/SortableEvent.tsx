import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button as MuiButton, IconButton, Chip, Divider } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Wedding, Image as myImage } from '@/lib/dataTemplate';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogClose, 
  DialogDescription
} from "@/components/ui/dialog";
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import SpeakerNotesOffIcon from '@mui/icons-material/SpeakerNotesOff';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsIcon from '@mui/icons-material/Settings';

interface PropsEvent {
  wedding: Wedding;
}

export function SortableEvent({ wedding }: PropsEvent) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: wedding.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    border: '1px solid #ccc',
    marginBottom: '5px',
    backgroundColor: '#fff',
    borderRadius: '10px',
  };

  // Helper pour obtenir l'URL de la cover via l'API si besoin
  const getCoverImageUrl = (coverImage: Wedding["coverImage"]) => {
    if (!coverImage) return '/placeholder.jpg';
    if (coverImage.fileType === 'storage' || coverImage.fileType === 'coverStorage') {
      // Utiliser la thumbnail si elle existe, sinon l'image originale
      const url = coverImage.fileUrlThumbnail ? 
        coverImage.fileUrlThumbnail : 
        coverImage.fileUrl;
      return `/api/images?fileUrl=${url}&isCachingTriggle=true`;
    }
    return coverImage.fileUrl || '/placeholder.jpg';
  };

  return (
    <Paper ref={setNodeRef} style={style} {...attributes} {...listeners} elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Image
          src={getCoverImageUrl(wedding.coverImage)}
          alt={wedding.title}
          width={75}
          height={75}
          style={{ marginRight: '10px', borderRadius: '8px' }}
        />
        <Box>
          <Typography variant="h6" fontWeight={700}>{wedding.title}</Typography>
          <Typography variant="body2" color="text.secondary">{wedding.date}</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

const getImageUrl = (image: myImage, thumbnail: boolean = true) => {
  if (image.fileType === 'storage') {
    const url = thumbnail && image.fileUrlThumbnail ? 
      image.fileUrlThumbnail : 
      image.fileUrl;
    return `/api/images?fileUrl=${url}&isCachingTriggle=true` || '/placeholder.jpg';
  }
  return image.fileUrl;
}

interface PropsImage {
  image: myImage;
  onDescriptionChange?: (imageId: string, description: string) => void;
  selectedWedding?: number | string;
  setEditedWedding?: (wedding: any) => void;
  onSelect?: (imageId: string, selected: boolean) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

export function SortableWeddingImage({ 
  image, 
  onDescriptionChange, 
  selectedWedding, 
  setEditedWedding, 
  onSelect, 
  isSelected = false,
  selectionMode = false
}: PropsImage) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.fileUrl });

  const [description, setDescription] = useState(image.description || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [descriptionVisible, setDescriptionVisible] = useState(image.descriptionVisibility !== false);
  const [imageVisible, setImageVisible] = useState(image.imageVisibility !== false);

  // Mise à jour des états locaux lorsque les props image changent
  useEffect(() => {
    setDescriptionVisible(image.descriptionVisibility !== false);
    setImageVisible(image.imageVisibility !== false);
    setDescription(image.description || "");
  }, [image.descriptionVisibility, image.imageVisibility, image.description]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleSaveDescription = () => {
    if (onDescriptionChange) {
      onDescriptionChange(image.id, description);
      setIsModalOpen(false);
    }
  };

  const handleToggleDescriptionVisibility = async () => {
    // Toggle the local state first for immediate UI feedback
    const newVisibility = !descriptionVisible;
    setDescriptionVisible(newVisibility);

    try {
      const response = await myFetch('/api/updateDescriptionVisibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          imageId: image.id,
          descriptionVisibility: newVisibility
        })
      });

      if (!response.ok) throw new Error('Failed to update description visibility');

      if (setEditedWedding) {
        setEditedWedding((prevWedding: Wedding) => {
          const updatedImages = prevWedding.images.map(img => {
            if (img.id === image.id) {
              return {
                ...img,
                descriptionVisibility: newVisibility
              };
            }
            return img;
          });
          return {
            ...prevWedding,
            images: updatedImages
          };
        });
      }

      toast.success(`Description ${newVisibility ? 'visible' : 'masquée'}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '250px',
        }
      });
    } catch (error) {
      // Revert the local state on error
      setDescriptionVisible(!newVisibility);
      toast.error('Erreur lors de la mise à jour.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        }
      });
    }
  };

  const handleToggleImageVisibility = async () => {
    // Bascule l'état local d'abord pour un retour UI immédiat
    const newVisibility = !imageVisible;
    setImageVisible(newVisibility);

    try {
      const response = await myFetch('/api/updateImageVisibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          imageId: image.id,
          imageVisibility: newVisibility
        })
      });

      if (!response.ok) throw new Error('Échec de la mise à jour de la visibilité de l\'image');

      if (setEditedWedding) {
        setEditedWedding((prevWedding: Wedding) => {
          const updatedImages = prevWedding.images.map(img => {
            if (img.id === image.id) {
              return {
                ...img,
                imageVisibility: newVisibility
              };
            }
            return img;
          });
          return {
            ...prevWedding,
            images: updatedImages
          };
        });
      }

      toast.success(`Image ${newVisibility ? 'visible' : 'masquée'}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '250px',
        }
      });
    } catch (error) {
      // Rétablir l'état local en cas d'erreur
      setImageVisible(!newVisibility);
      toast.error('Erreur lors de la mise à jour.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        }
      });
    }
  };

  const handleImageDelete = async () => {
    // Vérifier si l'ID de l'image existe
    if (!image.id) {
      toast.error('ID d\'image manquant', {
        position: "top-center",
        autoClose: 1500,
        theme: "dark"
      });
      setIsDeleteModalOpen(false);
      return;
    }

    if (!selectedWedding) {
      toast.error('ID wedding manquant', {
        position: "top-center",
        autoClose: 1500,
        theme: "dark"
      });
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      const response = await myFetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          imageId: image.id,
          fileType: image.fileType
        })
      });
      
      if (!response.ok) throw new Error('Failed to delete image');
  
      if (setEditedWedding) {
        setEditedWedding((prevWedding: Wedding) => {
          const updatedImages = prevWedding.images.filter(img => img.id !== image.id);
          return {
            ...prevWedding,
            images: updatedImages
          };
        });
      }
  
      toast.success('🎉 Image supprimée', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '250px',
        }
      });
    } catch (error) {
      toast.error('Erreur lors de la suppression.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        }
      });
    }
    setIsDeleteModalOpen(false);
  };

  const handleToggleSelect = () => {
    if (onSelect) {
      onSelect(image.id, !isSelected);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{ minWidth: 160, maxWidth: 160, position: 'relative', aspectRatio: 'auto', overflow: 'hidden', borderRadius: 2, py: 2, border: '1px solid #e0e0e0', boxShadow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'white', transition: 'box-shadow 0.2s' }}
      elevation={2}
    >
      
      {/* Bouton de suppression ou de sélection en haut à droite */}
      {selectionMode && (
        <IconButton
          sx={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, bgcolor: isSelected ? 'green.500' : 'white', border: isSelected ? 'none' : '1px solid #e0e0e0', boxShadow: isSelected ? 3 : 1, zIndex: 10, p: 0, transform: isSelected ? 'scale(1.1)' : 'none', transition: 'all 0.2s' }}
          onClick={handleToggleSelect}
        >
          {isSelected ? <Check style={{ width: 22, height: 22, color: 'white' }} /> : <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #aaa' }} />}
        </IconButton>
      )}

      <Box
        {...attributes}
        {...listeners}
        sx={{ cursor: selectionMode ? 'pointer' : 'move', width: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
         }}
        onClick={selectionMode ? handleToggleSelect : undefined}
      >
        <Box sx={{ position: 'relative', width: 128, height: 128, mx: 'auto', borderRadius: 3, overflow: 'hidden', opacity: isSelected ? 0.95 : 1, transition: 'opacity 0.2s' }}>
          <Image
            src={getImageUrl(image) || '/placeholder.jpg'}
            style={{ objectFit: 'contain' }}
            fill
            alt={`Wedding image ${image.id}`}
            sizes="128px"
            priority={false}
            quality={25}
          />
        </Box>
        <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', width: '100%' }}>
          {image.fileType === 'storage' ? '(Stockage local)' : '(URL externe)'}
        </Typography>
      </Box>

      {!selectionMode && (
        <Box sx={{ display: 'flex', mt: 2, gap: .5, width: '100%', justifyContent: 'center' }}>
            <MuiButton 
            size="small" 
            variant="outlined"
            onClick={() => setIsModalOpen(true)}
            sx={{ fontSize: '0.75rem', px: 1, minWidth: 0 }}
            >
              <SettingsIcon fontSize='small' sx={{ color: '#888' }} />
            </MuiButton>
          <MuiButton
            size="small"
            variant="text"
            onClick={handleToggleDescriptionVisibility}
            sx={{ px: 1, minWidth: 0 }}
            title={descriptionVisible ? "Masquer la description" : "Afficher la description"}
          >
            {descriptionVisible ? (
              <SpeakerNotesIcon fontSize='small' sx={{ color: '#888' }} />
            ) : (
              <SpeakerNotesOffIcon fontSize='small' sx={{ color: '#888' }} />
            )}
          </MuiButton>
          {/* Bouton de suppression d'image */}
        <IconButton
          sx={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, bgcolor: 'white', border: '1px solid #e0e0e0', boxShadow: 1, zIndex: 10, p: 0, '&:hover': { bgcolor: '#ffeaea' } }}
          size="small"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <X style={{ width: 18, height: 18, color: '#d32f2f' }} />
        </IconButton>
        {/* Bouton de visibilité d'image */}
        <IconButton
          sx={{ position: 'absolute', top: 12, left: 12, width: 32, height: 32, bgcolor: 'white', border: '1px solid #e0e0e0', boxShadow: 1, zIndex: 10, p: 0, '&:hover': { bgcolor: '#f5f5f5' } }}
          size="small"
          onClick={handleToggleImageVisibility}
          title={imageVisible ? "Masquer l'image" : "Afficher l'image"}
        >
          {imageVisible ? <Eye style={{ width: 18, height: 18, color: '#666' }} /> : <EyeOff style={{ width: 18, height: 18, color: '#666' }} />}
        </IconButton>
        </Box>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}
      >
        <DialogContent 
          className="font-roboto"
          style={{
            marginTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            padding: 0,
            background: 'white',
            maxWidth: '90vw',
            width: 'auto',
            maxHeight: '90vh',
            height: 'auto',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flexShrink: 0, p: 2.5, pb: 0, background: 'white', zIndex: 2 }}>
            <DialogHeader>
                <DialogTitle className="font-roboto">Configuration de l'image</DialogTitle>
              <DialogDescription>
                Modifiez la description de l'image et gérez sa visibilité.
              </DialogDescription>
            </DialogHeader>
          </Box>
          <Box sx={{ flex: '1 1 auto', overflow: 'auto', p: 2.5, pt: 1.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <Tabs defaultValue="original" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original">Image originale</TabsTrigger>
                <TabsTrigger 
                  value="thumbnail" 
                  disabled={!image.fileUrlThumbnail}
                >
                  Miniature
                </TabsTrigger>
              </TabsList>
              <TabsContent value="original" className="flex justify-center mt-0">
                <Box sx={{ width: '100%', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', 
                  minHeight: 300, minWidth: 300, p: 2, boxSizing: 'border-box' 
                  }}>
                  <Image
                    src={getImageUrl(image, false) || '/placeholder.jpg'}
                    alt={`Image preview ${image.id}`}
                    width={image.width || 800}
                    height={image.height || 600}
                    style={{
                      display: 'block',
                      margin: '0 auto',
                      maxWidth: '90vw',
                      maxHeight: '70vh',
                      width: 'auto',
                      height: 'auto',
                      aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
                      borderRadius: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      background: '#fff',
                      overflow: 'hidden',
                    }}
                    className="bg-white"
                  />
                </Box>
              </TabsContent>
              <TabsContent value="thumbnail" className="flex justify-center mt-0">
                {image.fileUrlThumbnail ? (
                  <Box sx={{ width: '100%', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', 
                  minHeight: 300, minWidth: 300, p: 2, boxSizing: 'border-box' 
                  }}>
                    <Image
                      src={getImageUrl(image, true) || '/placeholder.jpg'}
                      alt={`Thumbnail preview ${image.id}`}
                      width={image.width || 800}
                      height={image.height || 600}
                      style={{
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '90vw',
                        maxHeight: '70vh',
                        width: 'auto',
                        height: 'auto',
                        aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        background: '#fff',
                        overflow: 'hidden',
                      }}
                      className="bg-white"
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'text.secondary' }}>
                    Aucune miniature disponible
                  </Box>
                )}
              </TabsContent>
            </Tabs>

        <Box sx={{ 
          mt: 2, display: 'flex',
         flexDirection: 'column', 
          gap: 1, 
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
           }}>
        <Input 
          placeholder="Ajouter une description..." 
          value={description} 
          onChange={handleDescriptionChange}
          className="mb-2 font-roboto"
          autoFocus
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Roboto', fontWeight: 500 }}>
          {description.length} caractères
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mt: 2,
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
         }}>
          <Button
            onClick={handleToggleDescriptionVisibility}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-roboto"
          >
            {descriptionVisible ? (
          <>
            <SpeakerNotesIcon fontSize='small' className="h-4 w-4 text-gray-400" />
            <Typography variant='overline' sx={{ fontFamily: 'Roboto', fontWeight: 500, ml: 1, display: 'inline' }}>Description visible</Typography>
          </>
            ) : (
          <>
            <SpeakerNotesOffIcon fontSize='small' className="h-4 w-4 text-gray-600" />
            <Typography variant='overline' sx={{ fontFamily: 'Roboto', fontWeight: 500, ml: 1, display: 'inline' }}>Description masquée</Typography>
          </>
            )}
          </Button>
          <Button
            onClick={handleToggleImageVisibility}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-roboto"
          >
            {imageVisible ? (
          <>
            <Eye className="h-4 w-4 text-gray-400" />
            <Typography variant="overline" sx={{ fontFamily: 'Roboto', fontWeight: 500, ml: 1, display: 'inline' }}>Image visible</Typography>
          </>
            ) : (
          <>
            <EyeOff className="h-4 w-4 text-gray-600" />
            <Typography variant="overline" sx={{ fontFamily: 'Roboto', fontWeight: 500, ml: 1, display: 'inline' }}>Image masquée</Typography>
          </>
            )}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Roboto', fontWeight: 500 }}>
          Cliquez sur l'icône pour modifier la visibilité de la description ou de l'image.
        </Typography>
        </Box>
          </Box>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleSaveDescription}>Enregistrer</Button>
            </DialogFooter>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l'image</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleImageDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}


