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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pages = readPages();
    
    const page = pages.find(p => p.slug === slug && p.isPublished);
    
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      );
    }
    
    // Si la page est protégée par mot de passe, on renvoie la page avec un indicateur
    if (page.isPasswordProtected) {
      return NextResponse.json({
        success: true,
        page: {
          id: page.id,
          title: page.title,
          slug: page.slug,
          isPasswordProtected: true,
          isPublished: page.isPublished,
          content: page.content // On renvoie quand même le contenu pour pouvoir l'afficher après authentification
        }
      });
    }
    
    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Erreur GET /api/page/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { password } = await request.json();
    
    const pages = readPages();
    const page = pages.find(p => p.slug === slug && p.isPublished);
    
    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      );
    }
    
    if (!page.isPasswordProtected) {
      return NextResponse.json({ success: true, page });
    }
    
    if (page.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Erreur POST /api/page/[slug]:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
