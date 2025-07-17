import { NextResponse } from 'next/server';
import { access, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { Wedding, Image } from '@/lib/dataTemplate';
import { updateProgress, initProgress, clearProgress } from '@/lib/progress-manager';

// Stockage des processus en cours avec leurs AbortController
const activeProcesses = new Map<string, AbortController>();

interface BatchThumbnailRequest {
  folderId: string;
  resizePercentage: number;
  compressionStrategy: 'best' | 'worst';
  processId: string;
}

interface ThumbnailBatchResult {
  success: boolean;
  processId: string;
  totalImages?: number;
  processedImages?: number;
  failedImages?: string[];
  compressionStats?: {
    [imageUrl: string]: {
      imageName: string;
      originalSize: number;
      finalSize: number;
      compressionRate: number;
      targetSize: number;
    }
  };
  error?: string;
}

// Fonction pour calculer toutes les tailles cibles en une fois
async function calculateAllTargetSizes(
  baseDir: string, 
  images: string[], 
  targetPercentage: number, 
  strategy: 'best' | 'worst'
): Promise<{ [imageUrl: string]: { target: number; original: number } }> {
  const imageData: { [imageUrl: string]: { target: number; original: number } } = {};
  
  // Collecter les tailles de toutes les images en une seule passe
  for (const imageUrl of images) {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) continue;
      
      const imagePath = path.join(baseDir, fileName);
      const stats = await stat(imagePath);
      imageData[imageUrl] = { target: 0, original: stats.size };
    } catch (error) {
      console.warn(`Unable to get size for ${imageUrl}:`, error);
      imageData[imageUrl] = { target: 50 * 1024, original: 50 * 1024 }; // Fallback
    }
  }
  
  const originalSizes = Object.values(imageData).map(data => data.original);
  
  if (originalSizes.length === 0) {
    return imageData;
  }
  
  if (strategy === 'worst') {
    // Stratégie "Moins bonne qualité" : se baser sur l'image la plus petite
    const minSize = Math.min(...originalSizes);
    const targetSizeBytes = Math.max(10 * 1024, minSize * (targetPercentage / 100));
    
    // Appliquer la même taille cible à toutes les images
    for (const imageUrl in imageData) {
      imageData[imageUrl].target = targetSizeBytes;
    }
    
    console.log(`🎯 Stratégie: ${strategy}, Taille cible uniforme: ${(targetSizeBytes / 1024).toFixed(1)}KB`);
  } else {
    // Stratégie "Meilleure qualité" : algorithme intelligent
    const maxSize = Math.max(...originalSizes);
    const baseTargetSizeBytes = maxSize * (targetPercentage / 100);
    
    console.log(`🎯 Stratégie: ${strategy}, Taille de référence maximale: ${(maxSize / 1024).toFixed(1)}KB`);
    
    for (const imageUrl in imageData) {
      const originalSize = imageData[imageUrl].original;
      
      if (originalSize < baseTargetSizeBytes) {
        // Si l'image originale est plus petite que la cible calculée,
        // prendre le minimum entre la taille originale et la cible
        imageData[imageUrl].target = Math.min(originalSize, baseTargetSizeBytes);
      } else {
        // Utiliser la taille cible calculée
        imageData[imageUrl].target = baseTargetSizeBytes;
      }
      
      // S'assurer d'un minimum raisonnable
      imageData[imageUrl].target = Math.max(10 * 1024, imageData[imageUrl].target);
    }
  }
  
  return imageData;
}

async function generateSingleThumbnail(
  baseDir: string,
  imageUrl: string,
  targetSizeKB: number,
  signal: AbortSignal
): Promise<{ success: boolean; finalSize?: number; dimensions?: { width: number; height: number } }> {
  try {
    if (signal.aborted) {
      return { success: false };
    }

    const thumbDir = path.join(baseDir, 'thumbnails');

    // Ensure directories exist
    try {
      await access(thumbDir);
    } catch {
      await mkdir(thumbDir, { recursive: true });
    }

    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      return { success: false };
    }

    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const thumbFileName = `${fileNameWithoutExt}_THUMBEL${fileExtension}`;
    
    const originalPath = path.join(baseDir, fileName);
    const thumbPath = path.join(thumbDir, thumbFileName);

    // Get original image metadata
    const metadata = await sharp(originalPath).metadata();
    if (!metadata.width || !metadata.height) {
      return { success: false };
    }

    if (signal.aborted) {
      return { success: false };
    }

    // Remove existing thumbnail if it exists
    try {
      await unlink(thumbPath);
    } catch {
      // File doesn't exist, continue
    }

    const targetSizeBytes = targetSizeKB * 1024;

    // Start with medium quality and adjust iteratively
    let quality = 75;
    let attempts = 0;
    const maxAttempts = 5;
    let finalBuffer: Buffer | null = null;

    while (attempts < maxAttempts) {
      if (signal.aborted) {
        return { success: false };
      }

      const buffer = await sharp(originalPath)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      const currentSize = buffer.length;
      
      if (currentSize <= targetSizeBytes * 1.1 || attempts === maxAttempts - 1) {
        finalBuffer = buffer;
        break;
      }

      // Adjust quality for next iteration
      const ratio = targetSizeBytes / currentSize;
      quality = Math.max(20, Math.round(quality * Math.sqrt(ratio)));
      attempts++;
    }

    if (!finalBuffer) {
      return { success: false };
    }

    // Write final thumbnail
    await sharp(finalBuffer).toFile(thumbPath);

    return {
      success: true,
      finalSize: finalBuffer.length,
      dimensions: { width: metadata.width, height: metadata.height }
    };

  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return { success: false };
  }
}

