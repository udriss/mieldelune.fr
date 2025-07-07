import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { Wedding, Image } from '@/lib/dataTemplate';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, imageId, fileType } = await req.json();
    const weddings = await parseWeddingsData();

    const wedding = weddings.find((w: Wedding) => Number(w.id) === Number(id));
    if (!wedding) {
      
      
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    // Find and remove image
    const image = wedding.images.find((image: Image) => image.id === imageId);
    if (!image) {
      
      
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    const { fileUrl } = image;
    wedding.images = wedding.images.filter((image: Image) => image.id !== imageId);

    // Delete physical file if storage type
    if (fileType === 'storage') {
      const filePath = path.join(process.cwd(), 'public', fileUrl);
      try {
        await fs.unlink(filePath);
        
        // Also delete thumbnail if exists
        const thumbPath = path.join(
          process.cwd(), 
          'public', 
          wedding.folderId || '', 
          'thumbnails', 
          fileUrl.split('/').pop()?.replace('.jpg', '_THUMBEL.jpg') || ''
        );
        await fs.unlink(thumbPath).catch(() => {});
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }

    // Update weddings data
    const updatedWeddings = weddings.map(w => 
      Number(w.id) === Number(id) ? wedding : w
    );
    await updateWeddingsData(updatedWeddings);

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}