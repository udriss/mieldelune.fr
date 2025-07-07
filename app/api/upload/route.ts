import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import path from 'path';
import { Wedding, Image } from '@/lib/dataTemplate';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import sharp from 'sharp';

const generateUniqueId = (() => {
  let baseTime = Date.now();
  return () => (baseTime++).toString();
})();

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const weddingId = formData.get('weddingId') as string;
    const isCover = formData.get('isCover') as string;

    if (!file || !weddingId) {
      return NextResponse.json({
        success: false,
        error: 'File or weddingId missing'
      }, { status: 400 });
    }

    // Read current weddings data
    const weddings = await parseWeddingsData();
    if (!weddings) throw new Error('Weddings data not found');

    const foundWedding: Wedding | undefined = weddings.find((w: Wedding): boolean => w.id === parseInt(weddingId));
    if (!foundWedding) {
      return new Response('Wedding not found', { status: 404 });
    }

    if (!foundWedding.folderId) {
      foundWedding.folderId = Date.now().toString();
    }
    
    // Check if directory exists
    const baseDir = path.join(process.cwd(), 'public', foundWedding.folderId);
    try {
      await access(baseDir);
    } catch {
      await mkdir(baseDir, { recursive: true });
    }

    // Après la création du dossier principal
    const thumbDir = path.join(baseDir, 'thumbnails');
    try {
      await access(thumbDir);
    } catch {
      await mkdir(thumbDir, { recursive: true });
    }

    const imageId = generateUniqueId();
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = `/${foundWedding.folderId}/${fileName}`;
    const filePath = path.join(baseDir, fileName);

    // Créer le nom du thumbnail
    const thumbFileName = fileName.replace('.jpg', '_THUMBEL.jpg');
    const thumbPath = path.join(thumbDir, thumbFileName);
    const thumbUrl = `/${foundWedding.folderId}/thumbnails/${thumbFileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sauvegarder l'image originale
    await writeFile(filePath, buffer);

    // Générer et sauvegarder le thumbnail avec Sharp
    await sharp(buffer)
      .resize(300, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 40 })
      .toFile(thumbPath);

    // Create new image object with thumbnail
    const newImage: Image = {
      id: imageId,
      fileUrl: fileUrl,
      fileType: isCover === 'true' ? 'coverStorage' : 'storage',
      fileUrlThumbnail: thumbUrl,
      description: ''
    };

    const wedding = isCover === 'true' 
      ? { ...foundWedding, coverImage: newImage }
      : { ...foundWedding, images: [...(foundWedding.images || []), newImage] };

    const updatedWeddings: Wedding[] = weddings.map((w: Wedding): Wedding => 
      w.id === parseInt(weddingId) ? wedding : w
    );

    // Save to JSON file
    await updateWeddingsData(updatedWeddings);

    return NextResponse.json({
      success: true,
      image: newImage,
      updatedWeddings,
      fileUrlThumbnail: thumbUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    }, { status: 500 });
  }
}