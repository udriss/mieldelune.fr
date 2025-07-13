import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, Plus, X, Save, Check, Trash2, Link, Upload, ExternalLink } from "lucide-react";
import { SortableWeddingImage } from '@/components/admin/SortableEvent';
import { FileUploader } from '@/components/admin/admin-file-uploader';
import { myFetch } from '@/lib/fetch-wrapper';
import { Wedding, Image as myImageType } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Paper, Typography, IconButton, Box } from '@mui/material';

import {createSnapModifier} from '@dnd-kit/modifiers';


// Define the grid snapping size
const gridSize = 3; // pixels
const snapToGridModifier = createSnapModifier(gridSize);

// Custom drop animation for smoother transitions
const dropAnimationConfig = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

interface ImageGalleryProps {
  editedWedding: Wedding;
  setEditedWedding: React.Dispatch<React.SetStateAction<Wedding | null>>;
  selectedWedding: string;
  uploadType: 'url' | 'regularFile' | 'coverUrl' | 'coverFile' | 'coverThumbnail' | null;
  setUploadType: React.Dispatch<React.SetStateAction<'url' | 'regularFile' | 'coverUrl' | 'coverFile' | 'coverThumbnail' | null>>;
  newImageUrl: string;
  setNewImageUrl: React.Dispatch<React.SetStateAction<string>>;
  isValidUrl: boolean;
  setIsValidUrl: React.Dispatch<React.SetStateAction<boolean>>;
  handleUrlChange: (e: { target: { value: string } }) => void;
  handleAddImageByUrl: (fileTypeReceived: 'link' | 'coverLink') => Promise<void>;
  handleUploadComplete: (image: myImageType) => void;
  selectionMode: boolean;
  setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedImages: string[];
  setSelectedImages: React.Dispatch<React.SetStateAction<string[]>>;
  isDeleteBatchProcessing: boolean;
  setIsDeleteBatchProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  deleteProgress: {
    current: number;
    total: number;
    percent: number;
    status: string;
    processing: boolean;
    error: boolean;
  };
  setDeleteProgress: React.Dispatch<React.SetStateAction<{
    current: number;
    total: number;
    percent: number;
    status: string;
    processing: boolean;
    error: boolean;
  }>>;
  handleImageDescriptionChange: (imageId: string, description: string) => Promise<void>;
  showAddImage: boolean;
  setShowAddImage: React.Dispatch<React.SetStateAction<boolean>>;
  updateKey: number;
}

