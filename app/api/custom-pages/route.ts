import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CustomPage } from '@/types/customPages';

const CUSTOM_PAGES_FILE = path.join(process.cwd(), 'data', 'customPages.json');

// Créer le fichier s'il n'existe pas
function ensureDataFile() {
  const dataDir = path.dirname(CUSTOM_PAGES_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(CUSTOM_PAGES_FILE)) {
    fs.writeFileSync(CUSTOM_PAGES_FILE, JSON.stringify({ pages: [] }, null, 2));
  }
}

// Lire les pages
function readPages(): CustomPage[] {
  ensureDataFile();
  try {
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
  ensureDataFile();
  try {
    fs.writeFileSync(CUSTOM_PAGES_FILE, JSON.stringify({ pages }, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'écriture du fichier des pages:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const pages = readPages();
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Erreur GET /api/custom-pages:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newPage: CustomPage = await request.json();
    
    // Validation
    if (!newPage.title || !newPage.slug) {
      return NextResponse.json(
        { success: false, error: 'Titre et slug requis' },
        { status: 400 }
      );
    }
    
    const pages = readPages();
    
    // Vérifier l'unicité du slug
    if (pages.some(page => page.slug === newPage.slug)) {
      return NextResponse.json(
        { success: false, error: 'Ce slug est déjà utilisé' },
        { status: 400 }
      );
    }
    
    // Ajouter l'ID et les timestamps si pas présents
    if (!newPage.id) {
      newPage.id = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (!newPage.createdAt) {
      newPage.createdAt = Date.now();
    }
    
    newPage.updatedAt = Date.now();
    
    pages.push(newPage);
    writePages(pages);
    
    return NextResponse.json({ success: true, page: newPage });
  } catch (error) {
    console.error('Erreur POST /api/custom-pages:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la page' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedPage: CustomPage = await request.json();
    
    if (!updatedPage.id) {
      return NextResponse.json(
        { success: false, error: 'ID de page requis' },
        { status: 400 }
      );
    }
    
    const pages = readPages();
    const pageIndex = pages.findIndex(page => page.id === updatedPage.id);
    
    if (pageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier l'unicité du slug (sauf pour la page actuelle)
    if (pages.some(page => page.slug === updatedPage.slug && page.id !== updatedPage.id)) {
      return NextResponse.json(
        { success: false, error: 'Ce slug est déjà utilisé' },
        { status: 400 }
      );
    }
    
    updatedPage.updatedAt = Date.now();
    pages[pageIndex] = updatedPage;
    writePages(pages);
    
    return NextResponse.json({ success: true, page: updatedPage });
  } catch (error) {
    console.error('Erreur PUT /api/custom-pages:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la page' },
      { status: 500 }
    );
  }
}
