#!/usr/bin/env node

/**
 * Script pour générer automatiquement les thumbnails manquantes pour les images de couverture
 * avec système de cache-busting intégré
 */

import { access, mkdir, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '../lib/utils/data-parser';

interface GenerationStats {
  totalCoverImages: number;
  generatedThumbnails: number;
  skippedExisting: number;
  errors: string[];
}

async function generateCoverThumbnail(
  baseDir: string, 
  imageUrl: string, 
  targetSizeKB: number = 50
): Promise<{ success: boolean; thumbPath?: string; error?: string }> {
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
      return { success: false, error: 'Invalid filename from URL' };
    }

    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    
    // Générer un timestamp pour le cache-busting
    const timestamp = Date.now();
    const thumbFileName = `${fileNameWithoutExt}_THUMBEL_${timestamp}${fileExtension}`;
    
    const originalPath = path.join(baseDir, fileName);
    const thumbPath = path.join(thumbDir, thumbFileName);

    // Supprimer les anciennes miniatures
    try {
      const files = await require('fs/promises').readdir(thumbDir);
      const oldThumbnails = files.filter((file: string) => 
        file.startsWith(`${fileNameWithoutExt}_THUMBEL`) && file.endsWith(fileExtension)
      );
      
      for (const oldThumb of oldThumbnails) {
        try {
          await require('fs/promises').unlink(path.join(thumbDir, oldThumb));
          console.log(`🗑️ Ancienne miniature supprimée: ${oldThumb}`);
        } catch (error) {
          console.warn(`⚠️ Impossible de supprimer l'ancienne miniature: ${oldThumb}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la recherche d\'anciennes miniatures:', error);
    }

    // Get original image metadata
    const metadata = await sharp(originalPath).metadata();
    if (!metadata.width || !metadata.height) {
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
        
        // Si la taille est dans la plage acceptable, on accepte
        if (actualSizeKB <= targetSizeKB * 1.2) {
          const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
          return { success: true, thumbPath: thumbUrlPath };
        }
        
        // Ajuster la qualité pour la prochaine tentative
        quality = Math.max(10, quality - 15);
        attempt++;
        
        // Supprimer le fichier temporaire si ce n'est pas la dernière tentative
        if (attempt < maxAttempts) {
          try {
            await require('fs/promises').unlink(thumbPath);
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
    
    return { success: true, thumbPath: thumbUrlPath };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Thumbnail generation failed' 
    };
  }
}

async function generateMissingCoverThumbnails(): Promise<GenerationStats> {
  const stats: GenerationStats = {
    totalCoverImages: 0,
    generatedThumbnails: 0,
    skippedExisting: 0,
    errors: []
  };

  try {
    console.log('🖼️ Génération des thumbnails de couverture manquantes...');
    
    const weddings = await parseWeddingsData();
    let hasUpdates = false;

    for (const wedding of weddings) {
      if (!wedding.coverImage || wedding.coverImage.fileType !== 'coverStorage') {
        continue;
      }

      stats.totalCoverImages++;
      console.log(`\n📁 Traitement de l'image de couverture: ${wedding.title} (${wedding.folderId})`);
      
      const baseDir = path.join(process.cwd(), 'public', wedding.folderId);
      
      try {
        await access(baseDir);
      } catch {
        const errorMsg = `Dossier non accessible: ${baseDir}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
        continue;
      }

      // Vérifier si une thumbnail existe déjà
      if (wedding.coverImage.fileUrlThumbnail) {
        const thumbPath = path.join(process.cwd(), 'public', wedding.coverImage.fileUrlThumbnail);
        try {
          await access(thumbPath);
          console.log(`✅ Thumbnail existante trouvée: ${wedding.coverImage.fileUrlThumbnail}`);
          stats.skippedExisting++;
          continue;
        } catch {
          // La thumbnail référencée n'existe pas, on va en générer une nouvelle
          console.log(`⚠️ Thumbnail référencée manquante, génération d'une nouvelle...`);
        }
      }

      // Générer la thumbnail
      try {
        const result = await generateCoverThumbnail(baseDir, wedding.coverImage.fileUrl, 50);
        
        if (result.success && result.thumbPath) {
          // Mettre à jour la référence dans wedding
          wedding.coverImage.fileUrlThumbnail = result.thumbPath;
          hasUpdates = true;
          stats.generatedThumbnails++;
          console.log(`✨ Thumbnail générée: ${result.thumbPath}`);
        } else {
          const errorMsg = `Échec de génération pour ${wedding.coverImage.fileUrl}: ${result.error}`;
          console.error(`❌ ${errorMsg}`);
          stats.errors.push(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Erreur lors de la génération pour ${wedding.folderId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
    // Sauvegarder les modifications
    if (hasUpdates) {
      await updateWeddingsData(weddings);
      console.log('\n💾 Fichier data.json mis à jour avec les nouvelles thumbnails');
    }
    
  } catch (error) {
    const errorMsg = `Erreur fatale: ${error}`;
    console.error(`❌ ${errorMsg}`);
    stats.errors.push(errorMsg);
  }
  
  return stats;
}

// Fonction principale pour exécution en ligne de commande
async function main() {
  console.log('🚀 Démarrage de la génération de thumbnails de couverture');
  
  const stats = await generateMissingCoverThumbnails();
  
  console.log('\n📊 Résumé de la génération:');
  console.log(`   Images de couverture traitées: ${stats.totalCoverImages}`);
  console.log(`   Thumbnails générées: ${stats.generatedThumbnails}`);
  console.log(`   Thumbnails existantes ignorées: ${stats.skippedExisting}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️ Erreurs rencontrées (${stats.errors.length}):`);
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n✨ Génération terminée');
}

// Exporter pour utilisation comme module
export { generateMissingCoverThumbnails };

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
