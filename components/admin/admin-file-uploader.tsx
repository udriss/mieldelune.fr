import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Image } from '@/lib/dataTemplate';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from '@nextui-org/react';
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
  const fileItemsRef = useRef<(HTMLDivElement | null)[]>([]);

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
  const setFileItemRef = (el: HTMLDivElement | null, index: number) => {
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
    <div className="space-y-4">
      {h3Title &&
      <h3 className="text-sm text-gray-500">
        Sélectionnez un ou plusieurs fichiers image</h3>
      }
      
      {/* Zone de glisser-déposer */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">
            Glissez-déposez vos images ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-gray-400">
            Formats acceptés: JPG, PNG, GIF, WEBP
          </p>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          disabled={isUploading}
          onChange={handleFileSelect}
          className="hidden"
          {...(h3Title ? { multiple: true } : {})}
        />
      </div>

      <div className="text-sm text-gray-500 h-[70px] max-h-[70px] overflow-hidden">
      {uploadQueue.length > 0 && !isUploading && (
        <div className={`flex gap-2 justify-around ${h3Title ? 'flex-row' : 'flex-row'}`}>
          <Button 
            className='font-semibold bg-white text-black border-gray-300 hover:bg-green-100 hover:text-green-500'
            onClick={startUpload}
            variant={'outline'}>
            Charger
          </Button>
          <Button 
            className='font-semibold bg-white text-black border-gray-300 hover:bg-orange-100 hover:text-orange-500'
            onClick={clearQueue}
            variant={'outline'}>
            Effacer la liste
          </Button>
        </div>
      )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
            <Button
            variant="outline"
            size="sm"
            onClick={handleCancelUpload}
            className='font-semibold bg-white text-black border-gray-300 hover:bg-red-100 hover:text-red-500'>
                Annuler
              </Button>
              <span>Chargement en cours ({currentUploadIndex + 1}/{uploadQueue.length}) ... {Math.round(uploadProgress)}%</span>
            </div>
            <Progress 
                value={uploadProgress} 
                className="w-full h-2 bg-gray-200 rounded-full"
                aria-label="Upload progress"
              >
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full" 
                  style={{ width: `${uploadProgress}%` }} 
                />
              </Progress>
          </div>
        )}
      </div>
      
      {/* Liste des fichiers */}
      <div className="max-h-[150px] overflow-auto">
        {uploadQueue.map((item, idx) => (
          <div 
            key={`${item.file.name}-${idx}`} 
            className={`text-sm flex flex-row items-center mb-1 py-1 px-2 rounded transition-colors duration-300 ${
              idx === currentUploadIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}
            ref={(el) => setFileItemRef(el, idx)}
          >
            {item.status === 'annulé' || item.status === 'error' ? (
              <span className="text-red-500 mr-2 max-w-6 max-w-h-6 w-6 h-6"><FaXmark className='w-6 h-6' /></span>
            ) : item.status === 'terminé' ? (
              <span className="text-green-400 mr-2 max-w-6 max-w-h-6 w-6 h-6"><IoCheckmarkDone className='w-6 h-6' /></span> 
            ) : item.status === 'chargement' ? (
              <span className="text-orange-300 mr-2 max-w-6 max-w-h-6 w-6 h-6"><FaUpload className='w-5 h-5' /></span>
            )  : null}
            <div className="flex-1 flex items-center">
              <span className="mr-2">{truncateFileName(item.file.name, 25)}</span>
              <span className="text-xs text-gray-500">{Math.round(item.progress)}% - {item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};