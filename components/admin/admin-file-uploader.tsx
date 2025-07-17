import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Image } from '@/lib/dataTemplate';
import { 
  Button, 
  TextField, 
  LinearProgress, 
  Box, 
  Typography, 
  Paper, 
  IconButton,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { IoCheckmarkDone, IoClose } from "react-icons/io5";
import { FaUpload, FaXmark } from "react-icons/fa6";
import { Upload } from "lucide-react";

interface QueueItem {
  file: File;
  progress: number;
  status: 'attente' | 'chargement' | 'terminé' | 'error' | 'annulé';
}

interface FileUploaderProps {
  selectedWedding: string;
  uploadType: 'coverFile' | 'regularFile';
  onUploadComplete: (image: Image) => void;
  h3Title?: boolean
}

export const FileUploader = ({ 
  selectedWedding, 
  uploadType, 
  onUploadComplete,
  h3Title = true
}: FileUploaderProps) => {
  const [uploadQueue, setUploadQueue] = useState<QueueItem[]>([]);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileItemsRef = useRef<(HTMLElement | null)[]>([]);

  // Effect to handle scrolling to the currently uploading file
  useEffect(() => {
    if (currentUploadIndex >= 0 && fileItemsRef.current[currentUploadIndex]) {
      // Scroll to the current element with smooth behavior
      fileItemsRef.current[currentUploadIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [currentUploadIndex]);

  // Reset file refs when the queue changes
  useEffect(() => {
    // Reset the refs array to match the new queue size
    fileItemsRef.current = uploadQueue.map(() => null);
  }, [uploadQueue.length]);

  // Fonction pour assigner la référence à l'élément DOM de manière correcte
  const setFileItemRef = (el: HTMLElement | null, index: number) => {
    fileItemsRef.current[index] = el;
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    if (!selectedWedding) {
      toast.error("Sélectionnez un mariage d'abord !");
      return;
    }

    // Reset all states
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadIndex(-1);
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }

    // Convert FileList to array and create new queue
    const files = Array.from(event.target.files);
    addFilesToQueue(files);
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: QueueItem[] = files.map((file) => ({
      file,
      progress: 0,
      status: 'attente'
    }));

    // Add to existing queue or replace based on context
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!selectedWedding) {
      toast.error("Sélectionnez un mariage d'abord !");
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter only image files
      const imageFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      
      if (imageFiles.length === 0) {
        toast.error("Seuls les fichiers image sont acceptés");
        return;
      }

      if (imageFiles.length !== e.dataTransfer.files.length) {
        toast.warning(`${e.dataTransfer.files.length - imageFiles.length} fichier(s) non-image(s) ignoré(s)`);
      }

      addFilesToQueue(imageFiles);
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadQueue((prev) => 
      prev.map((item, idx) => 
        idx === currentUploadIndex ? { ...item, status: 'annulé' } : item
      )
    );
    setCurrentUploadIndex(-1);
  };

  const processUploadQueue = async (queue: QueueItem[], index: number) => {
    if (index >= queue.length) {
      // All done
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(-1);
      xhrRef.current = null;
      return;
    }
    setIsUploading(true);

    setCurrentUploadIndex(index);
    const currentItem = queue[index];

    // Update status to 'chargement'
    setUploadQueue(prev =>
      prev.map((item, idx) =>
        idx === index ? { ...item, status: 'chargement' } : item
      )
    );

    // Prepare form data
    const formData = new FormData();
    formData.append('file', currentItem.file);
    formData.append('weddingId', selectedWedding);
    formData.append('isCover', uploadType === 'coverFile' ? 'true' : 'false');

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('POST', '/api/upload', true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percentComplete = (evt.loaded / evt.total) * 100;
            setUploadProgress(percentComplete);
            setUploadQueue(prev =>
              prev.map((item, idx) =>
                idx === index ? { ...item, progress: percentComplete } : item
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              // Mark success
              setUploadQueue(prev =>
                prev.map((item, idx) =>
                  idx === index ? { ...item, status: 'terminé', progress: 100 } : item
                )
              );
              onUploadComplete(response.image);
              resolve();
            } catch {
              reject(new Error('Invalid server response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Erreur réseau'));
        };

        xhr.onabort = () => {
          //reject(new Error('Upload cancelled'));
        };

        xhr.send(formData);
      });

      // Success for this item, move to next
      await processUploadQueue(queue, index + 1);

    } catch (error) {
      // Mark error
      setUploadQueue(prev =>
        prev.map((item, idx) =>
          idx === index ? { ...item, status: 'error', progress: 0 } : item
        )
      );
      toast.error((error as Error).message);
      // Continue with next file even if current fails
      await processUploadQueue(queue, index + 1);
    }
  };

  const clearQueue = () => {
    setUploadQueue([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const truncateFileName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + '...';
  };
  
  const startUpload = () => {
    if (uploadQueue.length === 0) {
      toast.error('Aucun fichier à charger');
      return;
    }
    processUploadQueue(uploadQueue, 0);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Stack spacing={2}>
      {h3Title && (
        <Typography variant="body2" color="text.secondary">
          Sélectionnez un ou plusieurs fichiers image
        </Typography>
      )}
      
      {/* Zone de glisser-déposer */}
      <Paper
        variant="outlined"
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          backgroundColor: isDragging ? 'primary.light' : 'background.paper',
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
        borderColor: 'primary.main',
        backgroundColor: 'grey.50'
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <Stack spacing={1} alignItems="center">
          <Upload style={{ width: 40, height: 40, color: '#9CA3AF' }} />
          <Typography variant="body2" fontWeight="medium" color="text.primary">
        Glissez-déposez vos images ici ou cliquez pour parcourir
          </Typography>
          <Typography variant="caption" color="text.secondary">
        Formats acceptés: JPG, PNG, GIF, WEBP
          </Typography>
        </Stack>
        <TextField
          inputRef={fileInputRef}
          type="file"
          slotProps={{ 
        htmlInput: {
          accept: "image/*",
          multiple: h3Title
        }
          }}
          disabled={isUploading}
          onChange={handleFileSelect}
          sx={{ display: 'none' }}
        />
      </Paper>

      {uploadQueue.length > 0 && (
        <>
          <Box sx={{ maxHeight: '70px', overflow: 'hidden' }}>
            {!isUploading && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="outlined" 
                  color="success" 
                  onClick={startUpload}
                >
                  Charger
                </Button>
                <Button 
                  variant="outlined" 
                  color="warning" 
                  onClick={clearQueue}
                >
                  Effacer la liste
                </Button>
              </Stack>
            )}

            {isUploading && (
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleCancelUpload}
                  >
                    Annuler
                  </Button>
                  <Typography variant="body2">
                    Chargement en cours ({currentUploadIndex + 1}/{uploadQueue.length}) ... {Math.round(uploadProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress}
                  sx={{ width: '100%' }}
                />
              </Stack>
            )}
          </Box>
          
          {/* Liste des fichiers */}
          <Box sx={{ maxHeight: '150px', overflowY: 'auto' }}>
            <List dense>
              {uploadQueue.map((item, idx) => (
                <ListItem 
                  key={`${item.file.name}-${idx}`}
                  ref={(el) => setFileItemRef(el, idx)}
                  sx={{
                    backgroundColor: idx === currentUploadIndex ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'grey.50'
                    },
                    transition: 'background-color 0.3s ease',
                    borderRadius: 1,
                    mb: 0.5
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.status === 'annulé' || item.status === 'error' ? (
                      <IconButton color="error" size="small">
                        <FaXmark />
                      </IconButton>
                    ) : item.status === 'terminé' ? (
                      <IconButton color="success" size="small">
                        <IoCheckmarkDone />
                      </IconButton>
                    ) : item.status === 'chargement' ? (
                      <CircularProgress size={20} color="primary" />
                    ) : null}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">
                          {truncateFileName(item.file.name, 25)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(item.progress)}% - {item.status}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </>
      )}
    </Stack>
  );
};