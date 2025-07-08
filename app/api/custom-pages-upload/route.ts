import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (type === 'image' && !isImage) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers image sont acceptés' },
        { status: 400 }
      );
    }

    if (type === 'video' && !isVideo) {
      return NextResponse.json(
        { success: false, error: 'Seuls les fichiers vidéo sont acceptés' },
        { status: 400 }
      );
    }

    // Validation de la taille (25MB pour images, 500MB pour vidéos)
    const maxSize = type === 'image' ? 25 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux. Taille maximale : ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Créer le nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;

    // Définir le dossier de destination
    const uploadDir = path.join(process.cwd(), 'public', 'custom-pages', type + 's');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Chemin complet du fichier
    const filePath = path.join(uploadDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retourner l'URL publique
    const publicUrl = `/custom-pages/${type}s/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
