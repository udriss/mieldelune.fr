import { NextRequest, NextResponse } from 'next/server';
import type { Wedding } from '@/lib/dataTemplate';
import type { RouteParams } from './types';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const weddings = await parseWeddingsData();

    const wedding = weddings.find((w: Wedding) => w.id === parseInt(id));
    if (!wedding) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    return NextResponse.json(wedding);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const weddings = await parseWeddingsData();

    const updatedWedding = await request.json();
    const index = weddings.findIndex(w => w.id === parseInt(id));
    
    if (index === -1) {
      return NextResponse.json({ message: 'Wedding not found' }, { status: 404 });
    }

    weddings[index] = { ...weddings[index], ...updatedWedding };
    
    // Save to JSON file
    await updateWeddingsData(weddings);
    
    return NextResponse.json(weddings[index]);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}