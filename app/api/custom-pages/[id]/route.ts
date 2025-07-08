import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CUSTOM_PAGES_FILE = path.join(process.cwd(), 'data', 'customPages.json');

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  isPasswordProtected: boolean;
  password?: string;
  isPublished: boolean;
  isRandomSlug: boolean;
  content: ContentElement[];
  createdAt: number;
  updatedAt: number;
}

interface ContentElement {
  id: string;
  type: 'title' | 'text' | 'image' | 'video';
  content: string;
  order: number;
  settings?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    width?: string;
    height?: string;
    alt?: string;
    autoplay?: boolean;
    controls?: boolean;
  };
}

// Lire les pages
function readPages(): CustomPage[] {
  try {
    if (!fs.existsSync(CUSTOM_PAGES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CUSTOM_PAGES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.pages || [];
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier des pages:', error);
    return [];
  }
}

// Écrire les pages
function writePages(pages: CustomPage[]) {
  try {
    const dataDir = path.dirname(CUSTOM_PAGES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CUSTOM_PAGES_FILE, JSON.stringify({ pages }, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'écriture du fichier des pages:', error);
    throw error;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de page requis' },
        { status: 400 }
      );
    }
    
    const pages = readPages();
    const pageIndex = pages.findIndex(page => page.id === id);
    
    if (pageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      );
    }
    
    pages.splice(pageIndex, 1);
    writePages(pages);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/custom-pages/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la page' },
      { status: 500 }
    );
  }
}
