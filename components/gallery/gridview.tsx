import { useEffect, useState } from 'react';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-share.css';
import 'lightgallery/css/lg-autoplay.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-pager.css';

// Import plugins
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import lgShare from 'lightgallery/plugins/share';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgPager from 'lightgallery/plugins/pager';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

import { Wedding } from '@/lib/dataTemplate';
import { loadImage, getImageSrcSet } from '@/components/gallery2/imageLoader';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Skeleton, Box } from '@mui/material';
import { Loader2 } from "lucide-react";

interface WeddingGallery2Props {
  wedding: Wedding;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
  </div>
);

export function GridView({ wedding }: WeddingGallery2Props) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});

  const onInit = () => {
    // 
  };

  useEffect(() => {
    if (wedding?.images) {
      // Initialiser tous les états de chargement comme true (en chargement)
      const initialLoadingState: { [key: string]: boolean } = {};
      wedding.images.forEach((image) => {
        initialLoadingState[image.id] = true;
        
        loadImage(
          image.fileUrl,
          () => setLoadedImages((prev) => new Set(prev).add(image.fileUrl)),
          () => console.error(`Failed to load image: ${image.fileUrl}`)
        );
      });
      setLoadingImages(initialLoadingState);
    }
    setIsLoading(false);
  }, [wedding]);

  const getImageUrl = (image: any, thumbnail: boolean = true) => {
    if (image.fileType === 'storage') {
      const url = thumbnail && image.fileUrlThumbnail ? 
        image.fileUrlThumbnail : 
        image.fileUrl;
      return `/api/images?fileUrl=${url}`;
    }
    return image.fileUrl;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <LightGallery
        onInit={onInit}
        speed={500}
        plugins={[
          lgThumbnail,
          lgZoom,
          lgShare,
          lgAutoplay,
          lgPager,
          lgFullscreen
        ]}
        elementClassNames="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
      >
        {wedding?.images?.map((image, index) => {
          const isImageLoading = loadingImages[image.id] !== false;
          
          return (
            <a
              key={index}
              data-src={getImageUrl(image, false)}
              className="gallery-item relative overflow-hidden rounded-lg inline-block mb-4 w-full"
              data-sub-html={`<h4>${wedding.title} - Photo ${index + 1}</h4>`}
              data-facebook-title={`${wedding.title} - Photo ${index + 1}`}
              data-twitter-title={`${wedding.title} - Photo ${index + 1}`}
              data-pinterest-text={`${wedding.title} - Photo ${index + 1}`}
            >
              <div className="relative w-full overflow-hidden rounded-lg">
                {isImageLoading && (
                  <Box 
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(254, 226, 226, 0.2)',
                      backdropFilter: 'blur(16px)',
                      minWidth: '100px',
                      minHeight: '100px'
                    }}
                  >
                    <Heart
                      className="text-red-400 animate-pulse"
                      style={{
                        width: '80%',
                        height: '80%'
                      }}
                    />
                  </Box>
                )}
                <Image
                  alt={`Wedding photo ${index + 1}`}
                  src={getImageUrl(image)}
                  width={400}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`w-full object-cover transition-opacity duration-500 ${
                    !isImageLoading ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    aspectRatio: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  priority={index < 6}
                  loading={index < 6 ? 'eager' : 'lazy'}
                  onLoad={() => {
                    setLoadingImages(prev => ({
                      ...prev,
                      [image.id]: false
                    }));
                    setLoadedImages((prev) => new Set(prev).add(image.fileUrl));
                  }}
                />
              </div>
            </a>
          );
        })}
      </LightGallery>
      <style jsx global>{`
        @keyframes wave {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}