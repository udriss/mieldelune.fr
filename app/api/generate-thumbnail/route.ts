import { NextResponse } from 'next/server';
import { access, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

interface ThumbnailGenerationParams {
  baseDir: string;
  imageUrl: string;
  targetSizeKB: number;
  isCover: boolean;
}

interface ThumbnailGenerationResult {
  success: boolean;
  error?: string;
  thumbUrlPath?: string;
  finalSizeKB?: number;
}

// Fonction pour calculer la taille cible adaptive
async function calculateTargetSize(baseDir: string, images: string[], targetPercentage: number, strategy: 'best' | 'worst' = 'worst'): Promise<{ [imageUrl: string]: number }> {
  const imageSizes: { [imageUrl: string]: number } = {};
  
  // Collecter les tailles de toutes les images
  for (const imageUrl of images) {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) continue;
      
      const imagePath = path.join(baseDir, fileName);
      const stats = await stat(imagePath);
      imageSizes[imageUrl] = stats.size;
    } catch (error) {
      console.warn(`Unable to get size for ${imageUrl}:`, error);
    }
  }
  
  if (Object.keys(imageSizes).length === 0) {
    return Object.fromEntries(images.map(url => [url, 50 * 1024])); // Fallback: 50KB par défaut
  }
  
  const sizes = Object.values(imageSizes);
  const targetSizes: { [imageUrl: string]: number } = {};
  
  if (strategy === 'worst') {
    // Stratégie "Moins bonne qualité" : se baser sur l'image la plus petite
    const minSize = Math.min(...sizes);
    const targetSizeBytes = minSize * (targetPercentage / 100);
    
    for (const imageUrl of images) {
      targetSizes[imageUrl] = Math.max(10 * 1024, targetSizeBytes);
    }
    
    console.log(`🎯 Stratégie: ${strategy}, Taille de référence: ${(minSize / 1024).toFixed(1)}KB`);
  } else {
    // Stratégie "Meilleure qualité" : algorithme intelligent
    const maxSize = Math.max(...sizes);
    const baseTargetSizeBytes = maxSize * (targetPercentage / 100);
    
    console.log(`🎯 Stratégie: ${strategy}, Taille de référence maximale: ${(maxSize / 1024).toFixed(1)}KB`);
    console.log(`🎯 Taille cible de base: ${(baseTargetSizeBytes / 1024).toFixed(1)}KB`);
    
    for (const imageUrl of images) {
      const originalSize = imageSizes[imageUrl];
      if (!originalSize) continue;
      
      // Si l'image brute est plus petite que la taille cible calculée,
      // utiliser la taille brute comme limite
      if (originalSize < baseTargetSizeBytes) {
        targetSizes[imageUrl] = originalSize * 0.9; // Garder 90% de la taille originale
        console.log(`📏 ${imageUrl}: taille brute (${(originalSize / 1024).toFixed(1)}KB) < cible, utilisation de ${(targetSizes[imageUrl] / 1024).toFixed(1)}KB`);
      } else {
        targetSizes[imageUrl] = baseTargetSizeBytes;
        console.log(`📏 ${imageUrl}: utilisation de la taille cible standard ${(baseTargetSizeBytes / 1024).toFixed(1)}KB`);
      }
      
      // S'assurer d'un minimum raisonnable
      targetSizes[imageUrl] = Math.max(10 * 1024, targetSizes[imageUrl]);
    }
  }
  
  return targetSizes;
}

