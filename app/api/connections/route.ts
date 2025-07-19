import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Connection, PageVisit } from '@/types/connections';

const CONNECTIONS_FILE_PATH = path.join(process.cwd(), 'data', 'connections.json');

async function readConnections(): Promise<Connection[]> {
  try {
    await fs.access(CONNECTIONS_FILE_PATH);
    const data = await fs.readFile(CONNECTIONS_FILE_PATH, 'utf-8');
    if (data.trim() === '') return [];
    return JSON.parse(data) as Connection[];
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

async function writeConnections(connections: Connection[]): Promise<void> {
  await fs.writeFile(CONNECTIONS_FILE_PATH, JSON.stringify(connections, null, 2), 'utf-8');
}

// POST - Ajouter une nouvelle connexion
export async function POST(request: NextRequest) {
  try {
    const newConnectionData: Partial<Connection> & { id: string } = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';

    if (!newConnectionData.id || !newConnectionData.deviceInfo) {
      return NextResponse.json({ message: 'Invalid connection data' }, { status: 400 });
    }

    const connections = await readConnections();
    const existingConnectionIndex = connections.findIndex(c => c.id === newConnectionData.id);

    if (existingConnectionIndex !== -1) {
      // Update existing connection
      const existingConnection = connections[existingConnectionIndex];
      
      // Ne pas écraser les pages visitées existantes
      const updatedConnection: Connection = {
        ...existingConnection,
        deviceInfo: {
            ...existingConnection.deviceInfo,
            ...newConnectionData.deviceInfo,
            userIp: ip,
        },
        lastActivity: Date.now(),
        isActive: true,
      };

      // Fusionner les pages visitées
      if (newConnectionData.pagesVisited && newConnectionData.pagesVisited.length > 0) {
        const newVisit = newConnectionData.pagesVisited[0];
        const existingPages = updatedConnection.pagesVisited || [];
        
        // Ajouter la nouvelle visite à l'historique existant
        updatedConnection.pagesVisited = [...existingPages, newVisit];
      }

      connections[existingConnectionIndex] = updatedConnection;

    } else {
      // Add new connection
      const connectionToAdd: Connection = {
        timestamp: Date.now(),
        ...newConnectionData,
        deviceInfo: {
            ...newConnectionData.deviceInfo,
            userIp: ip,
        },
        lastActivity: Date.now(),
        isActive: true,
      } as Connection;
      connections.push(connectionToAdd);
    }

    await writeConnections(connections);

    return NextResponse.json({ message: 'Connection tracked' }, { status: 200 });
  } catch (error) {
    console.error('Error tracking connection:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - Récupérer toutes les connexions
export async function GET() {
  try {
    const connections = await readConnections();
    const now = Date.now();
    
    // Update isActive status and calculate session duration before returning
    const updatedConnections = connections.map(conn => {
        const isActive = conn.lastActivity ? (now - conn.lastActivity < 5 * 60 * 1000) : false; // 5 minutes activity window
        const sessionDuration = conn.pagesVisited && conn.pagesVisited.length > 0
            ? Math.max(...conn.pagesVisited.map(p => p.timestamp)) - Math.min(...conn.pagesVisited.map(p => p.timestamp))
            : 0;

        return {
            ...conn,
            isActive,
            sessionDuration
        };
    }).sort((a, b) => b.timestamp - a.timestamp);
    
    return NextResponse.json(updatedConnections, { status: 200 });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
