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
import { Paper, Typography, IconButton, Box, Button as MuiButton, ToggleButtonGroup, ToggleButton } from '@mui/material';

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
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "column" },
          justifyContent: "space-between",
          alignItems: { xs: "space-around", lg: "space-around" },
          gap: 1,
          mb: 6,
          bgcolor: "#f9fafb",
          p: 2.5,
          borderRadius: 2,
          boxShadow: 1,
          width: "100%",
        }}
      >
        {/* Actions sur les images */}
        <Box
          sx={{
        display: "flex",
        flexDirection: "column",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-around",
        gap: 1.5,
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
          }}
        >
          <MuiButton
        onClick={() => setShowAddImage(!showAddImage)}
        variant={showAddImage ? "outlined" : "outlined"}
        size="small"
        sx={{
          bgcolor: showAddImage ? "#dbeafe" : "#fff",
          borderColor: showAddImage ? "#93c5fd" : "#d1d5db",
          color: "black",
          "&:hover": {
            bgcolor: showAddImage ? "#bfdbfe" : "#dcfce7",
            borderColor: showAddImage ? "#60a5fa" : "#d1d5db",
          },
          width: "100%",
        }}
          >
        {showAddImage ? (
          <X style={{ width: 16, height: 16, marginRight: 4, color: "red" }} />
        ) : (
          <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
        )}
        {showAddImage ? "Fermer l'ajout" : "Ajouter une image"}
          </MuiButton>
          <MuiButton
        onClick={toggleSelectionMode}
        variant={selectionMode ? "contained" : "outlined"}
        size="small"
        sx={{
          bgcolor: selectionMode ? "#ede9fe" : "#fff",
          borderColor: selectionMode ? "#c4b5fd" : "#d1d5db",
          color: selectionMode ? "#7c3aed" : "black",
          "&:hover": {
            bgcolor: selectionMode ? "#ddd6fe" : "#dcfce7",
            borderColor: selectionMode ? "#a78bfa" : "#d1d5db",
          },
          width: "100%",
        }}
          >
        <Check style={{ width: 16, height: 16, marginRight: 4 }} />
        {selectionMode ? "Quitter la sélection" : "Actions en lot sur les images"}
          </MuiButton>
          <MuiButton
        onClick={saveImagesOrder}
        variant="outlined"
        size="small"
        className={`${orderChanged ? "save-button-highlight" : ""}`}
        disabled={!orderChanged}
        sx={{
          bgcolor: "#fff",
          borderColor: "#d1d5db",
          color: "black",
          "&:hover": {
            bgcolor: "#dcfce7",
            borderColor: "#d1d5db",
          },
          "&:disabled": {
            bgcolor: "#f3f4f6",
            borderColor: "#d1d5db",
            color: "#6b7280",
          },
          width: "100%",
        }}
          >
        <Save style={{ width: 16, height: 16, marginRight: 4 }} />
        Sauvegarder l'ordre
          </MuiButton>
        </Box>
      </Box>
      
      {/* Options de sélection */}
      {selectionMode && (
        <Box
          sx={{
            mb: 6,
            p: 2,
            bgcolor: "#f3e8ff",
            borderRadius: 2,
            border: "1px solid #e9d5ff",
            display: "flex",
            flexDirection: { xs: "column", sm: "column" },
            flexWrap: "wrap",
            gap: 2,
            alignItems: { xs: "stretch", sm: "center" },
          }}
        >
          <Box
            sx={{
              borderRadius: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "column" },
              flexWrap: "wrap",
              gap: 1.5,
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "center",
                flex: 1,
              }}
            >
              {/* Box de sélection des images */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "column" },
                  gap: 1.5,
                  flexWrap: "wrap",
                  alignItems: "stretch",
                }}
              >
              <MuiButton
                onClick={selectAllImages}
                variant="outlined"
                size="small"
                disabled={!editedWedding?.images?.length}
                className="bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                Tout sélectionner
              </MuiButton>
              <MuiButton
                onClick={deselectAllImages}
                variant="outlined"
                size="small"
                disabled={selectedImages.length === 0}
                className="bg-white border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                Tout désélectionner
              </MuiButton>
              </Box>
              {/* Box de masquage des images */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "column" },
                  gap: 1.5,
                  alignItems: "stretch",
                }}
              >
              <MuiButton
                onClick={handleShowSelectedImages}
                variant="outlined"
                size="small"
                disabled={selectedImages.length === 0 || isVisibilityBatchProcessing}
                className="bg-white border-teal-300 text-teal-700 hover:bg-teal-100"
              >
                {isVisibilityBatchProcessing ? (
                  <Box display="flex" alignItems="center">
                    <Loader2 style={{ width: 12, height: 12, marginRight: 4 }} className="animate-spin" /> Traitement...
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center">
                    <Eye style={{ width: 16, height: 16, marginRight: 4 }} /> Afficher
                  </Box>
                )}
              </MuiButton>
              <MuiButton
                onClick={handleHideSelectedImages}
                variant="outlined"
                size="small"
                disabled={selectedImages.length === 0 || isVisibilityBatchProcessing}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {isVisibilityBatchProcessing ? (
                  <Box display="flex" alignItems="center">
                    <Loader2 style={{ width: 12, height: 12, marginRight: 4 }} className="animate-spin" /> Traitement...
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center">
                    <EyeOff style={{ width: 16, height: 16, marginRight: 4 }} /> Masquer
                  </Box>
                )}
              </MuiButton>
              </Box>
              {/* Box de masquage des descriptions */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "column" },
                  gap: 1.5,
                  alignItems: "stretch",
                }}
              >
              <MuiButton
                onClick={handleShowSelectedDescriptions}
                variant="outlined"
                size="small"
                disabled={selectedImages.length === 0 || isDescVisibilityBatchProcessing}
                className="bg-white border-teal-300 text-teal-700 hover:bg-teal-100"
              >
                {isDescVisibilityBatchProcessing ? (
                  <Box display="flex" alignItems="center">
                    <Loader2 style={{ width: 12, height: 12, marginRight: 4 }} className="animate-spin" /> Traitement...
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center">
                    <Eye style={{ width: 16, height: 16, marginRight: 4 }} /> Afficher les descriptions
                  </Box>
                )}
              </MuiButton>
              <MuiButton
                onClick={handleHideSelectedDescriptions}
                variant="outlined"
                size="small"
                disabled={selectedImages.length === 0 || isDescVisibilityBatchProcessing}
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {isDescVisibilityBatchProcessing ? (
                  <Box display="flex" alignItems="center">
                    <Loader2 style={{ width: 12, height: 12, marginRight: 4 }} className="animate-spin" /> Traitement...
                  </Box>
                ) : (
                  <Box display="flex" alignItems="center">
                    <EyeOff style={{ width: 16, height: 16, marginRight: 4 }} /> Masquer les descriptions
                  </Box>
                )}
              </MuiButton>
            </Box>
          <Box ml={{ xs: 0, sm: "auto" }} mt={{ xs: 2, sm: 0 }}>
            <MuiButton
              onClick={handleDeleteSelectedImages}
              variant="outlined"
              size="small"
              color="error"
              disabled={selectedImages.length === 0 || isDeleteBatchProcessing}
            >
              {isDeleteBatchProcessing ? (
          <Box display="flex" alignItems="center">
            <Loader2 style={{ width: 12, height: 12, marginRight: 4 }} className="animate-spin" /> Suppression...
          </Box>
              ) : (
          <Box display="flex" alignItems="center">
            <Trash2 style={{ width: 16, height: 16, marginRight: 4 }} /> Supprimer ({selectedImages.length})
          </Box>
              )}
            </MuiButton>
          </Box>
          </Box>
        </Box>
      </Box>
      )}
      
      {/* Barre de progression pour la suppression */}
      {deleteProgress.processing && (
        <Box mb={6} p={3} bgcolor="#fef2f2" borderRadius={2} border="1px solid #fecaca" sx={{ transition: 'opacity 0.3s' }}>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2.5}>
            <Box display="flex" alignItems="center">
              {deleteProgress.error ? (
                <Box width={20} height={20} mr={1.5} borderRadius="50%" bgcolor="#ef4444" display="flex" alignItems="center" justifyContent="center" color="#fff">!</Box>
              ) : (
                <Loader2 style={{ width: 20, height: 20, marginRight: 8, color: '#dc2626' }} className="animate-spin" />
              )}
              <Typography variant="body2" fontWeight={500} color="#b91c1c">{deleteProgress.status}</Typography>
            </Box>
            <Box width="100%" display="flex" flexDirection="column" gap={1.5}>
              {/* Barre de progression principale */}
              <Box width="100%" height={8} bgcolor="#e5e7eb" borderRadius={4} overflow="hidden">
                <Box height="100%" borderRadius={4} sx={{ transition: 'width 0.3s', width: `${deleteProgress.percent}%`, bgcolor: deleteProgress.error ? '#ef4444' : '#3b82f6' }} />
              </Box>
              {/* Indicateurs d'étapes */}
              <Box display="flex" justifyContent="space-between" width="100%" mt={0.5}>
                {Array.from({ length: Math.min(deleteProgress.total, 10) }).map((_, idx) => {
                  const step = Math.ceil((idx + 1) * (deleteProgress.total / 10));
                  const isCompleted = deleteProgress.current >= step;
                  const isCurrent = deleteProgress.current < step && deleteProgress.current >= (step - Math.ceil(deleteProgress.total / 10));
                  return (
                    <Box
                      key={idx}
                      width={16}
                      height={16}
                      borderRadius="50%"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize={12}
                      bgcolor={isCompleted ? '#22c55e' : isCurrent ? '#3b82f6' : '#e5e7eb'}
                      color={isCompleted || isCurrent ? '#fff' : '#000'}
                    >
                      {isCompleted && (
                        <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Formulaire d'ajout d'images */}
      {showAddImage && (
        <Box p={3} border="1px solid #bfdbfe" bgcolor="#eff6ff" borderRadius={2} mb={6}>
          <Box 
          sx={{ display: "flex",
           alignItems: "center", 
           justifyContent: "flex-end",
           width: "100%",
           }}>
            <IconButton color="error" size="large" 
              onClick={() => setShowAddImage(false)} sx={{ color: 'error' }}>
              <X style={{ width: 24, height: 24 }} />
            </IconButton>
          </Box>
          <Box width="100%" mt={2}>
            <ToggleButtonGroup
              value={uploadType}
              exclusive
              onChange={(_, newType) => newType && setUploadType(newType)}
              size="small"
              sx={{ width: '100%' }}
            >
              <ToggleButton value="url" sx={{ flex: 1, fontSize: '0.85rem', py: 0.5 }}>
                <Link style={{ width: 16, height: 16, marginRight: 4 }} />
                Lien web
              </ToggleButton>
              <ToggleButton value="regularFile" sx={{ flex: 1, fontSize: '0.85rem', py: 0.5 }}>
                <Upload style={{ width: 16, height: 16, marginRight: 4 }} />
                Upload de fichier
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {uploadType === 'url' && (
            <Box display="flex" gap={1.5} mt={2}>
              <Input
                type="text"
                placeholder="Entrez l'URL de l'image"
                value={newImageUrl}
                onChange={handleUrlChange}
                className={`flex-1 ${isValidUrl ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}`}
              />
              <MuiButton
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!isValidUrl}
                variant='outlined'
                size="small"
                onClick={() => handleAddImageByUrl('link')}
              >
                <Plus style={{ width: 16, height: 16, marginRight: 4 }} />
                Ajouter
              </MuiButton>
            </Box>
          )}
          {uploadType === 'regularFile' && (
            <FileUploader
              selectedWedding={selectedWedding}
              uploadType={uploadType}
              onUploadComplete={handleUploadComplete}
            />
          )}
        </Box>
      )}
      
      {/* Galerie d'images */}
      <Box mt={6}>
        <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" width="100%">
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
              <Box display="grid" gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }} gap={2} width="100%" maxWidth={900}>
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
              </Box>
            </SortableContext>
            {/* Drag overlay for better visual feedback */}
            <DragOverlay dropAnimation={dropAnimationConfig}>
              {activeId ? (
                <Box
                  sx={{
                  minWidth: 180,
                  maxWidth: 220,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 3,
                  py: 1,
                  border: "2px solid #3b82f6",
                  boxShadow: 3,
                  bgcolor: "#fff",
                  opacity: 0.9,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                  }}
                >
                  <Image
                  src={sortedImages.find(img => img.fileUrl === activeId)?.fileUrl || '/placeholder.jpg'}
                  style={{
                    width: 128,
                    height: 128,
                    objectFit: 'cover',
                    borderRadius: 16,
                    margin: '0 auto'
                  }}
                  width={128}
                  height={128}
                  alt="Dragging image"
                  priority={false}
                  quality={25}
                  />
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>
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