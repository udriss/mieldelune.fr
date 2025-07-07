import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Wedding } from '@/lib/dataTemplate';
import { SiteData } from '@/lib/dataSite';

const dataFilePath = path.join(process.cwd(), 'lib/data.json');
const siteDataFilePath = path.join(process.cwd(), 'data/siteData.json');

async function readData(): Promise<{ weddings: Wedding[] }> {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return { weddings: [] };
        }
        console.error('Error reading data file:', error);
        throw error;
    }
}

async function writeData(data: { weddings: Wedding[] }): Promise<void> {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function readSiteData(): Promise<SiteData> {
    try {
        const fileContent = await fs.readFile(siteDataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading site data file:', error);
        // Retourner des valeurs par défaut si le fichier n'existe pas
        return {
            titleSite: '',
            descriptionSite: '',
            showWeddingDescription: true,
            showWeddingLocation: true
        } as SiteData;
    }
}

async function writeSiteData(data: SiteData): Promise<void> {
    await fs.writeFile(siteDataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: Request) {
    try {
        const { showLocation } = await req.json();

        if (typeof showLocation !== 'boolean') {
            return NextResponse.json({ 
                success: false, 
                message: 'Invalid "showLocation" value' 
            }, { status: 400 });
        }

        // Mettre à jour les données des mariages
        const data = await readData();
        const updatedWeddings = data.weddings.map(wedding => ({
            ...wedding,
            showLocation: showLocation,
        }));
        await writeData({ weddings: updatedWeddings });

        // Mettre à jour les paramètres du site
        const siteData = await readSiteData();
        siteData.showWeddingLocation = showLocation;
        await writeSiteData(siteData);

        return NextResponse.json({ 
            success: true, 
            message: 'All locations visibility updated successfully.' 
        });
    } catch (error) {
        console.error('Error in /api/updateAllLocations:', error);
        return NextResponse.json({ 
            success: false, 
            message: 'Internal Server Error' 
        }, { status: 500 });
    }
}
