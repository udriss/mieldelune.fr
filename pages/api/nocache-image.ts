import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileUrl } = req.query;
  
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const imagePath = path.join(process.cwd(), 'public', fileUrl as string);
  const imageBuffer = fs.readFileSync(imagePath);
  
  res.setHeader('Content-Type', 'image/jpeg');
  res.send(imageBuffer);
}