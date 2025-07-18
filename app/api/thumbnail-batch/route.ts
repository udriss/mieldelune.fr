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
    strategy: 'best' | 'worst',
    signal?: AbortSignal
): Promise<{ [imageUrl: string]: { target: number; original: number } }> {
    const imageData: { [imageUrl: string]: { target: number; original: number } } = {};

    for (const imageUrl of images) {
        // Vérifier l'annulation à chaque itération
        if (signal?.aborted) {
            console.log(`🛑 Calcul des tailles cibles annulé`);
            break;
        }

        try {
            const fileName = imageUrl.split('/').pop();
            if (!fileName) continue;

            const imagePath = path.join(baseDir, fileName);
            
            try {
                const stats = await stat(imagePath);
                imageData[imageUrl] = {
                    target: 0,
                    original: stats.size
                };
            } catch (error) {
                imageData[imageUrl] = {
                    target: 0,
                    original: 0
                };
            }
        } catch (error) {
            console.error(`Erreur lors du calcul de la taille pour ${imageUrl}:`, error);
        }
    }

    // Vérifier l'annulation avant de continuer
    if (signal?.aborted) {
        return imageData;
    }

    const validImageData = Object.fromEntries(
        Object.entries(imageData).filter(([, data]) => data.original > 0)
    );

    if (Object.keys(validImageData).length === 0) {
        return imageData;
    }

    // Pour chaque image, calculer taille * pourcentage
    const perImageTargets = Object.values(validImageData).map(data => data.original * (targetPercentage / 100));

    if (strategy === 'best') {
        // Stratégie "best" :
        // 1. Pour chaque image, calculer taille * pourcentage
        // 2. Prendre le max de ces valeurs (targetSizeTEMP)
        // 3. La taille cible finale est la plus petite entre targetSizeTEMP et toutes les tailles d'origine
        const targetSizeTEMP = Math.max(...perImageTargets);
        const minOriginalSize = Math.min(...Object.values(validImageData).map(data => data.original));
        const finalTargetSize = Math.max(10 * 1024, Math.min(targetSizeTEMP, minOriginalSize));
        console.log(`🎯 Stratégie: ${strategy}, ${Object.keys(validImageData).length} images valides, targetSizeTEMP: ${(targetSizeTEMP / 1024).toFixed(1)}KB, minOriginalSize: ${(minOriginalSize / 1024).toFixed(1)}KB, finalTargetSize: ${(finalTargetSize / 1024).toFixed(1)}KB`);

        for (const imageUrl in validImageData) {
            imageData[imageUrl].target = finalTargetSize;
        }
    } else {
        // Stratégie "worst" : prendre la plus PETITE taille calculée pour compression maximale uniforme
        const minTargetSize = Math.min(...perImageTargets);
        console.log(`🎯 Stratégie: ${strategy}, ${Object.keys(validImageData).length} images valides, Taille cible uniforme (compression maximale): ${(minTargetSize / 1024).toFixed(1)}KB`);

        for (const imageUrl in validImageData) {
            const originalSize = validImageData[imageUrl].original;
            imageData[imageUrl].target = Math.max(10 * 1024, Math.min(minTargetSize, originalSize));
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
            return { success: false, error: 'Fichier original introuvable' };
        }

        // Supprimer l'ancienne thumbnail si elle existe
        const existingThumbs = await readdir(thumbDir).catch(() => []);
        for (const existingThumb of existingThumbs) {
            if (existingThumb.includes(fileNameWithoutExt) && existingThumb.includes('_THUMBEL_')) {
                const oldThumbPath = path.join(thumbDir, existingThumb);
                try {
                    await unlink(oldThumbPath);
                    console.log(`🗑️ Ancienne thumbnail supprimée: ${existingThumb}`);
                } catch (error) {
                    console.warn(`⚠️ Impossible de supprimer l'ancienne thumbnail: ${existingThumb}`);
                }
            }
        }

        const targetSizeBytes = targetSizeKB * 1024;
        const maxAttempts = 8;
        let attempts = 0;
        let quality = 60;
        let finalBuffer: Buffer | null = null;

        const metadata = await sharp(originalPath).metadata();
        let width = metadata.width || 800;
        let height = metadata.height || 600;

        while (attempts < maxAttempts) {
            if (signal.aborted) {
                console.log('🛑 Arrêt impératif demandé avant tentative sharp');
                return { success: false };
            }

            const sharpInstance = sharp(originalPath);

            if (width < metadata.width || height < metadata.height) {
                sharpInstance.resize(Math.round(width), Math.round(height), {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }

            // Vérification juste avant l'appel potentiellement long
            if (signal.aborted) {
                console.log('🛑 Arrêt impératif juste avant sharp().toBuffer()');
                return { success: false };
            }

            let buffer: Buffer;
            try {
                buffer = await sharpInstance.jpeg({ quality, mozjpeg: true }).toBuffer();
            } catch (err) {
                if (signal.aborted) {
                    console.log('🛑 Arrêt impératif détecté pendant sharp().toBuffer()');
                    return { success: false };
                }
                throw err;
            }

            // Vérification juste après l'appel asynchrone
            if (signal.aborted) {
                console.log('🛑 Arrêt impératif juste après sharp().toBuffer()');
                return { success: false };
            }

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

// Fonction asynchrone pour traiter les miniatures en arrière-plan
async function processThumbnailsAsync(
    processId: string,
    wedding: Wedding,
    baseDir: string,
    resizePercentage: number,
    compressionStrategy: 'best' | 'worst',
    signal: AbortSignal
) {
    try {
        console.log(`🎯 Démarrage du traitement asynchrone pour ${processId}`);
        if (signal.aborted) {
            console.log(`🛑 Signal déjà annulé au démarrage du process ${processId}`);
            updateProgress(processId, 0, wedding.images.length, undefined, 'cancelled');
            return;
        }
        const allImageUrls = wedding.images.map((img: Image) => img.fileUrl);
        const targetData = await calculateAllTargetSizes(baseDir, allImageUrls, resizePercentage, compressionStrategy, signal);

        // Vérifier si l'annulation s'est produite pendant le calcul des tailles
        if (signal.aborted) {
            console.log(`🛑 Traitement annulé pendant le calcul des tailles pour ${processId}`);
            updateProgress(processId, 0, wedding.images.length, undefined, 'cancelled');
            return;
        }

        const compressionStats: { [key: string]: any } = {};
        const failedImages: string[] = [];
        let processedCount = 0;

        console.log(`🔁 Début de la boucle de traitement des images (${wedding.images.length}) pour ${processId}`);
        for (const image of wedding.images) {
            console.log(`➡️ Traitement image: ${image.fileUrl}`);
            if (signal.aborted) {
                console.log(`🛑 Traitement annulé pour ${processId}`);
                updateProgress(processId, processedCount, wedding.images.length, undefined, 'cancelled');
                break;
            }

            const imageData = targetData[image.fileUrl];
            if (!imageData) {
                console.warn(`❓ Aucune donnée de cible pour ${image.fileUrl}`);
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

            // Mettre à jour le progrès AVANT de traiter l'image
            updateProgress(processId, processedCount, wedding.images.length, image.fileUrl);

            try {
                const result = await generateSingleThumbnail(baseDir, image.fileUrl, targetSizeKB, signal);

                if (result.success && result.finalSize && result.dimensions) {
                    const imageIndex = wedding.images.findIndex((img: Image) => img.fileUrl === image.fileUrl);
                    if (imageIndex !== -1) {
                        wedding.images[imageIndex].width = result.dimensions.width;
                        wedding.images[imageIndex].height = result.dimensions.height;
                        if (result.thumbnailFileName) {
                            const thumbnailPath = `/${wedding.folderId}/thumbnails/${result.thumbnailFileName}`;
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
                        compressionRate: Math.round(((imageData.original - result.finalSize) / imageData.original) * 100),
                        targetSize: imageData.target,
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
            } catch (err) {
                console.error(`❌ Erreur lors du traitement de l'image ${image.fileUrl}:`, err);
                processedCount++;
                updateProgress(processId, processedCount, wedding.images.length, image.fileUrl, 'error');
            }

            // Mettre à jour le progrès APRÈS avoir traité l'image
            updateProgress(processId, processedCount, wedding.images.length);
        }

        if (!signal.aborted) {
            // Sauvegarder les données uniquement si le processus n'a pas été annulé
            try {
                const weddings = await parseWeddingsData();
                const weddingIndex = weddings.findIndex((w: Wedding) => w.folderId === wedding.folderId);
                if (weddingIndex !== -1) {
                    weddings[weddingIndex] = wedding;
                    await updateWeddingsData(weddings);
                }
            } catch (err) {
                console.error(`❌ Erreur lors de la sauvegarde des données finales pour ${processId}:`, err);
            }
        }

        // Nettoyer les ressources
        activeProcesses.delete(processId);

        // Marquer le processus comme terminé
        updateProgress(
            processId,
            processedCount,
            wedding.images.length,
            undefined,
            signal.aborted ? 'cancelled' : 'completed'
        );

        console.log(`✅ Traitement asynchrone terminé pour ${processId} - ${processedCount}/${wedding.images.length} images`);

        // Nettoyer le progrès après un délai
        setTimeout(() => {
            clearProgress(processId);
        }, 30000); // 30 secondes pour laisser le temps au client de récupérer les résultats finaux

    } catch (error) {
        console.error(`❌ Erreur dans le traitement asynchrone pour ${processId}:`, error);
        activeProcesses.delete(processId);
        updateProgress(processId, 0, wedding.images.length, undefined, 'error');
    }
}

export async function POST(request: Request): Promise<Response> {
    try {
        const { folderId, resizePercentage, compressionStrategy, processId }: BatchThumbnailRequest = await request.json();

        const controller = new AbortController();
        activeProcesses.set(processId, controller);

        // Initialiser le progrès immédiatement
        console.log(`🚀 Initialisation progrès ${processId}: estimation en cours...`);
        initProgress(processId, 1); // Initialiser avec 1 pour que le processus soit trouvable

        const weddings = await parseWeddingsData();
        const wedding = weddings.find((w: Wedding) => w.folderId === folderId);

        if (!wedding) {
            activeProcesses.delete(processId);
            clearProgress(processId);
            return NextResponse.json({ success: false, error: 'Wedding not found' }, { status: 404 });
        }

        // Mettre à jour le progrès avec le bon nombre d'images
        console.log(`🚀 Initialisation progrès ${processId}: ${wedding.images.length} images`);
        initProgress(processId, wedding.images.length);
        console.log(`🎬 Processus ${processId} initialisé pour ${wedding.images.length} images`);

        const baseDir = path.join(process.cwd(), 'public', folderId);

        // **DÉMARRER LE TRAITEMENT EN ARRIÈRE-PLAN** (fire and forget)
        processThumbnailsAsync(processId, wedding, baseDir, resizePercentage, compressionStrategy, controller.signal);

        // **RETOURNER IMMÉDIATEMENT** la réponse pour libérer le client
        return NextResponse.json({
            success: true,
            processId,
            message: 'Processing started',
            totalImages: wedding.images.length
        });

    } catch (error) {
        console.error('Error starting batch thumbnail generation:', error);
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
