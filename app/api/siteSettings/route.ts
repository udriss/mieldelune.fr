import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SITE_DATA_PATH = path.join(process.cwd(), 'data', 'siteData.json');

// Fonction utilitaire pour lire les données
async function readSiteData() {
  try {
    if (!fs.existsSync(SITE_DATA_PATH)) {
      // Créer le fichier avec des valeurs par défaut si il n'existe pas
      const defaultData = {
        titleSite: '',
        descriptionSite: '',
        primaryColor: '#7c3aed',
        fontFamily: 'Montserrat',
        fontSizePx: 16,
        gradientType: 'linear',
        gradientColors: ['#ff8647', '#7c3aed'],
        gradientAngle: 120,
        gradientCenter: '50% 50%',
        gradientStops: [0, 100],
        dynamicElements: [],
        dynamicElements1: [],
        dynamicElements2: [],
        dynamicElements3: [],
        animationStyles: {
          default: 'fade',
          type1: 'slide',
          type2: 'zoom',
          type3: 'bounce'
        }
      };
      
      // Créer le dossier data s'il n'existe pas
      const dataDir = path.dirname(SITE_DATA_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(SITE_DATA_PATH, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    
    const data = fs.readFileSync(SITE_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture de siteData.json:', error);
    throw error;
  }
}

// Fonction utilitaire pour écrire les données
async function writeSiteData(data: any) {
  try {
    const dataDir = path.dirname(SITE_DATA_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(SITE_DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'écriture de siteData.json:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const siteData = await readSiteData();
    return NextResponse.json({ success: true, site: siteData });
  } catch (error) {
    console.error('Erreur GET /api/siteSettings:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la lecture des paramètres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    // 
    
    // Lire les données actuelles
    const currentData = await readSiteData();
    
    // Fusionner les nouvelles données
    const updatedData = { ...currentData, ...updates };
    
    // Traitement spécial pour les tableaux JSON
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'string') {
        try {
          // Tenter de parser les chaînes JSON pour les tableaux
          if (updates[key].startsWith('[') || updates[key].startsWith('{')) {
            updatedData[key] = JSON.parse(updates[key]);
          }
        } catch (e) {
          // Garder la valeur string si ce n'est pas du JSON valide
          updatedData[key] = updates[key];
        }
      }
    });
    
    // 
    
    // Sauvegarder
    await writeSiteData(updatedData);
    
    return NextResponse.json({ success: true, site: updatedData });
  } catch (error) {
    console.error('Erreur POST /api/siteSettings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour des paramètres',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}