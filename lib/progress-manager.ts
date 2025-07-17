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

// Stockage du progrès des processus partagé entre les APIs
const processProgress = new Map<string, ProgressData>();

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
}

// Fonction utilitaire pour nettoyer le progrès
export function clearProgress(processId: string) {
  console.log(`🧹 Nettoyage progrès ${processId}`);
  processProgress.delete(processId);
}

// Fonction utilitaire pour initialiser le progrès
export function initProgress(processId: string, totalImages: number) {
  console.log(`🚀 Initialisation progrès ${processId}: ${totalImages} images`);
  processProgress.set(processId, {
    totalImages,
    processedImages: 0,
    status: 'running'
  });
}

// Fonction pour récupérer le progrès
export function getProgress(processId: string): ProgressData | undefined {
  const progress = processProgress.get(processId);
  console.log(`📋 Récupération progrès ${processId}:`, progress ? `${progress.processedImages}/${progress.totalImages}` : 'non trouvé');
  return progress;
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
    console.log(`📈 Ajout statistique compression pour ${processId}: ${stat.imageName}`);
  }
}

// Fonction pour lister tous les processus (debug)
export function listAllProcesses(): string[] {
  const processes = Array.from(processProgress.keys());
  console.log('📝 Processus actifs:', processes);
  return processes;
}
