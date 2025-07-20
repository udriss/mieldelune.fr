import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Image, Wedding } from '@/lib/dataTemplate';
import { myFetch } from '@/lib/fetch-wrapper';
import { getCookie } from '@/utils/cookies';

// Import des composants
import { WeddingSelector } from './adminModifyComponents/WeddingSelector';
import { WeddingForm } from './adminModifyComponents/WeddingForm';
import { CoverImageSection } from './adminModifyComponents/CoverImageSection';
import { ThumbnailManager } from './adminModifyComponents/ThumbnailManager';
import { ImageGallery } from './adminModifyComponents/ImageGallery';

export const dynamic = "force-dynamic";

type InputStatus = 'idle' | 'typing' | 'updating' | 'error' | 'success';

interface WeddingFields {
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  [key: string]: string | undefined;
}

interface AdminWeddingsProps {
  weddings: Wedding[];
  setWeddings: React.Dispatch<React.SetStateAction<Wedding[]>>;
  onDataRefresh?: () => void;
}

interface WeddingFieldState {
  value: string;
  status: InputStatus;
  timer?: NodeJS.Timeout;
}

export function AdminWeddings({ weddings, setWeddings, onDataRefresh }: AdminWeddingsProps) {
  const [selectedWedding, setSelectedWedding] = useState<string>("");
  const [editedWedding, setEditedWedding] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [showAddImage, setShowAddImage] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'regularFile' | 'coverUrl' | 'coverFile' | 'coverThumbnail' | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageUrlCover, setNewImageUrlCover] = useState('');
  const [showAddCoverImage, setShowAddCoverImage] = useState(false);
  const [showGenerateThumbnails, setShowGenerateThumbnails] = useState(false);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [fieldStates, setFieldStates] = useState<Record<string, WeddingFieldState>>({});
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isProcessingThumbnails, setIsProcessingThumbnails] = useState(false);
  const [isProcessingCoverThumbnails, setIsProcessingCoverThumbnail] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<string[]>([]);
  const [resizeValue, setResizeValue] = useState(20); // Default 20%
  const [resizeValueCover, setResizeValueCover] = useState<number>(20);
  const [updateKey, setUpdateKey] = useState(0);
  const [isValidUrlCover, setIsValidUrlCover] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDeleteBatchProcessing, setIsDeleteBatchProcessing] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    status: string;
    processing: boolean;
    error: boolean;
  }>({
    current: 0,
    total: 0,
    percent: 0,
    status: "",
    processing: false,
    error: false
  });
  
  const handleSwitchChange = (field: string, value: boolean) => {
    if (!editedWedding) return;

    // Mettre à jour l'état local immédiatement pour la réactivité de l'UI
    const updatedWedding = { ...editedWedding, [field]: value };
    setEditedWedding(updatedWedding);

    // Mettre à jour la liste globale des mariages
    const newWeddings = weddings.map(w =>
      Number(w.id) === Number(editedWedding.id) ? updatedWedding : w
    );
    setWeddings(newWeddings);

    // Appeler la fonction de mise à jour de l'API
    updateSwitchField(field, value);
  };

  const updateSwitchField = async (field: string, value: boolean) => {
    if (!selectedWedding) return;

    try {
      const response = await myFetch('/api/updateWeddingInfos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          [field]: value
        })
      });

      if (!response.ok) throw new Error('Failed to update');
      
      const data = await response.json();
      
      if (data.success) {
        // Confirmer la mise à jour de l'état avec les données de l'API
        setEditedWedding(data.wedding);
        setWeddings(prevWeddings => 
          prevWeddings.map(w => 
            Number(w.id) === Number(selectedWedding) ? data.wedding : w
          )
        );
        toast.success('🎉 Mise à jour réussie', {
            position: "top-center",
            autoClose: 1000,
            hideProgressBar: true,
            theme: "dark",
        });
      } else {
        throw new Error(data.message || 'Échec de la mise à jour');
      }
    } catch (error) {
        // En cas d'erreur, revenir à l'état précédent
        const originalWedding = weddings.find(w => Number(w.id) === Number(selectedWedding));
        setEditedWedding(originalWedding || null);

        toast.error('Erreur lors de la mise à jour.', {
            position: "top-center",
            autoClose: 1500,
            hideProgressBar: false,
            theme: "dark",
        });
    }
  };

  const validateUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const urlObj = new URL(url, window.location.origin);

    // Check if the URL has a valid image extension
    const hasImageExtension = imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(`.${ext}`));

    return regex.test(url) && hasImageExtension;
  };
  interface UrlChangeEvent {
    target: {
      value: string;
    }
  }

  useEffect(() => {
    const lastWeddingId = getCookie('lastWeddingId');
    if (lastWeddingId && weddings.some(w => w.id.toString() === lastWeddingId)) {
      handleWeddingSelect(lastWeddingId);
    }
  }, [weddings]);

  const handleUrlChangeCover = (e: UrlChangeEvent): void => {
    const url: string = e.target.value;
    setNewImageUrlCover(url);
    setIsValidUrlCover(validateUrl(url));
  };

  const handleUrlChange = (e: UrlChangeEvent): void => {
    const url: string = e.target.value;
    setNewImageUrl(url);
    setIsValidUrl(validateUrl(url));
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!editedWedding) return;
  
    setIsDeleting(true);
    try {
      const response = await myFetch('/api/deleteEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: editedWedding.id })
      });
  
      const result = await response.json();
      if (result.success) {
        // Remove deleted wedding from state
        setWeddings((prev: Wedding[]) => prev.filter((w: Wedding) => Number(w.id) !== Number(editedWedding.id)));
        // Clear selection
        setSelectedWedding("");
        setEditedWedding(null);
        // Reset form values
        setFieldValues({});
        toast.success('🎉 Événement supprimé avec succès', {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: false,
          theme: "dark",
          style: {
            width: '350px',
          },
        });
      } else {
        toast.error(result.error || "Erreur lors de la suppression de l\'événement");
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'événement : ' + (error instanceof Error ? error.message.toLowerCase : 'code non récupéré'));
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchWeddings = async () => {
    try {
      const res = await myFetch('/api/mariages', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: {
          revalidate: 0,
          tags: ['weddings']
        }
      });
      
      const data = await res.json();
      if (data.weddings) {
        setWeddings(data.weddings);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des mariages');
    }
  };

  // Supprimé le useEffect qui causait les appels répétés à fetchWeddings
  // useEffect(() => {
  //   fetchWeddings();
  // }, [shouldRefetch]); // Re-run when shouldRefetch changes

  // Supprimer cet effet car le ThumbnailManager appelle déjà onDataRefresh directement
  // Évite la double redondance qui causait des appels multiples à fetchWeddings
  // useEffect(() => {
  //   if (updateKey > 0 && onDataRefresh) {
  //     onDataRefresh();
  //   }
  // }, [updateKey, onDataRefresh]);

  const handleWeddingSelect = (value: string) => {
    // Ne déclencher le nettoyage que si on change vraiment de mariage
    const previousWeddingId = selectedWedding;
    
    setSelectedWedding(value);
    const foundWedding = weddings.find(w => w.id === Number(value));
    setEditedWedding(foundWedding);
    
    // Log pour debug
    if (previousWeddingId !== value && previousWeddingId !== "") {
      
    }
    
    // Sauvegarder la sélection dans un cookie
    document.cookie = `lastWeddingId=${value}; path=/; max-age=31536000`; // 1 year
    
    if (foundWedding) {
      setFieldValues({
        title: foundWedding.title,
        date: foundWedding.date,
        location: foundWedding.location,
        description: foundWedding.description,
        templateType: foundWedding.templateType || 'timeline', // valeur par défaut 'timeline'
      });
    } else {
      setFieldValues({});
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Update UI immediately
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }));
  
    // Clear any existing timer
    if (fieldStates[field]?.timer) {
      clearTimeout(fieldStates[field].timer);
    }
  
    // Create new timer with latest value
    const newTimer = setTimeout(() => {
      updateField(field, value);
    }, 1500);
  
    // Update typing state
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        value,
        status: 'typing',
        timer: newTimer
      }
    }));
  };

  const updateField = async (field: string, value: string | boolean) => {
    try {
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          value: String(value),
          status: 'updating',
          timer: undefined
        }
      }));
  
      // Utilisez le nouvel endpoint updateWeddingInfos pour les champs principaux du mariage
      // Les champs supportés sont: title, date, location, description, templateType
      const response = await myFetch('/api/updateWeddingInfos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          [field]: value
        })
      });
  
      if (!response.ok) throw new Error('Failed to update');
      
      const data = await response.json();
      
      if (data.success) {
        // Mettre à jour le mariage édité dans l'état local
        setEditedWedding(data.wedding);
        
        // Mettre à jour le mariage dans la liste globale
        setWeddings(prevWeddings => 
          prevWeddings.map(w => 
            Number(w.id) === Number(selectedWedding) ? data.wedding : w
          )
        );
        
        setFieldStates(prev => ({
          ...prev,
          [field]: {
            value: String(value),
            status: 'success',
            timer: undefined
          }
        }));
      } else {
        throw new Error(data.message || 'Échec de la mise à jour');
      }
  
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Erreur lors de la mise à jour, réessayez !', {
        position: "top-center",
        autoClose: false,
        hideProgressBar: true,
        theme: "dark",
        style: {
          width: '400px',
        },
      });
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          value: String(value),
          status: 'error',
          timer: undefined
        }
      }));
    }
  };

  const handleAddImageByUrl = async (fileTypeReceived: 'link' | 'coverLink') => {
    if (!newImageUrl && !newImageUrlCover) return;
    const fileUrl = fileTypeReceived === 'link' ? newImageUrl : newImageUrlCover;
    
    try {
      const response = await myFetch('/api/addUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          fileUrl: fileUrl,
          fileType: fileTypeReceived
        })
      });
  
      if (!response.ok) throw new Error('Failed to add cover image URL');
      
      const data = await response.json();
      const updatedWedding = data.wedding;
  
      setEditedWedding(updatedWedding);
  
      setNewImageUrl('');
      setNewImageUrlCover('');
      setUploadType(null);
      toast.success(`🎉 URL ajoutée`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        }
      });
    } catch (error) {
      toast.error('Erreur lors de l&apos;ajout de l&apos;image');
    }
    setConfirmDelete(null);
  };

  const toggleVisibility = async () => {
    if (!editedWedding) return;
    try {
      const response = await myFetch('/api/updateVisibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editedWedding.id,
          visible: !editedWedding.visible
        })
      });

      if (!response.ok) throw new Error('Failed to update visibility');
      
      const updatedWedding = {
        ...editedWedding,
        visible: !editedWedding.visible
      };
  
      setEditedWedding(updatedWedding);
      const newWeddings = weddings.map(w =>
        Number(w.id) === Number(editedWedding.id) ? updatedWedding : w
      );
      setWeddings(newWeddings);
      
      toast.success(`🎉 Événement ${!editedWedding.visible ? 'visible' : 'masqué'}`, {
        position: "top-center",
        autoClose: 1500,
        theme: "dark"
      });
      
    } catch (error) {
      toast.error("Erreur lors de la mise à jour", {
        position: "top-center",
        autoClose: 1500,
        theme: "dark"
      });
    }
  };

  const handleUploadComplete = (image: Image) => {
    if (uploadType === 'coverFile') {
      setEditedWedding((prev: Wedding | null) => ({
        ...prev!,
        coverImage: image
      }));
    } else {
      setEditedWedding((prev: Wedding | null) => ({
        ...prev!,
        images: [...prev!.images, image]
      }));
    }
  };

  const handleImageDescriptionChange = async (imageId: string, description: string) => {
    try {
      const response = await myFetch('/api/updateInputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedWedding,
          imageId,
          description
        })
      });

      if (!response.ok) throw new Error('Failed to update image description');

      // Update local state
      setEditedWedding((prevWedding: Wedding) => {
        const updatedImages = prevWedding.images.map(image => 
          image.id === imageId ? { ...image, description } : image
        );
        return {
          ...prevWedding,
          images: updatedImages
        };
      });

      toast.success('🎉 Description mise à jour', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        }
      });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la description.', {
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

  return (
      <div className="justify-between items-center flex flex-col w-full">
        <div className="flex justify-between items-center w-full">
          <WeddingSelector 
            weddings={weddings} 
            selectedWedding={selectedWedding} 
            onWeddingSelect={handleWeddingSelect} 
          />
        </div>
        
        {editedWedding && (
          <>
            <WeddingForm 
              editedWedding={editedWedding}
              fieldValues={fieldValues}
              setFieldValues={setFieldValues}
              fieldStates={fieldStates}
              handleInputChange={handleInputChange}
              handleSwitchChange={handleSwitchChange}
              handleDelete={handleDelete}
              toggleVisibility={toggleVisibility}
              isDeleting={isDeleting}
            />

            <CoverImageSection 
              editedWedding={editedWedding}
              setEditedWedding={setEditedWedding}
              newImageUrlCover={newImageUrlCover}
              setNewImageUrlCover={setNewImageUrlCover}
              isValidUrlCover={isValidUrlCover}
              setIsValidUrlCover={setIsValidUrlCover}
              handleUrlChangeCover={handleUrlChangeCover}
              uploadType={uploadType}
              setUploadType={setUploadType}
              showAddCoverImage={showAddCoverImage}
              setShowAddCoverImage={setShowAddCoverImage}
              handleAddImageByUrl={handleAddImageByUrl}
              handleUploadComplete={handleUploadComplete}
              resizeValueCover={resizeValueCover}
              setResizeValueCover={setResizeValueCover}
              updateKey={updateKey}
              setUpdateKey={setUpdateKey}
              selectedWedding={selectedWedding}
              isProcessingCoverThumbnails={isProcessingCoverThumbnails}
            />

            {/* ThumbnailManager pour la génération des miniatures */}
            <ThumbnailManager 
              editedWedding={editedWedding}
              setEditedWedding={setEditedWedding}
              resizeValue={resizeValue}
              setResizeValue={setResizeValue}
              isProcessingThumbnails={isProcessingThumbnails}
              setIsProcessingThumbnails={setIsProcessingThumbnails}
              thumbnailProgress={thumbnailProgress}
              setThumbnailProgress={setThumbnailProgress}
              setUpdateKey={setUpdateKey}
              onDataRefresh={onDataRefresh}
            />

            <ImageGallery 
              editedWedding={editedWedding}
              setEditedWedding={setEditedWedding}
              selectedWedding={selectedWedding}
              uploadType={uploadType}
              setUploadType={setUploadType}
              newImageUrl={newImageUrl}
              setNewImageUrl={setNewImageUrl}
              isValidUrl={isValidUrl}
              setIsValidUrl={setIsValidUrl}
              handleUrlChange={handleUrlChange}
              handleAddImageByUrl={handleAddImageByUrl}
              handleUploadComplete={handleUploadComplete}
              selectionMode={selectionMode}
              setSelectionMode={setSelectionMode}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              isDeleteBatchProcessing={isDeleteBatchProcessing}
              setIsDeleteBatchProcessing={setIsDeleteBatchProcessing}
              deleteProgress={deleteProgress}
              setDeleteProgress={setDeleteProgress}
              handleImageDescriptionChange={handleImageDescriptionChange}
              showAddImage={showAddImage}
              setShowAddImage={setShowAddImage}
              // thumbnailProgress={thumbnailProgress}
              // isProcessingThumbnails={isProcessingThumbnails}
              updateKey={updateKey}
            />
          </>
        )}
      </div>
  );
}
