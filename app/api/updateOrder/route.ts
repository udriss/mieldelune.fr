import { NextResponse } from 'next/server';
import { parseWeddingsData, updateWeddingsData } from '@/lib/utils/data-parser';
import { Wedding } from '@/lib/dataTemplate';

// Gestion de la requête GET
export async function GET() {
    try {
        const weddings = await parseWeddingsData();
        return NextResponse.json(weddings);
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to load weddings data.' },
            { status: 500 }
        );
    }
}

// Gestion de la requête POST
export async function POST(request: Request) {
    try {
        const updatedItems: { oldId: number; newId: number }[] = await request.json();
        const weddings = await parseWeddingsData();
        //
        const updatedWeddings: Wedding[] = weddings.map(wedding => {
            const updatedItem = updatedItems.find(item => item.oldId === Number(wedding.id));
            //
            return updatedItem ? { ...wedding, id: updatedItem.newId } : wedding;
        });
        

        await updateWeddingsData(updatedWeddings);
        return NextResponse.json(
            { message: 'Weddings order updated successfully.', updatedWeddings },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: 'Failed to update weddings data.' },
            { status: 500 }
        );
    }
}