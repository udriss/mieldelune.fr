'use client';

import { useState, useRef, useCallback } from 'react';
import { Box, Button, Typography, LinearProgress, Alert } from '@mui/material';
import { Upload, X, CheckCircle, AlertCircle, FileImage, FileVideo } from 'lucide-react';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';

interface CustomFileUploaderProps {
  onUploadComplete: (url: string) => void;
  acceptedTypes?: string;
  maxSize?: number; // en MB
  uploadType: 'image' | 'video';
}

export function CustomFileUploader({ 
  onUploadComplete, 
  acceptedTypes = "image/*,video/*",
  maxSize = 10,
  uploadType
}: CustomFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validation de la taille
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier est trop volumineux. Taille maximale : ${maxSize} MB`;
    }

    // Validation du type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (uploadType === 'image' && !isImage) {
      return 'Seuls les fichiers image sont acceptés';
    }
    
    if (uploadType === 'video' && !isVideo) {
      return 'Seuls les fichiers vidéo sont acceptés';
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.upload.onloadstart = () => {
        setUploadProgress(0);
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            setUploadProgress(100); // S'assurer que la barre atteint 100%
            setSuccess(true);
            onUploadComplete(response.url);
            toast.success('Fichier uploadé avec succès');
            
            // Réinitialiser après un délai pour voir le succès
            setTimeout(() => {
              resetUploader();
            }, 1500);
          } else {
            setError(response.error || 'Erreur lors de l\'upload');
            setIsUploading(false);
          }
        } else {
          setError('Erreur lors de l\'upload');
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setError('Erreur réseau lors de l\'upload');
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.onabort = () => {
        setError('Upload annulé');
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.open('POST', '/api/custom-pages-upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setError('Erreur lors de l\'upload du fichier');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    uploadFile(file);
  }, [uploadType, maxSize]);

  const resetUploader = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptedTypes = () => {
    if (uploadType === 'image') return 'image/*';
    if (uploadType === 'video') return 'video/*';
    return acceptedTypes;
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedTypes()}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      {!isUploading && !success && (
        <Box
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${isDragOver ? '#3b82f6' : '#ccc'}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDragOver ? '#f0f9ff' : 'transparent',
            '&:hover': {
              borderColor: '#3b82f6',
              backgroundColor: '#f8fafc'
            }
          }}
        >
          {uploadType === 'image' ? (
            <FileImage size={48} color={isDragOver ? '#3b82f6' : '#9ca3af'} style={{ marginBottom: 16 }} />
          ) : (
            <FileVideo size={48} color={isDragOver ? '#3b82f6' : '#9ca3af'} style={{ marginBottom: 16 }} />
          )}
          
          <Typography variant="h6" color={isDragOver ? '#3b82f6' : 'textSecondary'} gutterBottom>
            {isDragOver ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez pour sélectionner'}
          </Typography>
          
          <Typography variant="body2" color="textSecondary">
            {uploadType === 'image' ? 'Images' : 'Vidéos'} • 
            Taille max : {maxSize} Mo
          </Typography>
          
          {uploadType === 'image' && (
            <Typography variant="caption" color="textSecondary" display="block" mt={1}>
              Formats supportés: JPG, PNG, WEBP, GIF
            </Typography>
          )}
          
          {uploadType === 'video' && (
            <Typography variant="caption" color="textSecondary" display="block" mt={1}>
              Formats supportés: MP4, WEBM, AVI, MOV
            </Typography>
          )}
        </Box>
      )}
      
      {isUploading && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Upload en cours ...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ 
              mb: 2,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#3b82f6'
              }
            }}
          />
          <Typography variant="caption" color="textSecondary">
            {Math.round(uploadProgress)}%
          </Typography>
        </Box>
      )}
      
      {success && (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
          <Typography variant="h6" color="success.main" gutterBottom>
            Fichier uploadé avec succès
          </Typography>
          <Button
            variant="outlined"
            onClick={resetUploader}
            startIcon={<X />}
            size="small"
          >
            Uploader un autre fichier
          </Button>
        </Box>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={resetUploader}
            >
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}
