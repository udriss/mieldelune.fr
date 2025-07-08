import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'images' ou 'videos'
    
    if (!type || !['images', 'videos'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier invalide' },
        { status: 400 }
      );
    }

    const filesDir = path.join(process.cwd(), 'public', 'custom-pages', type);
    
    if (!fs.existsSync(filesDir)) {
      return NextResponse.json({ success: true, files: [] });
    }

    const files = fs.readdirSync(filesDir);
    const filesList = files
      .filter(file => {
        // Filtrer les fichiers cachés et garder seulement les vrais fichiers média
        if (file.startsWith('.')) return false;
        
        if (type === 'images') {
          return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
        }
        
        if (type === 'videos') {
          return /\.(mp4|webm|avi|mov|wmv|flv)$/i.test(file);
        }
        
        return false;
      })
      .map(file => {
        const filePath = path.join(filesDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          url: `/custom-pages/${type}/${file}`,
          size: stats.size,
          lastModified: stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.lastModified - a.lastModified); // Tri par date de modification décroissante

    return NextResponse.json({ success: true, files: filesList });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    const type = searchParams.get('type');
    
    if (!fileName || !type) {
      return NextResponse.json(
        { success: false, error: 'Nom de fichier et type requis' },
        { status: 400 }
      );
    }

    if (!['images', 'videos'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier invalide' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'custom-pages', type, fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du fichier' },
      { status: 500 }
    );
  }
}
