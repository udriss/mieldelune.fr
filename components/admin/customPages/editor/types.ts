export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  isPasswordProtected: boolean;
  password?: string;
  isPublished: boolean;
  isRandomSlug: boolean;
  showTitle?: boolean;
  titleSettings?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
    color?: string;
  };
  content: ContentElement[];
  createdAt: number;
  updatedAt: number;
}

export interface ContentElement {
  id: string;
  type: 'title' | 'text' | 'image' | 'video';
  content: string;
  order: number;
  settings?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    width?: string | '100%' | '50%';
    height?: string;
    alt?: string;
    autoplay?: boolean;
    controls?: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
    color?: string;
  };
}
