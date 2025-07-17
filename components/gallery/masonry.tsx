import LightGallery from 'lightgallery/react';
import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Loader2 } from "lucide-react";
import Masonry from 'react-masonry-css';
import { Skeleton, Box } from '@mui/material';
import { Heart } from 'lucide-react';



// Plugins
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


  const getImageUrl = (image: WeddingImage, thumbnail: boolean = true) => {
    if (image.fileType === 'storage') {
      const url = thumbnail && image.fileUrlThumbnail ? 
        image.fileUrlThumbnail : 
        image.fileUrl;
      return `/api/images?fileUrl=${url}`;
    }
    return image.fileUrl;
  }

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
  </div>
);

interface AdditionalShareOption {
  selector: string;
  dropdownHTML: string;
  generateLink: (galleryItem: any) => string;
}

interface SharePluginStrings {
  share: string;
}

interface SocialSettings {
  share: boolean;
  facebook: boolean;
  facebookDropdownText: string;
  twitter: boolean;
  twitterDropdownText: string;
  intagram: boolean;
  intagramDropdownText: string;
  pinterest: boolean;
  pinterestDropdownText: string;
  additionalShareOptions: AdditionalShareOption[];
  sharePluginStrings: SharePluginStrings;
}

const socialSettings: SocialSettings = {
  share: true,
  facebook: true,
  facebookDropdownText: 'Facebook',
  twitter: true, 
  intagram: true,
  intagramDropdownText: 'Instagram',
  twitterDropdownText: 'X',
  pinterest: true,
  pinterestDropdownText: 'Pinterest',
  additionalShareOptions: [],
  sharePluginStrings: {
    share: 'Partager'
  }
};

export function MasonryGallery({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});

  // Filtrer les images pour n'afficher que celles qui sont visibles
  const visibleWeddingImages = useMemo(() => {
    return wedding.images.filter(image => image.imageVisibility !== false);
  }, [wedding.images]);

  // Function to get caption for each image
  const getImageCaption = (index: number) => {
    // If image has a description and it's visible
    if (visibleWeddingImages[index]?.description && visibleWeddingImages[index]?.descriptionVisibility !== false) {
      return visibleWeddingImages[index].description;
    }
    
    // For images without description or with hidden description
    return `Moment #${index + 1}`;
  };

  return (
    <div className="min-h-screen  w-full mt-16 ">
      <div className="mx-auto py-8 flex flex-col items-center justify-center">
      <div className=" flex flex-col items-center justify-center">
      <Button
            variant="ghost"
            className="mb-8 rounded-lg p-4 bg-white/20 backdrop-blur-lg shadow-lg hover:bg-white/80 "
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
      
        <div className="max-w-[2800px] flex justify-center items-center mx-auto">
       
          <LightGallery
            selector=".gallery-item"
            // lgPager supprimé car trop dense
            plugins={[lgZoom, lgThumbnail, lgShare, lgAutoplay, lgFullscreen]}
            speed={300}
            mode="lg-fade"
            elementClassNames="flex justify-center items-center"
            counter={true}
            download={false}
            autoplay={true}
            zoom={true}
            thumbnail={true}
            slideShowInterval={1000}
            progressBar={false}
          >
            <Masonry
            breakpointCols={{
              default: 2,
              1100: 2,
              700: 2,
              500: 1
            }}
            className="masonry-grid p-4"
            columnClassName="masonry-grid_column"
            >
            {visibleWeddingImages.map((image, index) => {
              const isImageLoading = loadingImages[image.id] !== false;
              const caption = getImageCaption(index);

              return (
                <div key={image.id}>
                  <a
                    key={image.id}
                    className="gallery-item h-0"
                    data-src={getImageUrl(image, false)}
                    data-sub-html={`<h4>${caption}</h4><p>${wedding.title}</p>`}
                    data-facebook-title={`${wedding.title} - ${caption}`}
                    data-twitter-title={`${wedding.title} - ${caption}`}
                    data-pinterest-text={`${wedding.title} - ${caption}`}
                  >
                    <div className="relative w-full overflow-hidden rounded-[5px]">
                      {/* Conteneur avec aspect-ratio pour éviter le layout shift */}
                      <div 
                        className="relative w-full"
                        style={{ 
                          aspectRatio: image.width && image.height 
                            ? `${image.width}/${image.height}` 
                            : '3/4' // Fallback ratio
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
                        
                        <LazyLoadImage
                          src={getImageUrl(image)}
                          alt={`${wedding.title} - ${caption}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          effect="blur"
                          placeholder={
                            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                              <Heart className="text-red-300 animate-pulse w-12 h-12" />
                            </div>
                          }
                          onLoad={() => {
                            // Marque l'image comme chargée
                            setLoadingImages(prev => ({
                              ...prev,
                              [image.id]: false
                            }));
                          }}
                          beforeLoad={() => {
                            // Marque l'image comme en cours de chargement
                            setLoadingImages(prev => ({
                              ...prev,
                              [image.id]: true
                            }));
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
                  </a>
                </div>
              );
            })}
          </Masonry>
          </LightGallery>
          
          
        </div>
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
        
        /* Styles pour react-masonry-css */
        .masonry-grid {
          display: flex;
          margin-left: -16px; /* gutter size offset */
          width: auto;
        }
        
        .masonry-grid_column {
          padding-left: 16px; /* gutter size */
          background-clip: padding-box;
        }
        
        .masonry-grid_column > div {
          margin-bottom: 16px;
        }
      `}</style>
      
    </div>
  );
}

