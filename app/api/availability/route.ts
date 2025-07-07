import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data/availability.json');

async function readData() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // Si le fichier n'existe pas, on retourne un objet par défaut
    return { unavailableDates: [] };
  }
}

async function writeData(data: any) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la lecture des disponibilités.", success: false }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { unavailableDates } = await req.json();
    if (!Array.isArray(unavailableDates)) {
      return NextResponse.json({ message: "Les données fournies sont invalides.", success: false }, { status: 400 });
    }

    const currentData = await readData();
    currentData.unavailableDates = unavailableDates;
    await writeData(currentData);

    return NextResponse.json({ message: "Disponibilités mises à jour avec succès.", success: true });
  } catch (error) {
    return NextResponse.json({ message: "Erreur lors de la mise à jour des disponibilités.", success: false }, { status: 500 });
  }
}
