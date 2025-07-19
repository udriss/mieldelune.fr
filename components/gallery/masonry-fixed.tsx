import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SwiperGalleryProps } from './SwiperGallery';
import { Masonry } from 'masonic';
import { Box, useMediaQuery } from '@mui/material';
import { Heart } from 'lucide-react';

const getImageUrl = (image: WeddingImage, thumbnail: boolean = true) => {
  if (image.fileType === 'storage') {
    const url = thumbnail && image.fileUrlThumbnail ? 
      image.fileUrlThumbnail : 
      image.fileUrl;
    return `/api/images?fileUrl=${url}`;
  }
  return image.fileUrl;
}

const SwiperGallery = dynamic(() => import('./SwiperGallery'), {
  ssr: false,
}) as React.ComponentType<SwiperGalleryProps>;

export function MasonryGallery({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Filtrer les images pour n'afficher que celles qui sont visibles
  const visibleWeddingImages = useMemo(() => {
    return wedding.images.filter((image: WeddingImage) => image.imageVisibility !== false);
  }, [wedding.images]);

  // Swiper modal state
  const [swiperOpen, setSwiperOpen] = useState(false);
  const [swiperIndex, setSwiperIndex] = useState(0);

  // Function to get caption for each image
  const getImageCaption = (index: number) => {
    // If image has a description and it's visible
    if (visibleWeddingImages[index]?.description && visibleWeddingImages[index]?.descriptionVisibility !== false) {
      return visibleWeddingImages[index].description;
    }
    // For images without description or with hidden description
    return `Moment #${index + 1}`;
  };

  // Prépare les images pour Swiper
  const swiperImages = visibleWeddingImages.map((img, idx) => ({
    src: getImageUrl(img, false),
    thumb: getImageUrl(img, true),
    alt: getImageCaption(idx),
  }));

  return (
    <div className="min-h-screen w-full mt-16">
      <div className="mx-auto py-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <Button
            variant="ghost"
            className="mb-8 rounded-lg p-4 bg-white/20 backdrop-blur-lg shadow-lg hover:bg-white/80"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
        </div>
        
        {/* Header section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {wedding.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">{wedding.date}</p>
        </div>

        {/* Gallery grid */}
        {isMobile ? (
          // Version mobile - une seule colonne avec Masonry
          <div className="w-full p-2">
            <Masonry
              items={visibleWeddingImages.map((image: WeddingImage, index: number) => ({
                id: image.fileUrl,
                image,
                index,
                caption: getImageCaption(index),
                isImageLoading: loadingImages[image.id] !== false
              }))}
              render={({ data }) => {
                const { image, index, caption, isImageLoading } = data;
                
                return (
                  <div style={{ marginBottom: '16px', width: '100%' }}>
                    <div
                      className="cursor-pointer w-full"
                      onClick={() => {
                        setSwiperIndex(index);
                        setSwiperOpen(true);
                      }}
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
                          <img
                            src={getImageUrl(image)}
                            alt={`${wedding.title} - ${caption}`}
                            className="w-full h-full object-cover transition-transform duration-300"
                            loading="lazy"
                            onLoad={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [image.id]: false
                              }));
                            }}
                            onLoadStart={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [image.id]: true
                              }));
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
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
                    </div>
                  </div>
                );
              }}
              columnCount={1}
              columnGutter={16}
            />
          </div>
        ) : (
          // Masonry pour desktop avec Swiper - 2 colonnes
          <div className="w-full p-2">
            <Masonry
              items={visibleWeddingImages.map((image: WeddingImage, index: number) => ({
                id: image.fileUrl, // Use fileUrl as unique identifier like in ThumbnailManager
                image,
                index,
                caption: getImageCaption(index),
                isImageLoading: loadingImages[image.id] !== false
              }))}
              render={({ data }) => {
                const { image, index, caption, isImageLoading } = data;
                
                return (
                  <div style={{ marginBottom: '16px', width: '100%' }}>
                    <div
                      className="cursor-pointer w-full"
                      onClick={() => {
                        setSwiperIndex(index);
                        setSwiperOpen(true);
                      }}
                    >
                      <div className="relative w-full overflow-hidden rounded-[5px]">
                        {/* Conteneur avec aspect-ratio pour éviter le layout shift */}
                        <div
                          className="relative w-full"
                          style={{
                            aspectRatio: image.width && image.height
                              ? `${image.width}/${image.height}`
                              : '3/4', // Fallback ratio
                            width: '100%'
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
                                background: 'rgba(254, 226, 226, 0.2)',
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
                          <img
                            src={getImageUrl(image)}
                            alt={`${wedding.title} - ${caption}`}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            loading="lazy"
                            onLoad={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [image.id]: false
                              }));
                            }}
                            onLoadStart={() => {
                              setLoadingImages(prev => ({
                                ...prev,
                                [image.id]: true
                              }));
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
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
                  </div>
                );
              }}
              columnCount={2}
              columnGutter={16}
            />
            {/* Swiper modal */}
            {swiperOpen && (
              <SwiperGallery
                images={swiperImages}
                initialIndex={swiperIndex}
                onClose={() => setSwiperOpen(false)}
                weddingTitle={wedding.title}
                getImageCaption={getImageCaption}
              />
            )}
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.8) translateY(30px) translateX(0));
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0) translateX(0);
          }
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