export async function POST(request: Request) {
  try {
    const { folderId, resizePercentage, compressionStrategy, processId }: BatchThumbnailRequest = await request.json();

    // Créer un AbortController pour ce processus
    const controller = new AbortController();
    activeProcesses.set(processId, controller);

    // Initialiser le progrès
    initProgress(processId, 0); // Sera mis à jour avec le vrai nombre d'images

    const weddings = await parseWeddingsData();
    const wedding = weddings.find((w: Wedding) => w.folderId === folderId);

    if (!wedding) {
      activeProcesses.delete(processId);
      clearProgress(processId);
      return NextResponse.json({ success: false, error: 'Wedding not found' }, { status: 404 });
    }

    // Mettre à jour le progrès avec le nombre total d'images
    initProgress(processId, wedding.images.length);

    const baseDir = path.join(process.cwd(), 'public', folderId);

    // Calculer toutes les tailles cibles en une seule fois
    const allImageUrls = wedding.images.map((img: Image) => img.fileUrl);
    const targetData = await calculateAllTargetSizes(baseDir, allImageUrls, resizePercentage, compressionStrategy);

    const compressionStats: ThumbnailBatchResult['compressionStats'] = {};
    const failedImages: string[] = [];
    let processedCount = 0;

    // Traiter les images une par une
    for (const image of wedding.images) {
      if (controller.signal.aborted) {
        break;
      }

      const imageData = targetData[image.fileUrl];
      if (!imageData) {
        processedCount++;
        updateProgress(processId, processedCount, wedding.images.length, image.fileUrl);
        continue;
      }

      const targetSizeKB = Math.round(imageData.target / 1024);
      
      // Mettre à jour le progrès avec l'image en cours
      updateProgress(processId, processedCount, wedding.images.length, image.fileUrl);
      
      const result = await generateSingleThumbnail(
        baseDir,
        image.fileUrl,
        targetSizeKB,
        controller.signal
      );

      if (result.success && result.finalSize && result.dimensions) {
        // Mettre à jour les dimensions dans les données du mariage
        const imageIndex = wedding.images.findIndex((img: Image) => img.fileUrl === image.fileUrl);
        if (imageIndex !== -1) {
          wedding.images[imageIndex].width = result.dimensions.width;
          wedding.images[imageIndex].height = result.dimensions.height;
        }

        // Calculer les statistiques de compression
        const fileName = image.fileUrl.split('/').pop() || '';
        const imageName = fileName.replace(/-\d+/, '').replace(/\.\w+$/, ''); // Retirer les chiffres et l'extension

        compressionStats[image.fileUrl] = {
          imageName,
          originalSize: imageData.original,
          finalSize: result.finalSize,
          compressionRate: Math.round((1 - result.finalSize / imageData.original) * 100),
          targetSize: imageData.target
        };

        processedCount++;
      } else {
        failedImages.push(image.fileUrl);
        processedCount++;
      }

      // Mettre à jour le progrès après chaque image
      updateProgress(processId, processedCount, wedding.images.length);
    }

    // Sauvegarder les modifications si le processus n'a pas été annulé
    if (!controller.signal.aborted) {
      await updateWeddingsData(weddings);
    }

    // Nettoyer le processus
    activeProcesses.delete(processId);
    
    // Marquer le progrès comme terminé
    updateProgress(processId, processedCount, wedding.images.length, undefined, 
      controller.signal.aborted ? 'cancelled' : 'completed');

    const response: ThumbnailBatchResult = {
      success: !controller.signal.aborted,
      processId,
      totalImages: wedding.images.length,
      processedImages: processedCount,
      failedImages,
      compressionStats: controller.signal.aborted ? {} : compressionStats
    };

    // Nettoyer le progrès après un délai
    setTimeout(() => {
      clearProgress(processId);
    }, 5000); // Garder le progrès 5 secondes après la fin

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in batch thumbnail generation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API pour arrêter un processus
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const processId = url.searchParams.get('processId');

    if (!processId) {
      return NextResponse.json({ success: false, error: 'Process ID required' }, { status: 400 });
    }

    const controller = activeProcesses.get(processId);
    if (controller) {
      controller.abort();
      activeProcesses.delete(processId);
      return NextResponse.json({ success: true, message: 'Process stopped' });
    }

    return NextResponse.json({ success: false, error: 'Process not found' }, { status: 404 });

  } catch (error) {
    console.error('Error stopping process:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
