import { NextResponse } from 'next/server';
import { access, mkdir, unlink, stat, readdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { Wedding, Image } from '@/lib/dataTemplate';
import { updateProgress, initProgress, clearProgress, addCompressionStat } from '@/lib/progress-manager';

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
            error?: string;
        };
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

    for (const imageUrl of images) {
        try {
            const fileName = imageUrl.split('/').pop();
            if (!fileName) continue;

            const imagePath = path.join(baseDir, fileName);
            const stats = await stat(imagePath);
            imageData[imageUrl] = { target: 0, original: stats.size };
        } catch (error) {
            console.warn(`Unable to get size for ${imageUrl}:`, error);
            // Ajouter les images manquantes avec des valeurs par défaut pour le suivi des erreurs
            imageData[imageUrl] = { target: 0, original: 0 };
        }
    }

    // Filtrer pour ne garder que les images valides pour le calcul
    const validImageData = Object.fromEntries(
        Object.entries(imageData).filter(([_, data]) => data.original > 0)
    );

    const originalSizes = Object.values(validImageData).map((data) => data.original);

    if (originalSizes.length === 0) {
        console.warn('Aucune image valide trouvée pour le calcul des tailles cibles');
        return imageData;
    }

    if (strategy === 'worst') {
        // Calculer la taille cible de chaque image valide individuellement
        const targetSizes: number[] = [];
        for (const imageUrl in validImageData) {
            const originalSize = validImageData[imageUrl].original;
            const targetSize = originalSize * (targetPercentage / 100);
            targetSizes.push(targetSize);
        }

        // Prendre la plus petite taille cible comme référence
        const minTargetSize = Math.max(10 * 1024, Math.min(...targetSizes));

        // Appliquer cette taille cible minimale à toutes les images VALIDES
        for (const imageUrl in validImageData) {
            imageData[imageUrl].target = minTargetSize;
        }

        console.log(`🎯 Stratégie: ${strategy}, ${Object.keys(validImageData).length} images valides, Taille cible uniforme (plus petite): ${(minTargetSize / 1024).toFixed(1)}KB`);
    } else {
        const targetSizes: number[] = [];
        for (const imageUrl in validImageData) {
            const originalSize = validImageData[imageUrl].original;
            const targetSize = originalSize * (targetPercentage / 100);
            targetSizes.push(targetSize);
        }

        const maxTargetSize = Math.max(...targetSizes);

        console.log(`🎯 Stratégie: ${strategy}, ${Object.keys(validImageData).length} images valides, Taille cible maximale: ${(maxTargetSize / 1024).toFixed(1)}KB`);

        for (const imageUrl in validImageData) {
            const originalSize = validImageData[imageUrl].original;
            imageData[imageUrl].target = Math.min(originalSize, maxTargetSize);
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
): Promise<{ success: boolean; finalSize?: number; dimensions?: { width: number; height: number }; error?: string; thumbnailFileName?: string }> {
    try {
        if (signal.aborted) {
            return { success: false };
        }

        const thumbDir = path.join(baseDir, 'thumbnails');

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
        
        // Générer un timestamp pour le cache-busting
        const timestamp = Math.floor(Date.now() / 1000);
        const thumbFileName = `${fileNameWithoutExt}_THUMBEL_${timestamp}${fileExtension}`;

        const originalPath = path.join(baseDir, fileName);
        const thumbPath = path.join(thumbDir, thumbFileName);

        try {
            await access(originalPath);
        } catch (error) {
            console.error(`❌ Fichier introuvable: ${originalPath}`);
            return { success: false, error: 'Fichier introuvable' };
        }

        // Supprimer l'ancienne thumbnail si elle existe
        try {
            const thumbnailPattern = `${fileNameWithoutExt}_THUMBEL_*${fileExtension}`;
            const existingThumbnails = await readdir(thumbDir);
            const oldThumbnails = existingThumbnails.filter((file: string) => 
                file.startsWith(`${fileNameWithoutExt}_THUMBEL_`) && file.endsWith(fileExtension)
            );
            
            for (const oldThumb of oldThumbnails) {
                const oldThumbPath = path.join(thumbDir, oldThumb);
                await unlink(oldThumbPath);
                console.log(`🗑️ Ancienne thumbnail supprimée: ${oldThumb}`);
            }
        } catch (error) {
            console.warn(`⚠️ Erreur lors de la suppression des anciennes thumbnails pour ${fileName}:`, error);
        }

        const metadata = await sharp(originalPath).metadata();
        if (!metadata.width || !metadata.height) {
            return { success: false, error: 'Metadonnees image invalides' };
        }

        if (signal.aborted) {
            return { success: false };
        }

        try {
            await unlink(thumbPath);
        } catch {
            // File doesn't exist, continue
        }

        const targetSizeBytes = targetSizeKB * 1024;

        let quality = 75;
        let width = metadata.width;
        let height = metadata.height;
        let attempts = 0;
        const maxAttempts = 8;
        let finalBuffer: Buffer | null = null;

        while (attempts < maxAttempts) {
            if (signal.aborted) {
                return { success: false };
            }

            const sharpInstance = sharp(originalPath);

            if (width < metadata.width || height < metadata.height) {
                sharpInstance.resize(Math.round(width), Math.round(height), {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }

            const buffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();

            const currentSize = buffer.length;

            if (currentSize <= targetSizeBytes * 1.05 || attempts === maxAttempts - 1) {
                finalBuffer = buffer;
                break;
            }

            const ratio = targetSizeBytes / currentSize;
            if (ratio < 0.6) {
                const scale = Math.sqrt(ratio);
                width = Math.max(200, width * scale);
                height = Math.max(150, height * scale);
                quality = Math.max(15, Math.round(quality * 0.8));
            } else if (ratio < 0.8) {
                quality = Math.max(15, Math.round(quality * 0.7));
            } else {
                quality = Math.max(15, Math.round(quality * Math.sqrt(ratio) * 0.9));
            }
            attempts++;

            console.log(
                `🔄 Tentative ${attempts}/${maxAttempts}: Qualité ${quality}, Dimensions ${Math.round(
                    width
                )}x${Math.round(height)}, Taille ${(currentSize / 1024).toFixed(1)}KB, Cible ${(targetSizeBytes / 1024).toFixed(
                    1
                )}KB`
            );
        }

        if (!finalBuffer) {
            return { success: false };
        }

        await sharp(finalBuffer).toFile(thumbPath);

        return {
            success: true,
            finalSize: finalBuffer.length,
            dimensions: { width: metadata.width, height: metadata.height },
            thumbnailFileName: thumbFileName
        };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
}

export async function POST(request: Request): Promise<Response> {
    try {
        const { folderId, resizePercentage, compressionStrategy, processId }: BatchThumbnailRequest = await request.json();

        const controller = new AbortController();
        activeProcesses.set(processId, controller);

        const weddings = await parseWeddingsData();
        const wedding = weddings.find((w: Wedding) => w.folderId === folderId);

        if (!wedding) {
            activeProcesses.delete(processId);
            return NextResponse.json({ success: false, error: 'Wedding not found' }, { status: 404 });
        }

        // Initialiser le progrès une seule fois avec le bon total
        initProgress(processId, wedding.images.length);
        console.log(`🎬 Processus ${processId} initialisé pour ${wedding.images.length} images`);

        const baseDir = path.join(process.cwd(), 'public', folderId);

        const allImageUrls = wedding.images.map((img: Image) => img.fileUrl);
        const targetData = await calculateAllTargetSizes(baseDir, allImageUrls, resizePercentage, compressionStrategy);

        const compressionStats: ThumbnailBatchResult['compressionStats'] = {};
        const failedImages: string[] = [];
        let processedCount = 0;

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

            // Si l'image est manquante (original = 0), traiter comme une erreur directement
            if (imageData.original === 0) {
                const fileName = image.fileUrl.split('/').pop() || '';
                const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
                let imageName = fileName.replace(/\.\w+$/, '');

                if (imageName.includes('-')) {
                    const dashIndex = imageName.indexOf('-');
                    imageName = imageName.substring(dashIndex + 1);
                }

                const fullImageName = `${imageName}${fileExtension}`;

                const errorStat = {
                    imageName: fullImageName,
                    originalSize: 0,
                    finalSize: 0,
                    compressionRate: 0,
                    targetSize: 0,
                    error: 'Fichier introuvable',
                };

                console.log(`❌ Ajout d'une erreur pour ${fullImageName}: ${errorStat.error}`);
                compressionStats[image.fileUrl] = errorStat;
                addCompressionStat(processId, image.fileUrl, errorStat);

                failedImages.push(image.fileUrl);
                processedCount++;
                updateProgress(processId, processedCount, wedding.images.length);
                continue;
            }

            const targetSizeKB = Math.round(imageData.target / 1024);

            updateProgress(processId, processedCount, wedding.images.length, image.fileUrl);

            const result = await generateSingleThumbnail(baseDir, image.fileUrl, targetSizeKB, controller.signal);

            if (result.success && result.finalSize && result.dimensions) {
                const imageIndex = wedding.images.findIndex((img: Image) => img.fileUrl === image.fileUrl);
                if (imageIndex !== -1) {
                    wedding.images[imageIndex].width = result.dimensions.width;
                    wedding.images[imageIndex].height = result.dimensions.height;
                    
                    // Mettre à jour le chemin de la thumbnail avec le nom généré (seulement si disponible)
                    if (result.thumbnailFileName) {
                        const thumbnailPath = `/${folderId}/thumbnails/${result.thumbnailFileName}`;
                        wedding.images[imageIndex].fileUrlThumbnail = thumbnailPath;
                        console.log(`📸 Thumbnail mise à jour: ${thumbnailPath}`);
                    }
                }

                const fileName = image.fileUrl.split('/').pop() || '';
                const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
                let imageName = fileName.replace(/\.\w+$/, '');

                if (imageName.includes('-')) {
                    const dashIndex = imageName.indexOf('-');
                    imageName = imageName.substring(dashIndex + 1);
                }

                const fullImageName = `${imageName}${fileExtension}`;

                const compressionStat = {
                    imageName: fullImageName,
                    originalSize: imageData.original,
                    finalSize: result.finalSize,
                    compressionRate: Math.round((1 - result.finalSize / imageData.original) * 100),
                    targetSize: imageData.target,
                    error: undefined,
                };

                compressionStats[image.fileUrl] = compressionStat;
                addCompressionStat(processId, image.fileUrl, compressionStat);
                processedCount++;
            } else {
                // Gestion des erreurs - garder l'affichage dans les statistiques
                const fileName = image.fileUrl.split('/').pop() || '';
                const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
                let imageName = fileName.replace(/\.\w+$/, '');

                if (imageName.includes('-')) {
                    const dashIndex = imageName.indexOf('-');
                    imageName = imageName.substring(dashIndex + 1);
                }

                const fullImageName = `${imageName}${fileExtension}`;

                const errorStat = {
                    imageName: fullImageName,
                    originalSize: imageData?.original || 0,
                    finalSize: 0,
                    compressionRate: 0,
                    targetSize: imageData?.target || 0,
                    error: result.error || 'Erreur inconnue',
                };

                console.log(`❌ Ajout d'une erreur pour ${fullImageName}: ${errorStat.error}`);
                compressionStats[image.fileUrl] = errorStat;
                addCompressionStat(processId, image.fileUrl, errorStat);

                failedImages.push(image.fileUrl);
                processedCount++;
            }

            updateProgress(processId, processedCount, wedding.images.length);
        }

        if (!controller.signal.aborted) {
            await updateWeddingsData(weddings);
        }

        activeProcesses.delete(processId);

        updateProgress(
            processId,
            processedCount,
            wedding.images.length,
            undefined,
            controller.signal.aborted ? 'cancelled' : 'completed'
        );

        const response: ThumbnailBatchResult = {
            success: !controller.signal.aborted,
            processId,
            totalImages: wedding.images.length,
            processedImages: processedCount,
            failedImages,
            compressionStats: controller.signal.aborted ? {} : compressionStats,
        };

        setTimeout(() => {
            clearProgress(processId);
        }, 30000); // 30 secondes pour laisser le temps au client de récupérer les résultats finaux

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in batch thumbnail generation:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request): Promise<Response> {
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
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
