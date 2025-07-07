import { writeFile, unlink, mkdir, access } from 'fs/promises';
import { existsSync } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import { parseProfileData, updateProfileData } from '@/lib/utils/data-parser';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const generateUniqueId = (() => {
  let baseTime = Date.now();
  return () => (baseTime++).toString();
})();

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file = data.get('file') as File | null;
    const url = data.get('url') as string | null;

    if (!file && !url) {
      return NextResponse.json({
        success: false,
        error: 'No file or URL provided'
      }, { status: 400 });
    }

    const currentProfile = await parseProfileData();

    // Ensure Profil directory exists
    const profileDir = path.join(process.cwd(), 'public', 'Profil');
    try {
      await access(profileDir);
    } catch {
      await mkdir(profileDir, { recursive: true });
    }

    // Delete old profile image if exists
    if (currentProfile.imageUrl && currentProfile.imageUrl.startsWith('/Profil/')) {
      try {
        const oldFilePath = path.join(process.cwd(), 'public', currentProfile.imageUrl);
        await unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old profile image:', error);
      }
    }

    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          error: 'File size exceeds 100MB limit'
        }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = path.join(profileDir, fileName);
      const imageUrl = `/Profil/${fileName}`;

      await writeFile(filePath, buffer);

      try {
        await updateProfileData({
          ...currentProfile,
          imageUrl,
          imagetype: 'profileStorage',
        });

        return NextResponse.json({
          success: true,
          data: {
            imageUrl,
            imagetype: 'profileStorage'
          }
        });
      } catch (updateError) {
        await unlink(filePath);
        throw updateError;
      }
    }

    if (url) {
      await updateProfileData({
        ...currentProfile,
        imageUrl: url,
        imagetype: 'profileLink'
      });

      return NextResponse.json({
        success: true,
        data: {
          imageUrl: url,
          imagetype: 'profileLink'
        }
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process profile image'
    }, { status: 500 });
  }
}