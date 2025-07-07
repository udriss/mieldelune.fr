import { NextResponse } from 'next/server';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, imageId, description, ...updates } = await req.json();

    // 
    // Get current weddings data
    const weddings = await parseWeddingsData();
    
    const weddingIndex = weddings.findIndex(w => Number(w.id) === Number(id));
    if (weddingIndex === -1) {
      return NextResponse.json(
        { message: 'Wedding not found' }, 
        { status: 404 }
      );
    }

    // If we're updating an image description
    if (imageId && description !== undefined) {
      const imageIndex = weddings[weddingIndex].images.findIndex(img => img.id === imageId);
      
      if (imageIndex === -1) {
        return NextResponse.json(
          { message: 'Image not found' }, 
          { status: 404 }
        );
      }

      // Update the image description
      weddings[weddingIndex].images[imageIndex].description = description;
    } else {
      // Update wedding with new field values
      weddings[weddingIndex] = {
        ...weddings[weddingIndex],
        ...updates,
      };
    }

    // Save updated weddings data
    await updateWeddingsData(weddings);

    return NextResponse.json(
      { 
        message: 'Wedding updated successfully',
        wedding: weddings[weddingIndex] // Return the updated wedding
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Wedding update failed:', error);
    return NextResponse.json(
      { message: 'Failed to update wedding' },
      { status: 500 }
    );
  }
}