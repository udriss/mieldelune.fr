import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { id, fileUrl, fileType } = await req.json();

    // Read current weddings data
    const weddings = await parseWeddingsData();

    const wedding = weddings.find(w => Number(w.id) === Number(id));
    if (!wedding) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    const generateUniqueId = (() => {
      let baseTime = Date.now();
      return () => (baseTime++).toString();
    })();

    if (fileType === 'coverLink') {
      if (wedding.coverImage?.fileType === 'coverStorage') {
        const filePath = path.join(process.cwd(), 'public', wedding.coverImage.fileUrl);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error('Failed to delete file in api/addUrl/:', err);
        }
      }
      wedding.coverImage = { 
        id: generateUniqueId(), 
        fileUrl: fileUrl, 
        fileType: 'coverLink',
        description: '' 
      };
    } else {
      wedding.images.push({ 
        id: generateUniqueId(), 
        fileUrl: fileUrl, 
        fileType: 'link',
        description: '' 
      });
    }

    const updatedWeddings = weddings.map(w => Number(w.id) === Number(id) ? wedding : w);
    
    // Save updated data to JSON file
    await updateWeddingsData(updatedWeddings);

    return NextResponse.json({ message: 'Image added successfully', wedding });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
  }
}