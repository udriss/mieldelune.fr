import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, imageId, imageVisibility } = await req.json();

    if (!id || !imageId) {
      return NextResponse.json({ error: 'Paramètres manquants (id ou imageId)' }, { status: 400 });
    }

    // Lecture du fichier de données
    const dataFilePath = path.join(process.cwd(), 'lib', 'data.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Recherche du mariage et de l'image
    const weddingIndex = data.weddings.findIndex((w: any) => w.id == id);
    
    if (weddingIndex === -1) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }
    
    const wedding = data.weddings[weddingIndex];
    const imageIndex = wedding.images.findIndex((img: any) => img.id === imageId);
    
    if (imageIndex === -1) {
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }

    // Mise à jour de la propriété imageVisibility
    wedding.images[imageIndex].imageVisibility = imageVisibility;

    // Sauvegarde des données mises à jour
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la visibilité de l\'image:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}