import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CONNECTIONS_FILE_PATH = path.join(process.cwd(), 'data', 'connections.json');

interface ConnectionEntry {
  id: string;
  timestamp: number;
  date: string;
  userAgent?: string;
  ip?: string;
  referer?: string;
}

// Fonction pour s'assurer que le fichier existe
async function ensureFileExists() {
  try {
    await fs.access(CONNECTIONS_FILE_PATH);
  } catch {
    // Le fichier n'existe pas, on le crée avec un tableau vide
    await fs.writeFile(CONNECTIONS_FILE_PATH, '[]', 'utf-8');
  }
}

// GET - Récupérer toutes les connexions
export async function GET() {
  try {
    await ensureFileExists();
    const data = await fs.readFile(CONNECTIONS_FILE_PATH, 'utf-8');
    const connections: ConnectionEntry[] = JSON.parse(data);
    
    return NextResponse.json({
      success: true,
      connections: connections.sort((a, b) => b.timestamp - a.timestamp) // Trier par date décroissante
    });
  } catch (error) {
    console.error('Erreur lors de la lecture des connexions:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la lecture des connexions'
    }, { status: 500 });
  }
}

// POST - Ajouter une nouvelle connexion
export async function POST(request: NextRequest) {
  try {
    await ensureFileExists();
    
    // Lire le corps de la requête
    const body = await request.json();
    
    // Extraire les informations de la requête
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const referer = request.headers.get('referer') || '';
    
    // Créer une nouvelle entrée de connexion
    const newConnection: ConnectionEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
      userAgent,
      ip,
      referer,
      ...body // Inclure d'autres données envoyées par le client
    };
    
    // Lire les connexions existantes
    const data = await fs.readFile(CONNECTIONS_FILE_PATH, 'utf-8');
    const connections: ConnectionEntry[] = JSON.parse(data);
    
    // Ajouter la nouvelle connexion
    connections.push(newConnection);
    
    // Limiter le nombre de connexions stockées (optionnel)
    const maxConnections = 1000;
    if (connections.length > maxConnections) {
      connections.splice(0, connections.length - maxConnections);
    }
    
    // Sauvegarder les connexions mises à jour
    await fs.writeFile(CONNECTIONS_FILE_PATH, JSON.stringify(connections, null, 2), 'utf-8');
    
    return NextResponse.json({
      success: true,
      message: 'Connexion enregistrée avec succès',
      connectionId: newConnection.id
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la connexion:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'enregistrement de la connexion'
    }, { status: 500 });
  }
}
