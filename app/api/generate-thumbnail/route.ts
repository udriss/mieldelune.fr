import { NextResponse } from 'next/server';
import { access, mkdir, unlink } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

interface ThumbnailGenerationParams {
  baseDir: string;
  imageUrl: string;
  resizePercentage: number;
  isCover: boolean;
}

interface ThumbnailGenerationResult {
  success: boolean;
  error?: string;
  thumbUrlPath?: string;
}

async function handleThumbnailGeneration({
  baseDir,
  imageUrl,
  resizePercentage,
  isCover
}: ThumbnailGenerationParams): Promise<ThumbnailGenerationResult> {
  // 
  
  try {
    const thumbDir = path.join(baseDir, 'thumbnails');
    // 

    // Ensure directories exist
    try {
      await access(thumbDir);
    } catch {
      await mkdir(thumbDir, { recursive: true });
      // 
    }

    const fileName = imageUrl.split('/').pop();
    if (!fileName) {
      console.error('❌ Invalid filename from URL:', imageUrl);
      return { success: false, error: 'Invalid image URL' };
    }

    const fileExtension = path.extname(fileName);
    const fileNameWithoutExt = path.basename(fileName, fileExtension);
    const thumbFileName = `${fileNameWithoutExt}_THUMBEL${fileExtension}`;
    
    const originalPath = path.join(baseDir, fileName);
    const thumbPath = path.join(thumbDir, thumbFileName);
    
    // 

    // Generate thumbnail
    const metadata = await sharp(originalPath).metadata();
    if (!metadata.width || !metadata.height) {
      console.error('❌ Invalid image metadata');
      return { success: false, error: 'Invalid image metadata' };
    }

    await sharp(originalPath)
      .resize(
        Math.round(metadata.width * (resizePercentage / 100)),
        Math.round(metadata.height * (resizePercentage / 100)),
        {
          fit: 'contain',
          withoutEnlargement: true
        }
      )
      .jpeg({
        quality: 40,
        chromaSubsampling: '4:2:0',
        mozjpeg: true,
        force: true
      })
      .toFile(thumbPath);

    const thumbUrlPath = `/${path.basename(baseDir)}/thumbnails/${thumbFileName}`;
    // 
    
    return { success: true, thumbUrlPath };
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
    // 
    
    const { folderId, imageUrl, resizePercentage = 20, isCover = false } = await request.json();
    // 
    
    // Validation
    if (!folderId || !imageUrl) {
      console.error('❌ Missing parameters:', { folderId, imageUrl });
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Get wedding data
    // 
    const weddings = await parseWeddingsData();
    const wedding = weddings.find(w => w.folderId === folderId);

    let originalPath: string;
    if (isCover) {
      if (!wedding?.coverImage) {
        console.error('❌ Cover image not found');
        return NextResponse.json({ 
          success: false, 
          error: 'Cover image not found' 
        }, { status: 404 });
      }
      originalPath = path.join(process.cwd(), 'public', wedding.coverImage.fileUrl);
    } else {
      const image = wedding?.images.find(img => img.fileUrl === imageUrl);
      if (!image) {
        console.error('❌ Image not found');
        return NextResponse.json({ 
          success: false, 
          error: 'Image not found' 
        }, { status: 404 });
      }
      originalPath = path.join(process.cwd(), 'public', image.fileUrl);
    }

    // 

    try {
      await access(originalPath);
    } catch (err) {
      console.error('❌ Original file not found:', originalPath);
      return NextResponse.json({ 
        success: false, 
        error: 'Original file not found' 
      }, { status: 404 });
    }

    // Handle paths
    const baseDir = path.join(process.cwd(), 'public', folderId);
    const thumbDir = path.join(baseDir, 'thumbnails');
    // 

    try {
      await access(baseDir);
      // 
    } catch (err) {
      console.error('❌ Base directory access error:', err);
      return NextResponse.json({ 
        success: false, 
        error: 'Base directory not accessible' 
      }, { status: 500 });
    }

    // Generate thumbnail
    // 
    const result = await handleThumbnailGeneration({
      baseDir,
      imageUrl,
      resizePercentage,
      isCover
    });

    if (!result.success) {
      console.error('❌ Thumbnail generation failed:', result.error);
      return NextResponse.json(result, { status: 500 });
    }

    // Update data
    // 
    if (!wedding) {
      throw new Error('Wedding not found during update');
    }

    if (isCover) {
      if (!wedding.coverImage) {
        throw new Error('Cover image not found during update');
      }
      wedding.coverImage.fileUrlThumbnail = result.thumbUrlPath;
    } else {
      const image = wedding.images.find(img => img.fileUrl === imageUrl);
      if (image) {
        image.fileUrlThumbnail = result.thumbUrlPath;
      }
    }

    await updateWeddingsData(weddings);
    
    const duration = Date.now() - startTime;
    // 
    
    return NextResponse.json({ 
      success: true, 
      thumbnailPath: result.thumbUrlPath,
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