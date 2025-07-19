import LightGallery from 'lightgallery/react';
import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SwiperGalleryProps } from './SwiperGallery';
import { Masonry } from 'masonic';
import { Heart } from 'lucide-react';
import { Box } from '@mui/material';

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
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});

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
    <div className="min-h-screen w-full mt-16">
      <div className="mx-auto py-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            className="mb-8 rounded-lg p-4 bg-white/20 backdrop-blur-lg shadow-lg hover:bg-white/80"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {wedding.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">{wedding.date}</p>
        </div>

        {/* Gallery */}
        {isMobile ? (
          // LightGallery pour mobile
          <div className="gallery-container max-w-[1200px] mx-auto">
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
              <div className="grid grid-cols-1 gap-4 p-4">
                {visibleWeddingImages.map((image: WeddingImage, index: number) => {
                  const isImageLoading = loadingImages[image.id] !== false;
                  const caption = getImageCaption(index);

                  return (
                    <div key={image.id}>
                      <a
                        className="gallery-item block cursor-pointer"
                        data-src={getImageUrl(image, false)}
                        data-sub-html={`<h4>${caption}</h4><p>${wedding.title}</p>`}
                        data-facebook-title={`${wedding.title} - ${caption}`}
                        data-twitter-title={`${wedding.title} - ${caption}`}
                        data-pinterest-text={`${wedding.title} - ${caption}`}
                      >
                        <div className="relative w-full overflow-hidden rounded-lg">
                          <div
                            className="relative w-full"
                            style={{
                              aspectRatio: image.width && image.height
                                ? `${image.width}/${image.height}`
                                : '3/4'
                            }}
                          >
                            {isImageLoading && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'linear-gradient(to top right, rgba(251, 207, 232, 0.3), rgba(199, 210, 254, 0.3))',
                                  backdropFilter: 'blur(16px)',
                                  zIndex: 1
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
                            <LazyLoadImage
                              src={getImageUrl(image)}
                              alt={`${wedding.title} - ${caption}`}
                              className="w-full h-full object-cover transition-transform duration-300"
                              effect="blur"
                              placeholder={
                                <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                                  <Heart className="text-red-300 animate-pulse w-12 h-12" />
                                </div>
                              }
                              onLoad={() => {
                                setLoadingImages(prev => ({
                                  ...prev,
                                  [image.id]: false
                                }));
                              }}
                              beforeLoad={() => {
                                setLoadingImages(prev => ({
                                  ...prev,
                                  [image.id]: true
                                }));
                              }}
                            />
                            {/* Caption overlay on hover - only show if description is visible */}
                            {visibleWeddingImages[index]?.descriptionVisibility !== false && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                  <h3 className="text-lg font-semibold">{caption}</h3>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    </div>
                  );
                })}
              </div>
            </LightGallery>
          </div>
        ) : (
          // Masonry pour desktop
          <div className="w-full p-4 box-border max-w-[2800px] mx-auto">
            <Masonry
              items={visibleWeddingImages}
              render={MasonryCard}
              columnCount={2}
              columnGutter={16}
              overscanBy={5}
            />
          </div>
        )}

        {swiperOpen && !isMobile && (
          <SwiperGallery
            images={swiperImages}
            initialIndex={swiperIndex}
            onClose={() => setSwiperOpen(false)}
          />
        )}
      </div>

      <style jsx global>{`
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

