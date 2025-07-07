import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import mime from 'mime-types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  const fileUrl = searchParams.get('fileUrl');
  const isCachingTriggle = searchParams.get('isCachingTriggle');

  if (!fileUrl) {
    return new Response('Missing fileUrl parameter', { status: 400 });
  }

  const headers = new Headers();
  if (isCachingTriggle === 'true') {
    headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');
  }

  try {
    // Sécurise le chemin pour éviter les attaques path traversal
    const safeFileUrl = fileUrl.replace(/^\/+/, '').replace(/\.\./g, '');
    const filePath = path.join(process.cwd(), 'public', safeFileUrl);
    const file = await readFile(filePath);
    // Détermine dynamiquement le Content-Type
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}