export function ImageGallery({
  editedWedding,
  setEditedWedding,
  selectedWedding,
  uploadType,
  setUploadType,
  newImageUrl,
  setNewImageUrl,
  isValidUrl,
  setIsValidUrl,
  handleUrlChange,
  handleAddImageByUrl,
  handleUploadComplete,
  selectionMode,
  setSelectionMode,
  selectedImages,
  setSelectedImages,
  isDeleteBatchProcessing,
  setIsDeleteBatchProcessing,
  deleteProgress,
  setDeleteProgress,
  handleImageDescriptionChange,
  showAddImage,
  setShowAddImage,
  updateKey
}: ImageGalleryProps) {
  const [sortedImages, setSortedImages] = useState<myImageType[]>(editedWedding?.images || []);
  const [orderChanged, setOrderChanged] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [isVisibilityBatchProcessing, setIsVisibilityBatchProcessing] = useState(false);
  const [visibilityProgress, setVisibilityProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    status: '',
    processing: false,
    error: false
  });

  const [isDescVisibilityBatchProcessing, setIsDescVisibilityBatchProcessing] = useState(false);
  const [descVisibilityProgress, setDescVisibilityProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    status: '',
    processing: false,
    error: false
  });

  // Update sortedImages when editedWedding changes - using useEffect instead of useState
  useEffect(() => {
    if (editedWedding?.images) {
      setSortedImages(editedWedding.images);
    }
  }, [editedWedding, editedWedding?.images]); // Add dependencies to ensure it updates when images change

  // Use multiple sensors for better drag detection across devices
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Lower activation distance to make it less jittery
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Increased delay to avoid accidental drags on touch devices
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleImagesDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = sortedImages.findIndex((img) => img.fileUrl === active.id);
    const newIndex = sortedImages.findIndex((img) => img.fileUrl === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      setSortedImages(arrayMove(sortedImages, oldIndex, newIndex));
      setOrderChanged(true); // Marquer que l'ordre a été modifié
    }
  };

  const saveImagesOrder = async () => {
    if (!editedWedding) return;

    try {
      const response = await myFetch('/api/updateImagesOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: editedWedding.id,
          images: sortedImages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update images order');
      }

      const data = await response.json();
      
      // Mise à jour du state local
      if (data.updatedWeddings) {
        const updatedWedding = data.updatedWeddings.find(
          (w: Wedding) => Number(w.id) === Number(editedWedding.id)
        );
        if (updatedWedding) {
          setEditedWedding(updatedWedding);
          setSortedImages(updatedWedding.images);
        }
      }
      
      // Réinitialiser l'état de modification de l'ordre
      setOrderChanged(false);
      
      toast.success('Ordre des images mis à jour avec succès', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        }
      });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l&apos;ordre des images');
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedImages([]);
    }
  };

  const selectAllImages = () => {
    if (editedWedding && editedWedding.folderId && editedWedding.images) {
      let tmp_cst = editedWedding.images.map((img: any) => img.id);
      setSelectedImages(tmp_cst);
    }
  };

  const deselectAllImages = () => {
    setSelectedImages([]);
  };

  const handleDeleteSelectedImages = async () => {
    if (selectedImages.length === 0 || !editedWedding) return;

    // Réinitialiser l'état de progression
    setDeleteProgress({
      current: 0,
      total: selectedImages.length,
      percent: 0,
      status: `Préparation de la suppression de ${selectedImages.length} image(s)...`,
      processing: true,
      error: false
    });
    
    setIsDeleteBatchProcessing(true);
    try {
      // Importer la fonction deleteMultipleImages ici pour éviter des problèmes de dépendances circulaires
      const { deleteMultipleImages } = await import('@/components/admin/bashImageUpdate'); 
      
      await deleteMultipleImages(
        editedWedding.id, 
        selectedImages, 
        setEditedWedding,
        setDeleteProgress
      );

      setSelectedImages([]);
      
    } catch (error) {
      console.error("Erreur lors de la suppression des images:", error);
      
      setDeleteProgress(prev => ({
        ...prev,
        status: "Erreur lors de la suppression des images",
        processing: false,
        error: true
      }));
      
    } finally {
      setTimeout(() => {
        setIsDeleteBatchProcessing(false);
      }, 1500);
    }
  };

  const toggleImageSelection = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const handleShowSelectedImages = async () => {
    if (selectedImages.length === 0 || !editedWedding) return;

    // Réinitialiser l'état de progression
    setVisibilityProgress({
      current: 0,
      total: selectedImages.length,
      percent: 0,
      status: `Préparation de l'affichage de ${selectedImages.length} image(s)...`,
      processing: true,
      error: false
    });
    
    setIsVisibilityBatchProcessing(true);
    try {
      // Importer la fonction updateMultipleImagesVisibility pour éviter des problèmes de dépendances circulaires
      const { updateMultipleImagesVisibility } = await import('@/components/admin/bashImageUpdate'); 
      
      await updateMultipleImagesVisibility(
        editedWedding.id, 
        selectedImages, 
        true, // true pour rendre visible
        setEditedWedding,
        setVisibilityProgress,
        false // désactiver les toasts individuels
      );

      // Afficher un seul toast à la fin
      toast.success(`🎉 ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} rendue${selectedImages.length > 1 ? 's' : ''} visible${selectedImages.length > 1 ? 's' : ''}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité des images:", error);
      
      setVisibilityProgress(prev => ({
        ...prev,
        status: "Erreur lors de l'affichage des images",
        processing: false,
        error: true
      }));
      
      toast.error('Erreur lors de l\'affichage des images', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
      
    } finally {
      setTimeout(() => {
        setIsVisibilityBatchProcessing(false);
      }, 1500);
    }
  };

  const handleHideSelectedImages = async () => {
    if (selectedImages.length === 0 || !editedWedding) return;

    // Réinitialiser l'état de progression
    setVisibilityProgress({
      current: 0,
      total: selectedImages.length,
      percent: 0,
      status: `Préparation du masquage de ${selectedImages.length} image(s)...`,
      processing: true,
      error: false
    });
    
    setIsVisibilityBatchProcessing(true);
    try {
      // Importer la fonction updateMultipleImagesVisibility pour éviter des problèmes de dépendances circulaires
      const { updateMultipleImagesVisibility } = await import('@/components/admin/bashImageUpdate'); 
      
      await updateMultipleImagesVisibility(
        editedWedding.id, 
        selectedImages, 
        false, // false pour masquer
        setEditedWedding,
        setVisibilityProgress,
        false // désactiver les toasts individuels
      );

      // Afficher un seul toast à la fin
      toast.success(`🎉 ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} masquée${selectedImages.length > 1 ? 's' : ''}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité des images:", error);
      
      setVisibilityProgress(prev => ({
        ...prev,
        status: "Erreur lors du masquage des images",
        processing: false,
        error: true
      }));
      
      toast.error('Erreur lors du masquage des images', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
      
    } finally {
      setTimeout(() => {
        setIsVisibilityBatchProcessing(false);
      }, 1500);
    }
  };

  const handleShowSelectedDescriptions = async () => {
    if (selectedImages.length === 0 || !editedWedding) return;

    // Réinitialiser l'état de progression
    setDescVisibilityProgress({
      current: 0,
      total: selectedImages.length,
      percent: 0,
      status: `Préparation de l'affichage de ${selectedImages.length} description(s)...`,
      processing: true,
      error: false
    });
    
    setIsDescVisibilityBatchProcessing(true);
    try {
      // Importer la fonction updateMultipleDescriptionsVisibility
      const { updateMultipleDescriptionsVisibility } = await import('@/components/admin/bashImageUpdate'); 
      
      await updateMultipleDescriptionsVisibility(
        editedWedding.id, 
        selectedImages, 
        true, // true pour rendre visible
        setEditedWedding,
        setDescVisibilityProgress,
        false // désactiver les toasts individuels
      );

      // Afficher un seul toast à la fin
      toast.success(`🎉 ${selectedImages.length} description${selectedImages.length > 1 ? 's' : ''} rendue${selectedImages.length > 1 ? 's' : ''} visible${selectedImages.length > 1 ? 's' : ''}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité des descriptions:", error);
      
      setDescVisibilityProgress(prev => ({
        ...prev,
        status: "Erreur lors de l'affichage des descriptions",
        processing: false,
        error: true
      }));
      
      toast.error('Erreur lors de l\'affichage des descriptions', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
      
    } finally {
      setTimeout(() => {
        setIsDescVisibilityBatchProcessing(false);
      }, 1500);
    }
  };

  const handleHideSelectedDescriptions = async () => {
    if (selectedImages.length === 0 || !editedWedding) return;

    // Réinitialiser l'état de progression
    setDescVisibilityProgress({
      current: 0,
      total: selectedImages.length,
      percent: 0,
      status: `Préparation du masquage de ${selectedImages.length} description(s)...`,
      processing: true,
      error: false
    });
    
    setIsDescVisibilityBatchProcessing(true);
    try {
      // Importer la fonction updateMultipleDescriptionsVisibility
      const { updateMultipleDescriptionsVisibility } = await import('@/components/admin/bashImageUpdate'); 
      
      await updateMultipleDescriptionsVisibility(
        editedWedding.id, 
        selectedImages, 
        false, // false pour masquer
        setEditedWedding,
        setDescVisibilityProgress,
        false // désactiver les toasts individuels
      );

      // Afficher un seul toast à la fin
      toast.success(`🎉 ${selectedImages.length} description${selectedImages.length > 1 ? 's' : ''} masquée${selectedImages.length > 1 ? 's' : ''}`, {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '350px' }
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la visibilité des descriptions:", error);
      
      setDescVisibilityProgress(prev => ({
        ...prev,
        status: "Erreur lors du masquage des descriptions",
        processing: false,
        error: true
      }));
      
      toast.error('Erreur lors du masquage des descriptions', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: { width: '400px' }
      });
      
    } finally {
      setTimeout(() => {
        setIsDescVisibilityBatchProcessing(false);
      }, 1500);
    }
  };

  return (
    <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Galerie d'images
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => window.open(`/mariage/${editedWedding?.id}`, '_blank')}
            title="Voir la page du mariage"
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
            Voir la page du mariage
          </Typography>
        </Box>
      </Box>
      {/* Barre d'outils principale */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
        {/* Actions sur les images */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowAddImage(!showAddImage)}
            variant={showAddImage ? "outline" : "outline"}
            size="sm"
            className={showAddImage ? "bg-blue-200 hover:bg-blue-300 text-black" : ""}
          >
            {showAddImage ? <X className="w-4 h-4 mr-1 red-600 " color="red"/> : <Plus className="w-4 h-4 mr-1" />}
            {showAddImage ? "Fermer l'ajout" : "Ajouter une image"}
          </Button>
          
          <Button
            onClick={toggleSelectionMode}
            variant={selectionMode ? "secondary" : "outline"}
            size="sm"
            className={selectionMode ? "bg-purple-100 border-purple-300 text-purple-700" : ""}
          >
            {selectionMode ? <Check className="w-4 h-4 mr-1" /> : <Check className="w-4 h-4 mr-1" />}
            {selectionMode ? "Quitter la sélection" : "Actions en lot sur les images"}
          </Button>
          
          <Button
            onClick={saveImagesOrder}
            variant="outline"
            size="sm"
            className={`border-gray-300 ${orderChanged ? 'save-button-highlight' : ''}`}
          >
            <Save className="w-4 h-4 mr-1" />
            Sauvegarder l'ordre
          </Button>
        </div>
      </div>
      
      {/* Options de sélection */}
      {selectionMode && (
        <div className="mb-6 p-3 bg-purple-50 rounded-lg border border-purple-200 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-purple-700 mr-2">Sélection active:</span>
          <Button
            onClick={selectAllImages}
            variant="outline"
            size="sm"
            disabled={!editedWedding?.images?.length}
            className="bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            Tout sélectionner
          </Button>
          <Button
            onClick={deselectAllImages}
            variant="outline"
            size="sm"
            disabled={selectedImages.length === 0}
            className="bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
          >
            Tout désélectionner
          </Button>
          
          {/* Nouveaux boutons pour la visibilité des images */}
          <Button
            onClick={handleShowSelectedImages}
            variant="outline"
            size="sm"
            disabled={selectedImages.length === 0 || isVisibilityBatchProcessing}
            className="bg-white border-teal-300 text-teal-700 hover:bg-teal-100"
          >
            {isVisibilityBatchProcessing ? (
              <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Traitement...</span>
            ) : (
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1" /> Afficher</span>
            )}
          </Button>
          <Button
            onClick={handleHideSelectedImages}
            variant="outline"
            size="sm"
            disabled={selectedImages.length === 0 || isVisibilityBatchProcessing}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            {isVisibilityBatchProcessing ? (
              <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Traitement...</span>
            ) : (
              <span className="flex items-center"><EyeOff className="w-4 h-4 mr-1" /> Masquer</span>
            )}
          </Button>
          
          <Button
            onClick={handleShowSelectedDescriptions}
            variant="outline"
            size="sm"
            disabled={selectedImages.length === 0 || isDescVisibilityBatchProcessing}
            className="bg-white border-teal-300 text-teal-700 hover:bg-teal-100"
          >
            {isDescVisibilityBatchProcessing ? (
              <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Traitement...</span>
            ) : (
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1" /> Afficher les descriptions</span>
            )}
          </Button>
          <Button
            onClick={handleHideSelectedDescriptions}
            variant="outline"
            size="sm"
            disabled={selectedImages.length === 0 || isDescVisibilityBatchProcessing}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            {isDescVisibilityBatchProcessing ? (
              <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Traitement...</span>
            ) : (
              <span className="flex items-center"><EyeOff className="w-4 h-4 mr-1" /> Masquer les descriptions</span>
            )}
          </Button>
          
          <div className="ml-auto">
            <Button
              onClick={handleDeleteSelectedImages}
              variant="destructive"
              size="sm"
              disabled={selectedImages.length === 0 || isDeleteBatchProcessing}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleteBatchProcessing ? (
                <span className="flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Suppression...</span>
              ) : (
                <span className="flex items-center"><Trash2 className="w-4 h-4 mr-1" /> Supprimer ({selectedImages.length})</span>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Barre de progression pour la suppression */}
      {deleteProgress.processing && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 transition-opacity duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center">
              {deleteProgress.error ? (
                <div className="w-5 h-5 mr-2 rounded-full bg-red-500 flex items-center justify-center text-white">
                  !
                </div>
              ) : (
                <Loader2 className="w-5 h-5 mr-2 animate-spin text-red-600" />
              )}
              <div className="text-sm font-medium text-red-700">
                {deleteProgress.status}
              </div>
            </div>
            
            <div className="w-full flex flex-col gap-2">
              {/* Barre de progression principale */}
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    deleteProgress.error ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${deleteProgress.percent}%` }}
                />
              </div>
              
              {/* Indicateurs d'étapes */}
              <div className="flex justify-between w-full mt-1">
                {Array.from({ length: Math.min(deleteProgress.total, 10) }).map((_, idx) => {
                  // Si nous avons plus de 10 images, on agrège
                  const step = Math.ceil((idx + 1) * (deleteProgress.total / 10));
                  const isCompleted = deleteProgress.current >= step;
                  const isCurrent = deleteProgress.current < step && 
                                   deleteProgress.current >= (step - Math.ceil(deleteProgress.total / 10));
                  
                  return (
                    <div 
                      key={idx} 
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200'
                      }`}
                    >
                      {isCompleted && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Formulaire d'ajout d'images */}
      {showAddImage && (
        <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-700">Ajouter une nouvelle image</h4>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0 rounded-full"
              onClick={() => setShowAddImage(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setUploadType('url')}
              variant={uploadType === 'url' ? "default" : "outline"}
              className={uploadType === 'url' ? "bg-blue-600 hover:bg-blue-700" : "bg-white"}
            >
              <Link className="w-4 h-4 mr-1" />
              Lien web
            </Button>
            <Button
              onClick={() => setUploadType('regularFile')}
              variant={uploadType === 'regularFile' ? "default" : "outline"}
              className={uploadType === 'regularFile' ? "bg-blue-600 hover:bg-blue-700" : "bg-white"}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload de fichier
            </Button>
          </div>

          {uploadType === 'url' && (
            <div className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Entrez l'URL de l'image"
                value={newImageUrl}
                onChange={handleUrlChange}
                className={`flex-1 ${isValidUrl ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}
              />
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!isValidUrl}
                onClick={() => handleAddImageByUrl('link')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          )}

          {uploadType === 'regularFile' && (
            <FileUploader
              selectedWedding={selectedWedding}
              uploadType={uploadType} 
              onUploadComplete={handleUploadComplete}
            />
          )}
        </div>
      )}
      
      {/* Galerie d'images */}
      <div className="mt-6">
        <div className='flex flex-row justify-center items-center w-full'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleImagesDragEnd}
            modifiers={[snapToGridModifier]}
          >
            <SortableContext
              items={sortedImages.map((img) => img.fileUrl)} 
              strategy={rectSortingStrategy}
            >
              <div className='grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full maw-w-[200px]'>
                {sortedImages.map((image) => (
                  <SortableWeddingImage 
                    key={`${image.id}-${updateKey}`} 
                    image={image}
                    onDescriptionChange={handleImageDescriptionChange}
                    selectedWedding={selectedWedding}
                    selectionMode={selectionMode}
                    isSelected={selectedImages.includes(image.id)}
                    onSelect={toggleImageSelection}
                    setEditedWedding={setEditedWedding}
                  />
                ))}
              </div>
            </SortableContext>
            
            {/* Drag overlay for better visual feedback */}
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeId ? (
                <div className="min-w-[180px] max-w-[220px] relative aspect-auto overflow-hidden rounded-lg py-2 border-2 border-blue-500 shadow-lg bg-white opacity-90 flex flex-col items-center justify-center">
                  <Image
                    src={sortedImages.find(img => img.fileUrl === activeId)?.fileUrl || '/placeholder.jpg'}
                    className="w-32 h-32 object-cover rounded-2xl mx-auto"
                    width={128}
                    height={128}
                    alt="Dragging image"
                    priority={false}
                    quality={25}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      <style jsx global>{`
        .save-button-highlight {
          animation: pulse-border 1.5s infinite;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          background-color: rgba(240, 255, 244, 0.8) !important;
          transition: all 0.3s ease;
        }
        
        @keyframes pulse-border {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }
        
        /* Styles for draggable items */
        [data-dnd-draggable-dragging] {
          z-index: 999;
          opacity: 0.8;
          transform: scale(1.05) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          transition: transform 200ms ease, box-shadow 200ms ease !important;
        }
      `}</style>
    </Paper>
  );
}