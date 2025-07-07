import { NextRequest, NextResponse } from 'next/server';
import { rmdir } from 'fs/promises';
import path from 'path';
import { Wedding } from '@/lib/dataTemplate';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    const weddings = await parseWeddingsData();
    if (!weddings) throw new Error('Weddings data not found');

    const weddingIndex = weddings.findIndex((w: Wedding) => Number(w.id) === Number(id));
    if (weddingIndex === -1) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }

    const wedding = weddings[weddingIndex];
    const folderId = wedding.folderId;

    // Remove wedding from data
    weddings.splice(weddingIndex, 1);
    
    // Update data.json file
    await updateWeddingsData(weddings);

    // Delete folder
    if (folderId) {
      const folderPath = path.join(process.cwd(), 'public', folderId);
      try {
        if (existsSync(folderPath)) {
          await rmdir(folderPath, { recursive: true });
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}