import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const { weddingId, field, value } = await request.json();
        
        if (!weddingId || !field || typeof value !== 'boolean') {
            return NextResponse.json({ 
                success: false, 
                message: 'weddingId, field et value (boolean) sont requis' 
            }, { status: 400 });
        }

        if (field !== 'showDescription' && field !== 'showLocation') {
            return NextResponse.json({ 
                success: false, 
                message: 'Le champ doit être showDescription ou showLocation' 
            }, { status: 400 });
        }

        const dataPath = join(process.cwd(), 'lib', 'data.json');
        const siteDataPath = join(process.cwd(), 'data', 'siteData.json');
        
        // Lire et parser data.json
        const dataContent = readFileSync(dataPath, 'utf8');
        const data = JSON.parse(dataContent);
        
        // Trouver et mettre à jour le wedding spécifique
        const weddingIndex = data.weddings.findIndex((w: any) => w.id == weddingId);
        
        if (weddingIndex === -1) {
            return NextResponse.json({ 
                success: false, 
                message: 'Mariage non trouvé' 
            }, { status: 404 });
        }

        // Mettre à jour la propriété spécifique
        data.weddings[weddingIndex][field] = value;
        
        // Écrire data.json
        writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        // Lire et mettre à jour siteData.json si nécessaire
        try {
            const siteDataContent = readFileSync(siteDataPath, 'utf8');
            const siteData = JSON.parse(siteDataContent);
            
            if (siteData.weddings) {
                const siteWeddingIndex = siteData.weddings.findIndex((w: any) => w.id == weddingId);
                if (siteWeddingIndex !== -1) {
                    siteData.weddings[siteWeddingIndex][field] = value;
                    writeFileSync(siteDataPath, JSON.stringify(siteData, null, 2));
                }
            }
        } catch (siteDataError) {
            // Si siteData.json n'existe pas ou a un problème, on continue quand même
            console.warn('Erreur lors de la mise à jour de siteData.json:', siteDataError);
        }

        return NextResponse.json({
            success: true,
            message: `${field} mis à jour pour le mariage ${weddingId}`,
            updatedWedding: data.weddings[weddingIndex]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Erreur interne du serveur' 
        }, { status: 500 });
    }
}