async function handleThumbnailGeneration({
  baseDir,
  imageUrl,
  targetSizeKB,
  isCover
}: ThumbnailGenerationParams): Promise<ThumbnailGenerationResult & { dimensions?: { width: number; height: number } }> {
  try {
    const thumbDir = path.join(baseDir, 'thumbnails');

    // Ensure directories exist
    try {
      await access(thumbDir);
    } catch {
      await mkdir(thumbDir, { recursive: true });
    }

    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      console.error('❌ Invalid filename from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }

    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    
    // Pour les images de couverture, ajouter un timestamp pour éviter les conflits
    const timestamp = isCover ? `_${Date.now()}` : '';
    const thumbFileName = `${fileNameWithoutExt}_THUMBEL${timestamp}${fileExtension}`;
    
    const originalPath = path.join(baseDir, fileName);
    const thumbPath = path.join(thumbDir, thumbFileName);

    // Supprimer les anciennes miniatures si c'est une image de couverture
    if (isCover) {
      try {
        const files = await require('fs/promises').readdir(thumbDir);
        const oldThumbnails = files.filter((file: string) => 
          file.startsWith(`${fileNameWithoutExt}_THUMBEL`) && file.endsWith(fileExtension)
        );
        
        for (const oldThumb of oldThumbnails) {
          try {
            await unlink(path.join(thumbDir, oldThumb));
            console.log(`🗑️ Ancienne miniature supprimée: ${oldThumb}`);
          } catch (error) {
            console.warn(`⚠️ Impossible de supprimer l'ancienne miniature: ${oldThumb}`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Erreur lors de la recherche d\'anciennes miniatures:', error);
      }
    }

    // Get original image metadata
    const metadata = await sharp(originalPath).metadata();
    if (!metadata.width || !metadata.height) {
      console.error('❌ Invalid image metadata');
      return { success: false, error: 'Invalid image metadata' };
    }

    // Algorithme adaptatif pour atteindre la taille cible
    let quality = 80;
    let width = metadata.width;
    let height = metadata.height;
    const targetSizeBytes = targetSizeKB * 1024;
    
    // Première estimation : réduire les dimensions si nécessaire
    const originalStats = await stat(originalPath);
    const compressionRatio = targetSizeBytes / originalStats.size;
    
    if (compressionRatio < 0.5) {
      // Si la compression est très forte, réduire aussi les dimensions
      const scaleFactor = Math.sqrt(compressionRatio * 2);
      width = Math.round(metadata.width * scaleFactor);
      height = Math.round(metadata.height * scaleFactor);
    }

    // Ajustement itératif de la qualité
    let attempt = 0;
    const maxAttempts = 5;
    
    while (attempt < maxAttempts) {
      try {
        await sharp(originalPath)
          .resize(width, height, {
            fit: 'contain',
            withoutEnlargement: true
          })
          .jpeg({
            quality: Math.round(quality),
            chromaSubsampling: '4:2:0',
            mozjpeg: true,
            force: true
          })
          .toFile(thumbPath);

        // Vérifier la taille du fichier généré
        const thumbStats = await stat(thumbPath);
        const actualSizeKB = thumbStats.size / 1024;
        
        console.log(`📊 Tentative ${attempt + 1}: ${actualSizeKB.toFixed(1)}KB (cible: ${targetSizeKB}KB, qualité: ${quality})`);
        
        // Si la taille est dans la plage acceptable (±20%), on accepte
        if (actualSizeKB <= targetSizeKB * 1.2 && actualSizeKB >= targetSizeKB * 0.8) {
          const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
          return { 
            success: true, 
            thumbUrlPath,
            finalSizeKB: actualSizeKB,
            dimensions: {
              width: metadata.width,
              height: metadata.height
            }
          };
        }
        
        // Ajuster la qualité pour la prochaine tentative
        if (actualSizeKB > targetSizeKB * 1.2) {
          quality = Math.max(10, quality - 15);
        } else {
          quality = Math.min(95, quality + 10);
        }
        
        attempt++;
        
        // Supprimer le fichier temporaire si ce n'est pas la dernière tentative
        if (attempt < maxAttempts) {
          try {
            await unlink(thumbPath);
          } catch (e) {
            // Ignorer les erreurs de suppression
          }
        }
        
      } catch (error) {
        console.error(`❌ Erreur lors de la tentative ${attempt + 1}:`, error);
        break;
      }
    }

    // Si on arrive ici, utiliser le dernier résultat même s'il n'est pas parfait
    const thumbStats = await stat(thumbPath);
    const finalSizeKB = thumbStats.size / 1024;
    const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
    
    console.log(`⚠️ Résultat final après ${attempt} tentatives: ${finalSizeKB.toFixed(1)}KB`);
    
    return { 
      success: true, 
      thumbUrlPath,
      finalSizeKB,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      }
    };

  } catch (error) {
    console.error('❌ Thumbnail generation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Thumbnail generation failed' 
    };
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  try {
    const { folderId, imageUrl, resizePercentage = 20, isCover = false, compressionStrategy = 'worst' } = await request.json();
    
    // Validation
    if (!folderId || !imageUrl) {
      console.error('❌ Missing parameters:', { folderId, imageUrl });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Get wedding data
    const weddings = await parseWeddingsData();
    const wedding = weddings.find(w => w.folderId === folderId);

    if (!wedding) {
      console.error('❌ Wedding not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Wedding not found' 
      }, { status: 404 });
    }

    // Handle paths
    const baseDir = path.join(process.cwd(), 'public', folderId);

    try {
      await access(baseDir);
    } catch (err) {
      console.error('❌ Base directory access error:', err);
      return NextResponse.json({ 
        success: false, 
        error: 'Base directory not accessible' 
      }, { status: 500 });
    }

    // Calculer les tailles cibles adaptatives avec la stratégie
    const allImageUrls = wedding.images.map(img => img.fileUrl);
    
    // Pour les images de couverture, s'assurer qu'elle est incluse dans le calcul
    if (isCover && wedding.coverImage && !allImageUrls.includes(imageUrl)) {
      allImageUrls.push(imageUrl);
    }
    
    const targetSizes = await calculateTargetSize(baseDir, allImageUrls, resizePercentage, compressionStrategy);
    
    // Obtenir la taille cible spécifique pour cette image
    const targetSizeBytes = targetSizes[imageUrl];
    const targetSizeKB = Math.round(targetSizeBytes / 1024);
    
    console.log(`🎯 Taille cible pour ${imageUrl}: ${targetSizeKB}KB (${compressionStrategy})`);

    // Generate thumbnail with adaptive sizing
    const result = await handleThumbnailGeneration({
      baseDir,
      imageUrl,
      targetSizeKB,
      isCover
    });

    if (!result.success) {
      console.error('❌ Thumbnail generation failed:', result.error);
      return NextResponse.json(result, { status: 500 });
    }

    // Update data with dimensions
    if (isCover) {
      if (!wedding.coverImage) {
        throw new Error('Cover image not found during update');
      }
      wedding.coverImage.fileUrlThumbnail = result.thumbUrlPath;
      if (result.dimensions) {
        wedding.coverImage.width = result.dimensions.width;
        wedding.coverImage.height = result.dimensions.height;
      }
    } else {
      const image = wedding.images.find(img => img.fileUrl === imageUrl);
      if (image) {
        image.fileUrlThumbnail = result.thumbUrlPath;
        if (result.dimensions) {
          image.width = result.dimensions.width;
          image.height = result.dimensions.height;
        }
      }
    }

    await updateWeddingsData(weddings);
    
    const duration = Date.now() - startTime;

    // Calculer les statistiques pour la réponse
    let originalSizeKB = 0;
    if (result.finalSizeKB) {
      try {
        const originalPath = path.join(baseDir, imageUrl.split('/').pop() || '');
        const originalStats = await stat(originalPath);
        originalSizeKB = Math.round(originalStats.size / 1024);
      } catch (error) {
        console.warn('⚠️ Impossible de calculer la taille originale:', error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      thumbnailPath: result.thumbUrlPath,
      finalSizeKB: result.finalSizeKB,
      originalSizeKB,
      targetSizeKB,
      compressionStrategy,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Fatal error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      duration
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 });
  }
}