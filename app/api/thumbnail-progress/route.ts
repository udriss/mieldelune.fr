import { NextResponse } from 'next/server';
import { getProgress, listAllProcesses } from '@/lib/progress-manager';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const processId = url.searchParams.get('processId');

    if (!processId) {
      return NextResponse.json({ success: false, error: 'Process ID required' }, { status: 400 });
    }

    // Log pour debug
    console.log(`🔍 Recherche du processus: ${processId}`);
    listAllProcesses(); // Afficher tous les processus actifs

    const progress = getProgress(processId);
    if (!progress) {
      return NextResponse.json({ success: false, error: 'Process not found' }, { status: 404 });
    }

    const progressPercentage = progress.totalImages > 0 
      ? (progress.processedImages / progress.totalImages) * 100 
      : 0;

    // Log pour debug - statistiques
    console.log(`🔄 Progress poll pour ${processId}:`, {
      percentage: Math.round(progressPercentage),
      statsCount: progress.compressionStats ? Object.keys(progress.compressionStats).length : 0,
      errorsCount: progress.compressionStats ? Object.values(progress.compressionStats).filter((stat: any) => stat.error).length : 0,
      stats: progress.compressionStats
    });

    return NextResponse.json({
      success: true,
      processId,
      progress: Math.round(progressPercentage),
      processedImages: progress.processedImages,
      totalImages: progress.totalImages,
      currentImage: progress.currentImage,
      status: progress.status,
      compressionStats: progress.compressionStats || {}
    });

  } catch (error) {
    console.error('Error getting progress:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
