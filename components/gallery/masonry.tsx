import LightGallery from 'lightgallery/react';
import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SwiperGalleryProps } from './SwiperGallery';
import { Masonry } from 'masonic';

// Plugins for LightGallery
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgShare from 'lightgallery/plugins/share';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgPager from 'lightgallery/plugins/pager';

// Styles
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-share.css';
import 'lightgallery/css/lg-autoplay.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lg-pager.css';

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
    if (isMobile) {
      // Pour mobile, retourner un élément LightGallery
      return (
        <div className="mb-4">
          <a
            className="gallery-item block cursor-pointer"
            data-src={getImageUrl(image, false)}
            data-sub-html={`<h4>${getImageCaption(index)}</h4><p>${wedding.title}</p>`}
            data-facebook-title={`${wedding.title} - ${getImageCaption(index)}`}
            data-twitter-title={`${wedding.title} - ${getImageCaption(index)}`}
            data-pinterest-text={`${wedding.title} - ${getImageCaption(index)}`}
          >
            <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src={getImageUrl(image, true)}
                alt={getImageCaption(index)}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  aspectRatio: image.width && image.height 
                    ? `${image.width}/${image.height}` 
                    : '3/4'
                }}
                loading="lazy"
              />
              
              {/* Overlay avec caption au hover */}
              {visibleWeddingImages[index]?.descriptionVisibility !== false && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-sm font-semibold">{getImageCaption(index)}</h3>
                  </div>
                </div>
              )}
            </div>
          </a>
        </div>
      );
    }

    // Pour desktop, retourner l'élément Swiper classique
    return (
      <div
        className="cursor-pointer mb-4"
        onClick={() => {
          setSwiperIndex(index);
          setSwiperOpen(true);
        }}
      >
        <div className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <img
            src={getImageUrl(image, true)}
            alt={getImageCaption(index)}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              aspectRatio: image.width && image.height 
                ? `${image.width}/${image.height}` 
                : '3/4' // ratio par défaut
            }}
            loading="lazy"
            onLoad={(e) => {
              // Force reflow to ensure masonry recalculates
              const target = e.target as HTMLImageElement;
              target.style.visibility = 'visible';
            }}
            onError={(e) => {
              console.error('Error loading image:', getImageUrl(image, true));
            }}
          />
          
          {/* Overlay avec caption au hover */}
          {visibleWeddingImages[index]?.descriptionVisibility !== false && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-sm font-semibold">{getImageCaption(index)}</h3>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen">
      <div className="relative mb-4 flex items-center justify-center p-4">
        <Button
          onClick={() => router.back()}
          className="absolute left-4"
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-center px-16">{wedding.title}</h1>
      </div>

      <div className="w-full masonic-container px-4" style={{ minHeight: '400px' }}>
        {isMobile ? (
          // LightGallery wrapper pour mobile
          <LightGallery
            selector=".gallery-item"
            plugins={[lgZoom, lgThumbnail, lgShare, lgAutoplay, lgFullscreen]}
            mode="lg-fade"
            speed={500}
            counter={true}
            download={false}
            autoplay={false}
            zoom={true}
            thumbnail={true}
            slideShowInterval={3000}
            progressBar={true}
          >
            <Masonry
              items={visibleWeddingImages}
              render={MasonryCard}
              columnCount={1}
              columnGutter={16}
              overscanBy={5}
            />
          </LightGallery>
        ) : (
          // Masonry classique pour desktop
          <Masonry
            items={visibleWeddingImages}
            render={MasonryCard}
            columnCount={2}
            columnGutter={16}
            overscanBy={5}
          />
        )}
      </div>

      {swiperOpen && !isMobile && (
        <SwiperGallery
          images={swiperImages}
          initialIndex={swiperIndex}
          onClose={() => setSwiperOpen(false)}
        />
      )}
      
      <style jsx global>{`
        /* Styles pour masonic */
        .masonic-container {
          width: 100%;
        }
        
        .masonic-container img {
          transition: transform 0.3s ease;
        }
        
        .masonic-container img:hover {
          transform: scale(1.02);
        }

        /* Fix pour LightGallery */
        .lg-backdrop {
          z-index: 1050;
        }
        .lg-outer {
          z-index: 1060;
        }

        /* Amélioration des transitions LightGallery */
        .lg-css3.lg-fade .lg-item {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        
        .lg-css3.lg-fade .lg-item.lg-current {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

