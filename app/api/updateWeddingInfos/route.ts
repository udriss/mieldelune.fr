import { NextResponse } from 'next/server';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import type { Wedding } from '@/lib/dataTemplate';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Extraire les données de la requête
    const data = await req.json();
    const { id, title, date, location, description, templateType, showLocation, showDescription } = data;
    
    // Charger les données existantes
    const weddings = await parseWeddingsData();
    
    // Trouver le mariage à mettre à jour
    const weddingIndex = weddings.findIndex((w: Wedding) => Number(w.id) === Number(id));
    
    if (weddingIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mariage non trouvé' 
      }, { 
        status: 404 
      });
    }
    
    // Mettre à jour les informations
    const updatedWedding = {
      ...weddings[weddingIndex],
      title: title !== undefined ? title : weddings[weddingIndex].title,
      date: date !== undefined ? date : weddings[weddingIndex].date,
      location: location !== undefined ? location : weddings[weddingIndex].location,
      description: description !== undefined ? description : weddings[weddingIndex].description,
      templateType: templateType || weddings[weddingIndex].templateType || 'masonry',
      showLocation: showLocation !== undefined ? showLocation : weddings[weddingIndex].showLocation,
      showDescription: showDescription !== undefined ? showDescription : weddings[weddingIndex].showDescription
    };
    
    // Remplacer le mariage dans le tableau
    const updatedWeddings = [...weddings];
    updatedWeddings[weddingIndex] = updatedWedding;
    
    // Sauvegarder les modifications
    await updateWeddingsData(updatedWeddings);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Informations du mariage mises à jour avec succès',
      wedding: updatedWedding
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations du mariage:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Échec de la mise à jour des informations du mariage' 
    }, { 
      status: 500 
    });
  }
}