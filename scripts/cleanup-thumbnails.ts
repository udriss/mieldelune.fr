#!/usr/bin/env node

/**
 * Script pour nettoyer les anciennes thumbnails et mettre à jour data.json
 * Ce script peut être exécuté pour maintenir la cohérence du système de cache-busting
 */

import { readdir, unlink, stat } from 'fs/promises';
import path from 'path';
import { parseWeddingsData, updateWeddingsData } from '../lib/utils/data-parser';

interface CleanupStats {
  totalWeddings: number;
  cleanedThumbnails: number;
  updatedCoverImages: number;
  updatedRegularImages: number;
  errors: string[];
}

async function cleanupThumbnails(): Promise<CleanupStats> {
  const stats: CleanupStats = {
    totalWeddings: 0,
    cleanedThumbnails: 0,
    updatedCoverImages: 0,
    updatedRegularImages: 0,
    errors: []
  };

  try {
    console.log('🧹 Début du nettoyage des thumbnails...');
    
    const weddings = await parseWeddingsData();
    stats.totalWeddings = weddings.length;
    
    let hasUpdates = false;

    for (const wedding of weddings) {
      console.log(`\n📁 Traitement du mariage: ${wedding.title} (${wedding.folderId})`);
      
      const baseDir = path.join(process.cwd(), 'public', wedding.folderId);
      const thumbDir = path.join(baseDir, 'thumbnails');
      
      try {
        await stat(thumbDir);
      } catch {
        console.log(`⏭️ Pas de dossier thumbnails pour ${wedding.folderId}`);
        continue;
      }

      try {
        const thumbnailFiles = await readdir(thumbDir);
        const thumbnailsToKeep = new Set<string>();
        
        // Collecter les thumbnails qui doivent être conservées
        if (wedding.coverImage?.fileUrlThumbnail) {
          const coverThumbnailName = wedding.coverImage.fileUrlThumbnail.split('/').pop();
          if (coverThumbnailName) {
            thumbnailsToKeep.add(coverThumbnailName);
          }
        }
        
        for (const image of wedding.images) {
          if (image.fileUrlThumbnail) {
            const imageThumbnailName = image.fileUrlThumbnail.split('/').pop();
            if (imageThumbnailName) {
              thumbnailsToKeep.add(imageThumbnailName);
            }
          }
        }
        
        // Supprimer les thumbnails orphelines
        for (const thumbnailFile of thumbnailFiles) {
          if (!thumbnailsToKeep.has(thumbnailFile)) {
            try {
              await unlink(path.join(thumbDir, thumbnailFile));
              console.log(`🗑️ Thumbnail orpheline supprimée: ${thumbnailFile}`);
              stats.cleanedThumbnails++;
            } catch (error) {
              const errorMsg = `Erreur lors de la suppression de ${thumbnailFile}: ${error}`;
              console.error(`❌ ${errorMsg}`);
              stats.errors.push(errorMsg);
            }
          }
        }
        
        // Vérifier et mettre à jour les références manquantes avec timestamps
        if (wedding.coverImage && wedding.coverImage.fileType === 'coverStorage') {
          const coverFileName = wedding.coverImage.fileUrl.split('/').pop();
          if (coverFileName) {
            const fileExtension = path.extname(coverFileName);
            const fileNameWithoutExt = path.basename(coverFileName, fileExtension);
            
            // Chercher une thumbnail existante pour cette image
            const existingThumbnail = thumbnailFiles.find(thumb => 
              thumb.startsWith(`${fileNameWithoutExt}_THUMBEL`) && thumb.endsWith(fileExtension)
            );
            
            if (existingThumbnail) {
              const expectedPath = `/${wedding.folderId}/thumbnails/${existingThumbnail}`;
              if (wedding.coverImage.fileUrlThumbnail !== expectedPath) {
                wedding.coverImage.fileUrlThumbnail = expectedPath;
                console.log(`🔄 Thumbnail de couverture mise à jour: ${existingThumbnail}`);
                stats.updatedCoverImages++;
                hasUpdates = true;
              }
            }
          }
        }
        
        // Vérifier les images régulières
        for (const image of wedding.images) {
          if (image.fileType === 'storage') {
            const imageFileName = image.fileUrl.split('/').pop();
            if (imageFileName) {
              const fileExtension = path.extname(imageFileName);
              const fileNameWithoutExt = path.basename(imageFileName, fileExtension);
              
              // Chercher une thumbnail existante pour cette image
              const existingThumbnail = thumbnailFiles.find(thumb => 
                thumb.startsWith(`${fileNameWithoutExt}_THUMBEL`) && thumb.endsWith(fileExtension)
              );
              
              if (existingThumbnail) {
                const expectedPath = `/${wedding.folderId}/thumbnails/${existingThumbnail}`;
                if (image.fileUrlThumbnail !== expectedPath) {
                  image.fileUrlThumbnail = expectedPath;
                  console.log(`🔄 Thumbnail d'image mise à jour: ${existingThumbnail}`);
                  stats.updatedRegularImages++;
                  hasUpdates = true;
                }
              }
            }
          }
        }
        
      } catch (error) {
        const errorMsg = `Erreur lors du traitement du dossier ${wedding.folderId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }
    }
    
    // Sauvegarder les modifications
    if (hasUpdates) {
      await updateWeddingsData(weddings);
      console.log('\n💾 Fichier data.json mis à jour avec les nouvelles références');
    } else {
      console.log('\n✅ Aucune mise à jour nécessaire dans data.json');
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
  console.log('🚀 Démarrage du script de nettoyage des thumbnails');
  
  const stats = await cleanupThumbnails();
  
  console.log('\n📊 Résumé du nettoyage:');
  console.log(`   Mariages traités: ${stats.totalWeddings}`);
  console.log(`   Thumbnails supprimées: ${stats.cleanedThumbnails}`);
  console.log(`   Images de couverture mises à jour: ${stats.updatedCoverImages}`);
  console.log(`   Images régulières mises à jour: ${stats.updatedRegularImages}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️ Erreurs rencontrées (${stats.errors.length}):`);
    stats.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  console.log('\n✨ Nettoyage terminé');
}

// Exporter pour utilisation comme module
export { cleanupThumbnails };

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}
