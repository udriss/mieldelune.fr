import { NextResponse } from 'next/server';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import type { Wedding } from '@/lib/dataTemplate';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    // Read current weddings from JSON
    const weddings = await parseWeddingsData();
    
    // Find and update wedding visibility
    const weddingIndex = weddings.findIndex((w: Wedding) => Number(w.id) === Number(id));
    if (weddingIndex === -1) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    // Toggle visibility
    weddings[weddingIndex].visible = !weddings[weddingIndex].visible;

    // Save updated weddings to JSON
    await updateWeddingsData(weddings);

    return NextResponse.json({ 
      success: true, 
      wedding: weddings[weddingIndex] 
    });

  } catch (error) {
    console.error('Error updating visibility:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update visibility' 
    }, { status: 500 });
  }
}