import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Wedding, Image } from '@/lib/dataTemplate';
import { dataTemplate } from '@/lib/data-template';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Read current weddings data
    const weddings = await parseWeddingsData();

    // Extract current IDs and find next available ID
    const currentEventIds: number[] = weddings.map((wedding: Wedding) => parseInt(wedding.id.toString()));
    const nextId = Math.max(...currentEventIds, 0) + 1;

    // Create new wedding object
    const newWedding: Wedding = {
      id: nextId,
      folderId: Date.now().toString(),
      coverImage: {
        id: (Date.now()+1).toString(), 
        fileUrl: "/src/coverRef.png",
        fileType: "coverStorage"
      },
      title: `Nouvel événement avec id ${nextId.toString()}`,
      date: new Date().toISOString(),
      location: "",
      description: "Un mariage pas comme les autres.",
      visible: false,
      images: []
    };

    // Add new wedding and save to JSON file
    const updatedWeddings = [...weddings, newWedding];
    await updateWeddingsData(updatedWeddings);

    return NextResponse.json({ success: true, newWedding });
  } catch (error) {
    console.error('Error creating new event:', error);
    return NextResponse.json({ error: 'Failed to create new event' }, { status: 500 });
  }
}