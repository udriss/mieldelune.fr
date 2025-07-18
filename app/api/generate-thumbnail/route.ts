import { NextResponse } from 'next/server';
import { access, mkdir, unlink, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

// Vider le cache de 'data-parser' pour s'assurer que les données sont toujours fraîches
if (require.cache[require.resolve('@/lib/utils/data-parser')]) {
  delete require.cache[require.resolve('@/lib/utils/data-parser')];
}

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

// Fonction pour calculer la taille cible adaptative
async function calculateTargetSize(baseDir: string, images: string[], targetPercentage: number, strategy: 'best' | 'worst' = 'worst'): Promise<{ [imageUrl: string]: number }> {
  const imageSizes: { [imageUrl: string]: number } = {};

  // Collecter les tailles des images existantes seulement
  for (const imageUrl of images) {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) continue;
      const imagePath = path.join(baseDir, fileName);
      const stats = await stat(imagePath);
      imageSizes[imageUrl] = stats.size;
    } catch (error) {
      console.warn(`Unable to get size for ${imageUrl}:`, error);
      // Ne pas ajouter l'image si elle n'existe pas
    }
  }

  const existingImages = Object.keys(imageSizes);
  if (existingImages.length === 0) {
    console.warn('⚠️ Aucune image valide trouvée pour le calcul de taille cible');
    return Object.fromEntries(images.map(url => [url, 50 * 1024])); // Fallback: 50KB par défaut
  }

  const sizes = Object.values(imageSizes);
  const targetSizes: { [imageUrl: string]: number } = {};

  console.log(`🎯 Calcul des tailles cibles avec ${targetPercentage}% de compression`);
  console.log(`🎯 Stratégie: ${strategy}`);

  if (strategy === 'worst') {
    // Stratégie "Moins bonne qualité" : uniformiser à la plus petite cible
    const minSize = Math.min(...sizes);
    const targetSizeBytes = Math.round(minSize * (targetPercentage / 100));

    for (const imageUrl of existingImages) {
      targetSizes[imageUrl] = Math.max(10 * 1024, targetSizeBytes);
    }

    console.log(`🎯 Image de référence: ${(minSize / 1024).toFixed(1)}KB`);
    console.log(`🎯 Taille cible uniforme: ${(targetSizeBytes / 1024).toFixed(1)}KB`);
  } else {
    // Stratégie "Meilleure qualité" : chaque image garde son ratio individuel
    for (const imageUrl of existingImages) {
      const originalSize = imageSizes[imageUrl];
      const targetSizeBytes = Math.round(originalSize * (targetPercentage / 100));
      targetSizes[imageUrl] = Math.max(10 * 1024, targetSizeBytes);
      
      console.log(`📏 ${imageUrl.split('/').pop()}: ${(originalSize / 1024).toFixed(1)}KB → ${(targetSizeBytes / 1024).toFixed(1)}KB`);
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
    let quality = 85;
    let width = metadata.width;
    let height = metadata.height;
    const targetSizeBytes = targetSizeKB * 1024;
    
    // Première estimation : réduire les dimensions si la compression est très forte
    const originalStats = await stat(originalPath);
    const compressionRatio = targetSizeBytes / originalStats.size;
    
    console.log(`🔍 Image originale: ${(originalStats.size / 1024).toFixed(1)}KB, Cible: ${targetSizeKB}KB, Ratio: ${compressionRatio.toFixed(2)}`);
    
    // Ajustement initial basé sur le ratio de compression
    if (compressionRatio < 0.2) {
      // Compression très agressive : réduire drastiquement
      const scaleFactor = Math.sqrt(compressionRatio * 2);
      width = Math.max(300, Math.round(metadata.width * scaleFactor));
      height = Math.max(225, Math.round(metadata.height * scaleFactor));
      quality = 50;
    } else if (compressionRatio < 0.4) {
      // Compression forte : réduire modérément
      const scaleFactor = Math.sqrt(compressionRatio * 1.5);
      width = Math.max(400, Math.round(metadata.width * scaleFactor));
      height = Math.max(300, Math.round(metadata.height * scaleFactor));
      quality = 65;
    } else if (compressionRatio < 0.7) {
      // Compression modérée : ajuster principalement la qualité
      quality = 75;
    }

    // Ajustement itératif de la qualité
    let attempt = 0;
    const maxAttempts = 8; // Plus d'attempts pour un meilleur ciblage
    let bestResult = null;
    let bestDifference = Infinity;
    
    while (attempt < maxAttempts) {
      try {
        // Construire le pipeline Sharp
        let pipeline = sharp(originalPath);
        
        // Redimensionner seulement si nécessaire
        if (width < metadata.width || height < metadata.height) {
          pipeline = pipeline.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        
        // Compression JPEG optimisée
        pipeline = pipeline.jpeg({
          quality: Math.max(5, Math.min(95, Math.round(quality))),
          progressive: true,
          mozjpeg: true
        });
        
        await pipeline.toFile(thumbPath);

        // Vérifier la taille du fichier généré
        const thumbStats = await stat(thumbPath);
        const actualSizeKB = thumbStats.size / 1024;
        const difference = Math.abs(actualSizeKB - targetSizeKB);
        const percentageDifference = (difference / targetSizeKB) * 100;
        
        console.log(`📊 Tentative ${attempt + 1}: ${actualSizeKB.toFixed(1)}KB (cible: ${targetSizeKB}KB, diff: ${percentageDifference.toFixed(1)}%, qualité: ${quality}, dims: ${width}x${height})`);
        
        // Garder le meilleur résultat
        if (difference < bestDifference) {
          bestDifference = difference;
          bestResult = { actualSizeKB, thumbPath };
        }
        
        // Succès si on est dans la tolérance de 10% ou moins
        if (percentageDifference <= 10) {
          const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
          console.log(`✅ Objectif atteint en ${attempt + 1} tentatives: ${actualSizeKB.toFixed(1)}KB (${percentageDifference.toFixed(1)}% de différence)`);
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
        
        // Ajuster les paramètres pour la prochaine tentative
        const ratio = targetSizeKB / actualSizeKB;
        
        if (actualSizeKB > targetSizeKB) {
          // Fichier trop gros
          if (ratio < 0.7) {
            // Très loin : réduire dimensions ET qualité
            const scale = Math.sqrt(ratio * 0.9);
            width = Math.max(200, Math.round(width * scale));
            height = Math.max(150, Math.round(height * scale));
            quality = Math.max(5, quality - 20);
          } else {
            // Proche : ajuster seulement la qualité
            quality = Math.max(5, quality - 10);
          }
        } else {
          // Fichier trop petit (rare)
          if (quality < 90) {
            quality = Math.min(95, quality + 5);
          }
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
        attempt++;
        
        // Si erreur, essayer avec des paramètres plus conservateurs
        quality = Math.max(5, quality - 15);
        width = Math.max(200, width - 50);
        height = Math.max(150, height - 40);
      }
    }

    // Si on arrive ici, utiliser le meilleur résultat obtenu
    if (bestResult) {
      const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
      const percentageDifference = (bestDifference / targetSizeKB) * 100;
      
      console.log(`⚠️ Meilleur résultat après ${attempt} tentatives: ${bestResult.actualSizeKB.toFixed(1)}KB (${percentageDifference.toFixed(1)}% de différence)`);
      
      return { 
        success: true, 
        thumbUrlPath,
        finalSizeKB: bestResult.actualSizeKB,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      };
    }

    // Cas d'échec complet (très rare)
    throw new Error('Impossible de générer une miniature avec la taille cible');

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
    const { 
      folderId, 
      imageUrl, 
      resizePercentage = 20, 
      isCover = false, 
      compressionStrategy = 'worst',
      targetSizeKB = null // Nouvelle option pour spécifier directement la taille cible
    } = await request.json();
    
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

    let finalTargetSizeKB: number;

    if (targetSizeKB && targetSizeKB > 0) {
      // Utiliser la taille cible fournie directement
      finalTargetSizeKB = targetSizeKB;
      console.log(`🎯 Taille cible fournie directement: ${finalTargetSizeKB}KB`);
    } else {
      // Calculer les tailles cibles adaptatives avec la stratégie (méthode existante)
      let allImageUrls: string[];
      
      if (isCover) {
        allImageUrls = [imageUrl];
        console.log(`🖼️ Mode couverture: traitement de l'image seule ${imageUrl}`);
      } else {
        allImageUrls = wedding.images.map(img => img.fileUrl);
        console.log(`📸 Mode galerie: traitement de ${allImageUrls.length} images`);
      }
      
      const targetSizes = await calculateTargetSize(baseDir, allImageUrls, resizePercentage, compressionStrategy);
      const targetSizeBytes = targetSizes[imageUrl];
      finalTargetSizeKB = Math.round(targetSizeBytes / 1024);
      
      console.log(`🎯 Taille cible calculée pour ${imageUrl}: ${finalTargetSizeKB}KB (${compressionStrategy})`);
    }

    // Generate thumbnail with adaptive sizing
    const result = await handleThumbnailGeneration({
      baseDir,
      imageUrl,
      targetSizeKB: finalTargetSizeKB,
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
      targetSizeKB: finalTargetSizeKB,
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