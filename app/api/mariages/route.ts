import { NextResponse } from 'next/server';
import { parseWeddingsData } from '@/lib/utils/data-parser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {    
    // Simpler regex to match the weddings array
    const weddings = await parseWeddingsData();
    
    
    return NextResponse.json({ 
      weddings 
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error loading weddings:', error);
    return NextResponse.json({ 
      error: 'Failed to load weddings' 
    }, { 
      status: 500 
    });
  }
}