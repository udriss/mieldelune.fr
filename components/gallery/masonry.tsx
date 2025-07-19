import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SwiperGalleryProps } from './SwiperGallery';
import { Masonry } from 'masonic';

// Custom hook to check for mobile to avoid MUI dependency
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  return isMobile;
};

const getImageUrl = (image: WeddingImage, thumbnail: boolean = true) => {
  if (image.fileType === 'storage') {
    const url = thumbnail && image.fileUrlThumbnail
      ? image.fileUrlThumbnail
      : image.fileUrl;
    return `/api/images?fileUrl=${url}`;
  }
  return image.fileUrl;
};

const SwiperGallery = dynamic(() => import('./SwiperGallery'), {
  ssr: false,
}) as ComponentType<SwiperGalleryProps>;

export function MasonryGallery({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const visibleWeddingImages = useMemo(() => {
    return wedding.images.filter((image: WeddingImage) => image.imageVisibility !== false);
  }, [wedding.images]);

  const [swiperOpen, setSwiperOpen] = useState(false);
  const [swiperIndex, setSwiperIndex] = useState(0);

  const getImageCaption = (index: number) => {
    if (visibleWeddingImages[index]?.description && visibleWeddingImages[index]?.descriptionVisibility !== false) {
      return visibleWeddingImages[index].description;
    }
    return `Moment #${index + 1}`;
  };

  const swiperImages = useMemo(() => visibleWeddingImages.map((img, idx) => ({
    src: getImageUrl(img, false),
    thumb: getImageUrl(img, true),
    alt: getImageCaption(idx),
  })), [visibleWeddingImages]);

  // A simplified card component to ensure the image displays correctly.
  const MasonryCard = ({ data: image, index }: { data: WeddingImage, index: number }) => {
    return (
      <div
        className="cursor-pointer"
        onClick={() => {
          setSwiperIndex(index);
          setSwiperOpen(true);
        }}
      >
        <img
          src={getImageUrl(image, true)}
          alt={getImageCaption(index)}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '8px',
          }}
        />
      </div>
    );
  };

  return (
    <div className="w-full p-4 box-border">
      <div className="relative mb-4 flex items-center justify-center">
        <Button
          onClick={() => router.back()}
          className="absolute left-0"
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-center px-16">{wedding.title}</h1>
      </div>

      <Masonry
        items={visibleWeddingImages}
        render={MasonryCard}
        columnCount={isMobile ? 1 : 2}
        columnGutter={16}
        overscanBy={5}
      />

      {swiperOpen && (
        <SwiperGallery
          images={swiperImages}
          initialIndex={swiperIndex}
          onClose={() => setSwiperOpen(false)}
        />
      )}
    </div>
  );
}

