export interface Image {
  id: string;
  fileUrl: string;
  fileType: 'link' | 'storage' | 'coverLink' | 'coverStorage';
  fileUrlThumbnail?: string;
  description?: string;
  descriptionVisibility?: boolean;
  imageVisibility?: boolean;
}

export interface Wedding {
  id: number;
  folderId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  coverImage: Image | null;
  images: Image[];
  visible: boolean;
  showLocation?: boolean;
  showDescription?: boolean;
  templateType?: 'timeline' | 'masonry' | 'grid';
}

export interface Data {
  weddings: Wedding[];
}
