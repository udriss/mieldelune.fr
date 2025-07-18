interface CompressionStat {
  imageName: string;
  originalSize: number;
  finalSize: number;
  compressionRate: number;
  targetSize: number;
  error?: string;
}

interface ProgressData {
  totalImages: number;
  processedImages: number;
  currentImage?: string;
  status: 'running' | 'completed' | 'cancelled' | 'error';
  compressionStats?: { [key: string]: CompressionStat };
}



import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = '/tmp/thumbnail-progress.json';

// Fonction utilitaire pour charger le progrès depuis le disque
function loadProgressFromDisk(): Map<string, ProgressData> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      return new Map(Object.entries(obj));
    }
  } catch (e) {
    console.warn('⚠️ Impossible de charger le progrès depuis le disque:', e);
  }
  return new Map();
}

// Fonction utilitaire pour sauvegarder le progrès sur le disque
function saveProgressToDisk(map: Map<string, ProgressData>) {
  try {
    const obj = Object.fromEntries(map.entries());
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(obj));
  } catch (e) {
    console.warn('⚠️ Impossible de sauvegarder le progrès sur le disque:', e);
  }
}

// Stockage du progrès des processus partagé entre les APIs (persistant)
const processProgress = loadProgressFromDisk();

// Fonction utilitaire pour mettre à jour le progrès
export function updateProgress(
  processId: string, 
  processedImages: number, 
  totalImages: number, 
  currentImage?: string,
  status: 'running' | 'completed' | 'cancelled' | 'error' = 'running',
  compressionStats?: { [key: string]: CompressionStat }
) {
  console.log(`📊 Mise à jour progrès ${processId}: ${processedImages}/${totalImages} (${Math.round((processedImages/totalImages)*100)}%)`);
  const currentProgress = processProgress.get(processId) || {
    totalImages,
    processedImages: 0,
    status: 'running'
  };
  processProgress.set(processId, {
    ...currentProgress,
    totalImages,
    processedImages,
    currentImage,
    status,
    compressionStats: compressionStats || currentProgress.compressionStats
  });
  saveProgressToDisk(processProgress);
}

// Fonction utilitaire pour nettoyer le progrès
export function clearProgress(processId: string) {
  console.log(`🧹 Nettoyage progrès ${processId}`);
  processProgress.delete(processId);
  saveProgressToDisk(processProgress);
}

// Fonction utilitaire pour initialiser le progrès
export function initProgress(processId: string, totalImages: number) {
  console.log(`🚀 Initialisation progrès ${processId}: ${totalImages} images`);
  processProgress.set(processId, {
    totalImages,
    processedImages: 0,
    status: 'running'
  });
  saveProgressToDisk(processProgress);
}

// Fonction pour récupérer le progrès
export function getProgress(processId: string): ProgressData | undefined {
  // Toujours recharger le fichier pour garantir la cohérence entre workers
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const raw = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      const progress = obj[processId];
      console.log(`📋 Récupération progrès ${processId}:`, progress ? `${progress.processedImages}/${progress.totalImages}` : 'non trouvé');
      return progress;
    }
  } catch (e) {
    console.warn('⚠️ Impossible de charger le progrès depuis le disque (getProgress):', e);
  }
  console.log(`📋 Récupération progrès ${processId}: non trouvé`);
  return undefined;
}

// Fonction pour ajouter une statistique de compression
export function addCompressionStat(processId: string, imageUrl: string, stat: CompressionStat) {
  const currentProgress = processProgress.get(processId);
  if (currentProgress) {
    const compressionStats = currentProgress.compressionStats || {};
    compressionStats[imageUrl] = stat;
    processProgress.set(processId, {
      ...currentProgress,
      compressionStats
    });
    saveProgressToDisk(processProgress);
    console.log(`📈 Ajout statistique compression pour ${processId}: ${stat.imageName}`);
  }
}

// Fonction pour lister tous les processus (debug)
export function listAllProcesses(): string[] {
  const processes = Array.from(processProgress.keys());
  console.log('📝 Processus actifs:', processes);
  return processes;
}
