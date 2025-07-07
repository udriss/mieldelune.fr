import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const generateThumbnailPath = (fileUrl: string, folderId: string) => {
  const fileName = fileUrl.split('/').pop() || '';
  return `/${folderId}/thumbnails/${fileName.replace('.jpg', '_THUMBEL.jpg')}`;
}