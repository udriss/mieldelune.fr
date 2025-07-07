import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import type { Wedding } from '@/lib/dataTemplate';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, imageId, descriptionVisibility } = await req.json();

    if (!id || !imageId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Read the data file
    const dataFilePath = path.join(process.cwd(), 'lib', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Find the wedding and the image
    const weddingIndex = data.weddings.findIndex((w: any) => w.id == id);
    
    if (weddingIndex === -1) {
      return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
    }
    
    const wedding = data.weddings[weddingIndex];
    const imageIndex = wedding.images.findIndex((img: any) => img.id === imageId);
    
    if (imageIndex === -1) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Update the descriptionVisibility property
    wedding.images[imageIndex].descriptionVisibility = descriptionVisibility;

    // Save the updated data back to the file
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating description visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}