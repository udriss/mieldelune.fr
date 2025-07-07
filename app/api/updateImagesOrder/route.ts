import { NextResponse } from 'next/server';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { Wedding, Image } from '@/lib/dataTemplate';

export async function POST(request: Request) {
  try {
    const { weddingId, images }: { weddingId: string; images: Image[] } = await request.json();
    const weddings = await parseWeddingsData();

    const updatedWeddings = weddings.map(wedding => {
      if (wedding.id === parseInt(weddingId)) {
        return {
          ...wedding,
          images: images
        };
      }
      return wedding;
    });

    await updateWeddingsData(updatedWeddings);
    
    return NextResponse.json(
      { message: 'Images order updated successfully', updatedWeddings },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update images order' },
      { status: 500 }
    );
  }
}