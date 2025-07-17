import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Wedding, Image } from '../lib/dataTemplate';

const dataFilePath = path.join(process.cwd(), 'lib', 'data.json');
const publicPath = path.join(process.cwd(), 'public');

async function updateImageDimensions() {
  console.log('Starting image dimension update process...');

  try {
    // Read the JSON data file
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data || !Array.isArray(data.weddings)) {
        throw new Error("Invalid data structure in data.json: 'weddings' property is missing or not an array.");
    }
    const weddings: Wedding[] = data.weddings;
    let updatedCount = 0;
    let needsUpdate = false;

    // Create a processing function for an image
    const processImage = async (image: Image): Promise<boolean> => {
      if (image && image.fileUrl && (!image.width || !image.height)) {
        // Construct the full path to the image file
        // The fileUrl is like /1736284401300/1719589638889-6.jpeg, so we remove the leading /
        const imagePath = path.join(publicPath, image.fileUrl.substring(1));
        
        try {
          // Check if the file exists
          await fs.access(imagePath);
          
          // Get dimensions using sharp
          const metadata = await sharp(imagePath).metadata();
          if (metadata.width && metadata.height) {
            image.width = metadata.width;
            image.height = metadata.height;
            console.log(`Updated dimensions for ${image.fileUrl}: ${image.width}x${image.height}`);
            updatedCount++;
            return true; // Indicates an update was made
          }
        } catch (error) {
          console.warn(`Could not process or find image at ${imagePath}. Skipping.`);
        }
      }
      return false; // No update made
    };

    // Iterate over all weddings and their images
    for (const wedding of weddings) {
      // Process cover image
      if (wedding.coverImage) {
        if (await processImage(wedding.coverImage)) {
          needsUpdate = true;
        }
      }
      // Process gallery images
      if (wedding.images && wedding.images.length > 0) {
        for (const image of wedding.images) {
          if (await processImage(image)) {
            needsUpdate = true;
          }
        }
      }
    }

    // If any image was updated, write the new data back to the file
    if (needsUpdate) {
      await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`\nUpdate complete. Found and updated dimensions for ${updatedCount} image(s).`);
      console.log('The file /lib/data.json has been updated.');
    } else {
      console.log('\nNo updates needed. All images already have dimensions.');
    }

  } catch (error) {
    console.error('\nAn error occurred during the update process:', error);
  }
}

updateImageDimensions();
