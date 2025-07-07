export const dataTemplate = `
// ICI

export interface Image {
  id: string;
  fileUrl: string;
  fileType: 'link' | 'storage' | 'coverLink' | 'coverStorage';
  fileUrlThumbnail?: string;
  description?: string;
}

export interface Wedding {
  id: number;
  folderId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  visible: boolean; 
  images: Image[];
  coverImage?: Image;
}

  export const weddings: Wedding[] = __WEDDINGS__;

`;