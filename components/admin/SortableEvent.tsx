import React, { useState, useEffect } from 'react';
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
      return `/api/images?fileUrl=${coverImage.fileUrl}`;
    }
    return coverImage.fileUrl || '/placeholder.jpg';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Image
        src={getCoverImageUrl(wedding.coverImage)}
        alt={wedding.title}
        width={75}
        height={75}
        style={{ marginRight: '10px' }}
      />
      <div>
        <h4 className="font-bold text-lg">{wedding.title}</h4>
        <p className="text-base">{wedding.date}</p>
      </div>
    </div>
  );
}

const getImageUrl = (image: myImage, thumbnail: boolean = true) => {
  if (image.fileType === 'storage') {
    const url = thumbnail && image.fileUrlThumbnail ? 
      image.fileUrlThumbnail : 
      image.fileUrl;
    return `/api/images?fileUrl=${url}`|| '/placeholder.jpg';
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
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-[160px] max-w-[160px] relative aspect-auto overflow-hidden rounded-lg py-2 border border-gray-300 shadow-sm
      justify-center flex flex-col items-center bg-white hover:shadow-lg transition-all duration-200"
    >
      {/* Bouton de visibilité d'image en haut à gauche */}
      {!selectionMode && (
        <Button
          className="absolute top-3 left-3 h-8 w-8 rounded-full p-0 bg-white/80 hover:bg-white 
          border border-gray-300 shadow-sm z-10"
          size="sm"
          variant="ghost"
          onClick={handleToggleImageVisibility}
          title={imageVisible ? "Masquer l'image" : "Afficher l'image"}
        >
          {imageVisible ? (
            <Eye className="h-4 w-4 text-gray-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      )}

      {/* Bouton de suppression ou de sélection en haut à droite */}
      {selectionMode ? (
        <div
          className={`absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center
          cursor-pointer transition-all duration-300 z-10 ${
            isSelected 
              ? 'bg-green-500 transform scale-110 shadow-md' 
              : 'bg-white border border-gray-300'
          }`}
          onClick={handleToggleSelect}
        >
          {isSelected ? (
            <Check className="h-5 w-5 text-white animate-in zoom-in-50 duration-150" />
          ) : (
            <div className="h-3 w-3 rounded-full border-2 border-gray-400"></div>
          )}
        </div>
      ) : (
        <Button
          className="absolute top-3 right-3 h-8 w-8 rounded-full p-0 bg-white hover:bg-red-100 
          border border-gray-300 shadow-sm z-10"
          size="sm"
          variant="ghost"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <X className="h-4 w-4 text-gray-600 hover:text-red-600" />
        </Button>
      )}

      <div 
        {...attributes} 
        {...listeners}
        className={`cursor-move w-full ${selectionMode ? 'cursor-pointer' : ''}`}
        onClick={selectionMode ? handleToggleSelect : undefined}
      >
        <div className={`relative w-32 h-32 mx-auto rounded-2xl overflow-hidden ${isSelected ? 'opacity-95' : 'opacity-100'} transition-opacity duration-200`}>
          <Image
            src={getImageUrl(image) || '/placeholder.jpg'}
            className="object-contain"
            fill
            alt={`Wedding image ${image.id}`}
            sizes="128px"
            priority={false}
            quality={25}
          />
        </div>
        <p className="text-sm mt-1 text-center">
          {image.fileType === 'storage' 
            ? '(Stockage local)'
            : '(URL externe)'}
        </p>
      </div>
      
      {!selectionMode && (
        <div className="flex mt-2 space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="text-xs"
          >
            Description
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleDescriptionVisibility}
            className="px-2"
            title={descriptionVisible ? "Masquer la description" : "Afficher la description"}
          >
            {descriptionVisible ? (
              <SpeakerNotesIcon fontSize='small' className="h-2 w-2 text-gray-400" />
            ) : (
              <SpeakerNotesOffIcon fontSize='small' className="h-2 w-2 text-gray-600" />
            )}
          </Button>
        </div>
      )}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md font-roboto">
          <DialogHeader>
            <DialogTitle className="font-roboto">Description de l'image</DialogTitle>
            <DialogDescription>
              Modifiez la description de l'image et gérez sa visibilité.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
        <div className="flex justify-center mb-4">
          <Image
            src={getImageUrl(image, false) || '/placeholder.jpg'} 
            alt={`Image preview ${image.id}`}
            width={300}
            height={300}
            className="object-contain max-h-[300px] rounded-md"
          />
        </div>
        <Input 
          placeholder="Ajouter une description..." 
          value={description} 
          onChange={handleDescriptionChange}
          className="mb-2 font-roboto"
          autoFocus
        />
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-roboto">
            Visibilité de la description :
          </span>
          <Button
            onClick={handleToggleDescriptionVisibility}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-roboto"
          >
            {descriptionVisible ? (
          <>
            <SpeakerNotesIcon fontSize='small' className="h-4 w-4 text-gray-400" />
            <span className="font-roboto">Visible</span>
          </>
            ) : (
          <>
            <SpeakerNotesOffIcon fontSize='small' className="h-4 w-4 text-gray-600" />
            <span className="font-roboto">Masquée</span>
          </>
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 font-roboto">
            Visibilité de l'image :
          </span>
          <Button
            onClick={handleToggleImageVisibility}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 font-roboto"
          >
            {imageVisible ? (
          <>
            <Eye className="h-4 w-4 text-gray-400" />
            <span className="font-roboto">Visible</span>
          </>
            ) : (
          <>
            <EyeOff className="h-4 w-4 text-gray-600" />
            <span className="font-roboto">Masquée</span>
          </>
            )}
          </Button>
        </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={handleSaveDescription}>Enregistrer</Button>
          </DialogFooter>
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
    </div>
  );
}


