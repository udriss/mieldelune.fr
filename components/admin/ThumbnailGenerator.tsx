import { useState, useEffect } from 'react';
import { Wedding, Image } from '@/lib/dataTemplate';
import { Loader2 } from 'lucide-react';
import path from 'path';
import sharp from 'sharp';

interface Props {
  wedding: Wedding;
  onComplete: () => void;
}

export function ThumbnailGenerator({ wedding, onComplete }: Props) {
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isCompleted) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const generateThumbnail = async (image: Image) => {
    try {
      const response = await fetch(`/api/generate-thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: wedding.folderId,
          imageUrl: image.fileUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnail');
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  };

  const processThumbnails = async () => {
    setProcessing(true);
    let completed = 0;

    for (const image of wedding.images) {
      await generateThumbnail(image);
      completed++;
      setProgress((completed / wedding.images.length) * 100);
    }

    setProcessing(false);
    setIsCompleted(true); // Trigger completion via useEffect
  };

  useEffect(() => {
    processThumbnails();
  }, [wedding]);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {processing && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-sm text-gray-600">
            Production de vignettes : {Math.round(progress)}%
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}