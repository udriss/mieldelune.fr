import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Wedding } from '@/lib/dataTemplate';
import { Profile } from '@/lib/dataProfil';
import { SiteData } from '@/lib/dataSite';
import { dataTemplateSite } from '@/lib/data-template-site';
import { dataTemplateProfile } from '@/lib/data-template-profil';
import { promises } from 'fs';


const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'data.json');
const SITE_DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'siteData.json');

export async function parseWeddingsData(): Promise<Wedding[]> {
  try {
    const jsonData = await promises.readFile(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(jsonData);
    return data.weddings;
  } catch (error) {
    console.error('Error reading weddings data:', error);
    return [];
  }
}

export async function updateWeddingsData(weddings: Wedding[]): Promise<void> {
  try {
    const jsonData = JSON.stringify({ weddings }, null, 2);
    await promises.writeFile(DATA_FILE_PATH, jsonData, 'utf8');
  } catch (error) {
    console.error('Error updating weddings data:', error);
    throw new Error('Failed to update weddings data');
  }
}

export async function parseProfileData(): Promise<Profile> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'dataProfil.ts');
    const fileContent = await readFile(filePath, 'utf8');

    const match = fileContent.match(/export\s+const\s+profile:\s*Profile\s*=\s*({[\s\S]*?});/);
    if (!match) throw new Error('Profile data not found');

    let cleanedJson = match[1]
      .replace(/\n/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/'/g, "\\'") // Escape single quotes first
      .replace(/(\{|,)\s*([a-zA-Z0-9_]+)\s*:\s*/g, '$1"$2":')
      // Handle string values with proper escaping
      .replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
        return `"${content.replace(/"/g, '\\"').replace(/\\'/g, "'")}"`;
      })
      .trim();

    //
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Error parsing profile data:', error);
    throw error;
  }
}

export const updateProfileData = async (profile: Profile): Promise<void> => {
  try {
    const dataFilePath = path.join(process.cwd(), 'lib', 'dataProfil.ts');

    // Use template to create updated content
    const updatedContent = dataTemplateProfile.replace(
      '__PROFILE__',
      JSON.stringify(profile, null, 2)
    );

    // Write back to file
    await writeFile(dataFilePath, updatedContent, 'utf8');
  } catch (error) {
    console.error('Error updating profile data:', error);
    throw error;
  }
};


export const parseSiteData = async (): Promise<SiteData> => {
  try {
    const fileContent = await promises.readFile(SITE_DATA_FILE_PATH, 'utf8');
    const parsedData = JSON.parse(fileContent);
    
    // Vérifier et corriger la structure de animationStyles si nécessaire
    if (parsedData.animationStyles && typeof parsedData.animationStyles === 'string') {
      try {
        // Si animationStyles est une chaîne JSON, tenter de la parser
        parsedData.animationStyles = JSON.parse(parsedData.animationStyles);
      } catch (e) {
        // Si le parsing échoue, définir une valeur par défaut
        console.warn('animationStyles was a string but not valid JSON, using default values');
        parsedData.animationStyles = {
          default: 'fade',
          type1: 'slide',
          type2: 'zoom',
          type3: 'bounce'
        };
      }
    } else if (!parsedData.animationStyles) {
      // Si animationStyles est absent, définir une valeur par défaut
      parsedData.animationStyles = {
        default: 'fade',
        type1: 'slide',
        type2: 'zoom',
        type3: 'bounce'
      };
    }
    
    return parsedData as SiteData;
  } catch (error) {
    console.error('Error parsing site data from JSON:', error);
    throw error;
  }
};

export const updateSiteData = async (site: SiteData): Promise<void> => {
  try {
    // Vérifier et corriger les objets complexes avant de les sérialiser
    const siteToSave: SiteData = { ...site };
    
    // Assurer que animationStyles a la bonne structure
    if (siteToSave.animationStyles) {
      // Si c'est une chaîne, tenter de la parser
      if (typeof siteToSave.animationStyles === 'string') {
        try {
          siteToSave.animationStyles = JSON.parse(siteToSave.animationStyles as unknown as string);
        } catch (e) {
          console.warn('String animationStyles could not be parsed, using default');
          siteToSave.animationStyles = {
            default: 'fade',
            type1: 'slide',
            type2: 'zoom',
            type3: 'bounce'
          };
        }
      } 
      
      // Vérifier si toutes les propriétés nécessaires sont présentes
      const expectedKeys = ['default', 'type1', 'type2', 'type3'];
      // Utiliser une vérification supplémentaire pour s'assurer que l'objet est défini
      const actualKeys = siteToSave.animationStyles ? Object.keys(siteToSave.animationStyles) : [];
      
      for (const key of expectedKeys) {
        if (!actualKeys.includes(key)) {
          // S'assurer que animationStyles est un objet avant d'y accéder
          if (!siteToSave.animationStyles || typeof siteToSave.animationStyles !== 'object') {
            siteToSave.animationStyles = {
              default: 'fade',
              type1: 'slide',
              type2: 'zoom',
              type3: 'bounce'
            };
          }
          
          (siteToSave.animationStyles as any)[key] = key === 'default' ? 'fade' : 
                                                    key === 'type1' ? 'slide' : 
                                                    key === 'type2' ? 'zoom' : 'bounce';
        }
      }
    } else {
      // Si animationStyles est absent, définir une valeur par défaut
      siteToSave.animationStyles = {
        default: 'fade',
        type1: 'slide',
        type2: 'zoom',
        type3: 'bounce'
      };
    }
    
    // Format JSON with indentation for better readability
    const jsonData = JSON.stringify(siteToSave, null, 2);
    
    // Write directly to the JSON file
    await promises.writeFile(SITE_DATA_FILE_PATH, jsonData, 'utf8');
  } catch (error) {
    console.error('Error updating site data JSON:', error);
    throw error;
  }
};


export interface SocialMediaLink {
  icon: string;
  href: string;
  label: string;
  hoverColor: string;
  hoverIcon?: string;
  showed: boolean;
}

export interface SocialMediaData {
  [key: string]: SocialMediaLink;
}

export async function parseSocialMediaData(): Promise<SocialMediaData> {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'socialLinkData.json');
    const fileContent = await readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error parsing social media data:', error);
    throw error;
  }
}

export const updateSocialMediaData = async (socialData: SocialMediaData): Promise<void> => {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'socialLinkData.json');
    await writeFile(filePath, JSON.stringify(socialData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error updating social media data:', error);
    throw error;
  }
};