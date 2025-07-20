
import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { SwiperGalleryProps } from './SwiperGallery';
import { Masonry } from 'masonic';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-share.css';
import 'lightgallery/css/lg-autoplay.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-rotate.css';
import 'lightgallery/css/lg-pager.css';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgPager from 'lightgallery/plugins/pager';
import { Box, Card, CardMedia, Typography, Skeleton, Fade } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

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

  // Références pour le preloading intelligent des images HD
  const preloadedImages = useRef<Set<string>>(new Set());
  const imageObserver = useRef<IntersectionObserver | null>(null);

  const visibleWeddingImages = useMemo(() => {
    return wedding.images.filter((image: WeddingImage) => image.imageVisibility !== false);
  }, [wedding.images]);

  const [swiperOpen, setSwiperOpen] = useState(false);
  const [swiperIndex, setSwiperIndex] = useState(0);
  
  // État pour la galerie mobile
  const [mobileGalleryOpen, setMobileGalleryOpen] = useState(false);
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);
  const [fullscreenRequested, setFullscreenRequested] = useState(false);

  // Fonction pour preloader une image HD de manière intelligente
  const preloadHDImage = useCallback((imageUrl: string) => {
    if (preloadedImages.current.has(imageUrl)) return;
    
    preloadedImages.current.add(imageUrl);
    const img = new Image();
    img.src = imageUrl;
    // Pas besoin de stocker l'image, juste la mettre en cache du navigateur
  }, []);

  // Configuration de l'Intersection Observer pour le preloading intelligent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    imageObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const hdUrl = img.dataset.hdUrl;
            if (hdUrl) {
              // Délai court pour s'assurer que le thumbnail est bien chargé
              setTimeout(() => preloadHDImage(hdUrl), 500);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Commence à preloader un peu avant que l'image soit visible
        threshold: 0.1
      }
    );

    return () => {
      if (imageObserver.current) {
        imageObserver.current.disconnect();
      }
    };
  }, [preloadHDImage]);

  // Fonction pour observer une image thumbnail
  const observeThumbnail = useCallback((element: HTMLImageElement | null) => {
    if (!element || !imageObserver.current) return;
    imageObserver.current.observe(element);
  }, []);

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

  // Images pour react-image-gallery (mobile)
  const galleryImages = useMemo(() => visibleWeddingImages.map((img, idx) => ({
    original: getImageUrl(img, false),
    thumbnail: getImageUrl(img, true),
    description: getImageCaption(idx),
  })), [visibleWeddingImages]);

  // A simplified card component to ensure the image displays correctly.
  const MasonryCard = ({ data: image, index }: { data: WeddingImage, index: number }) => {
    const thumbnailUrl = getImageUrl(image, true);
    const hdUrl = getImageUrl(image, false);
    const [imageLoaded, setImageLoaded] = useState(false);
    // const [imageLoaded] = useState(false); // Toujours false pour test
    
    // Pour mobile, créer une carte cliquable qui ouvre la galerie
    if (isMobile) {
      return (
        <Box mb={2} sx={{ cursor: 'pointer' }} onClick={() => {
          setMobileGalleryIndex(index);
          setMobileGalleryOpen(true);
        }}>
          <Card
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1,
              boxShadow: 2,
              backgroundColor: 'rgba(245, 245, 245, 0)', // Transparence pour lazy load
              transition: 'box-shadow 0.3s',
              '&:hover': { boxShadow: 6 },
            }}
          >
            {/* Skeleton overlay avec coeur animé */}
            {!imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(245,245,245,0.30)', // transparence
                  backdropFilter: 'blur(8px)', // effet flou
                  WebkitBackdropFilter: 'blur(8px)', // support Safari
                  zIndex: 2,
                  aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4',
                }}
              >
                <Fade in={!imageLoaded} timeout={800} style={{ width: '100%', height: '100%' }}>
                  <Box sx={{ width: '50%', height: '50%' }}>
                    <FavoriteBorderIcon
                      sx={{
                        width: '100%',
                        height: '100%',
                        color: '#ffbdbdff',
                        animation: 'heartbeat 1.5s ease-in-out infinite',
                      }}
                    />
                  </Box>
                </Fade>
              </Box>
            )}
            
            <LazyLoadImage
              src={thumbnailUrl}
              alt={getImageCaption(index)}
              effect="blur"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4',
                display: 'block',
                borderRadius: 0,
              }}
              beforeLoad={() => {
                // Préserver les dimensions pour masonry avant le chargement
                const element = document.querySelector(`[alt="${getImageCaption(index)}"]`) as HTMLImageElement;
                if (element && image.width && image.height) {
                  element.style.aspectRatio = `${image.width}/${image.height}`;
                }
              }}
              onLoad={() => {
                // Marquer l'image comme chargée
                setImageLoaded(true);

                // Configurer l'observation pour le preloading HD après un court délai
                setTimeout(() => {
                const element = document.querySelector(`[alt="${getImageCaption(index)}"]`) as HTMLImageElement;
                if (element) {
                  element.dataset.hdUrl = hdUrl;
                  observeThumbnail(element);
                }
                }, 100);
              }}
              onError={() => {
                console.error('Error loading image:', thumbnailUrl);
                // setImageLoaded(true); // Même en cas d'erreur, on cache le skeleton
              }}
            />
            {/* Overlay avec caption au hover */}
            {visibleWeddingImages[index]?.descriptionVisibility !== false && imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  '&:hover': { opacity: 1 },
                  borderRadius: 0,
                }}
              >
                <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: 'white' }}>
                  <Typography variant="subtitle2" fontWeight={600}>{getImageCaption(index)}</Typography>
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      );
    }

    // Pour desktop, retourner l'élément Swiper classique
    return (
      <Box mb={0} sx={{ cursor: 'pointer' }} onClick={() => {
        setSwiperIndex(index);
        setSwiperOpen(true);
      }}>
        <Card
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 1,
            boxShadow: 2,
            backgroundColor: 'rgba(245, 245, 245, 0)', // Transparence pour lazy load
            transition: 'box-shadow 0.3s',
            '&:hover': { boxShadow: 6 },
          }}
        >
          {/* Skeleton overlay avec coeur animé */}
          {!imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(245,245,245,0.30)', // transparence
                backdropFilter: 'blur(8px)', // effet flou
                WebkitBackdropFilter: 'blur(8px)', // support Safari
                zIndex: 2,
                aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4',
              }}
            >
              <Fade in={!imageLoaded} timeout={800} style={{ width: '100%', height: '100%' }}>
                <Box sx={{ width: '50%', height: '50%' }}>
                  <FavoriteBorderIcon
                    sx={{
                      width: '100%',
                      height: '100%',
                      color: '#ffbdbdff',
                      animation: 'heartbeat 1.5s ease-in-out infinite',
                    }}
                  />
                </Box>
              </Fade>
            </Box>
          )}
          
          <LazyLoadImage
            src={thumbnailUrl}
            alt={getImageCaption(index)}
            effect="blur"
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : '3/4',
              display: 'block',
              borderRadius: 0,
            }}
            beforeLoad={() => {
              // Préserver les dimensions pour masonry avant le chargement
              const element = document.querySelector(`[alt="${getImageCaption(index)}"]`) as HTMLImageElement;
              if (element && image.width && image.height) {
                element.style.aspectRatio = `${image.width}/${image.height}`;
              }
            }}
            onLoad={() => {
              // Marquer l'image comme chargée
              setImageLoaded(true);

              // Configurer l'observation pour le preloading HD après un court délai
              setTimeout(() => {
              const element = document.querySelector(`[alt="${getImageCaption(index)}"]`) as HTMLImageElement;
              if (element) {
                element.dataset.hdUrl = hdUrl;
                observeThumbnail(element);
                // Force reflow to ensure masonry recalculates
                element.style.visibility = 'visible';
              }
              }, 100);
            }}
            onError={() => {
              console.error('Error loading image:', thumbnailUrl);
              // setImageLoaded(true); // Même en cas d'erreur, on cache le skeleton
            }}
          />
          {/* Overlay avec caption au hover */}
          {visibleWeddingImages[index]?.descriptionVisibility !== false && imageLoaded && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                opacity: 0,
                transition: 'opacity 0.3s',
                '&:hover': { opacity: 1 },
                borderRadius: 0,
              }}
            >
              <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: 'white' }}>
                <Typography variant="subtitle2" fontWeight={600}>{getImageCaption(index)}</Typography>
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    );
  };

  // Ref pour LightGallery
  const lightGalleryRef = useRef<any>(null);


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
          <LightGallery
            onInit={ref => { lightGalleryRef.current = ref.instance; }}
            selector=".gallery-item"
            plugins={[lgZoom, lgThumbnail, lgAutoplay, lgFullscreen]}
            speed={300}
            closable={true}
            closeOnTap={true}
            // slideDelay={400}
            slideShowInterval={1200}
            mode="lg-fade"
            counter={true}
            download={false}
            autoplay={true}
            zoom={true}
            thumbnail={true}
            progressBar={true}
            mobileSettings={{
              controls: true,
              showCloseIcon: true,
              download: false,
              rotate: false,
              fullScreen: true,
              zoom: true,
              autoplay: true,
              counter: true,
              swipeThreshold: 50,
              enableSwipe: true,
              enableDrag: true,
              closable: true,
              closeOnTap: true,
              showMaximizeIcon: false,
              progressBar: true,
            }}
          >
            <div className="grid grid-cols-1 gap-4">
              {visibleWeddingImages.map((img, idx) => {
                // Ajout de data-lg-size pour LightGallery (ex: "1200-800")
                const lgSize = img.width && img.height ? `${img.width}-${img.height}` : undefined;
                return (
                  <a
                    key={img.fileUrl || idx}
                    className="gallery-item block"
                    data-src={getImageUrl(img, false)}
                    data-thumb={getImageUrl(img, true)}
                    data-sub-html={`<div style='color:white;text-align:center;'>${getImageCaption(idx)}</div>`}
                    tabIndex={0}
                    {...(lgSize ? { 'data-lg-size': lgSize } : {})}
                  >
                    <img
                      src={getImageUrl(img, true)}
                      alt={getImageCaption(idx)}
                      className="w-full rounded-lg object-cover"
                      style={{
                        aspectRatio: img.width && img.height ? `${img.width}/${img.height}` : '3/4',
                        background: '#f3f4f6',
                      }}
                      loading="lazy"
                    />
                  </a>
                );
              })}
            </div>
          </LightGallery>
        ) : (
          <Masonry
            items={visibleWeddingImages}
            render={MasonryCard}
            columnCount={2}
            columnGutter={16}
            overscanBy={20}
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

      {/* Suppression de l'ancien overlay mobile, tout est géré par LightGallery */}
      
      <style jsx global>{`
        .lg-fullscreen, .lg-zoom-in, .lg-zoom-out, .lg-autoplay, .lg-autoplay-button, .lg-autoplay-control, .lg-close {
          background: rgba(255,255,255,0.18) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
          border: none !important;
          color: #fff !important;
          padding: 0 !important;
          opacity: 1 !important;
          margin: 5px !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .lg-prev, .lg-next {
          width: 34px !important;
          height: 34px !important;
          font-size: 22px !important;
          background: rgba(255,255,255,0.18) !important;
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
          border: none !important;
          color: #fff !important;
          padding: 0 !important;
          opacity: 1 !important;
          margin: 5px !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        /* Forcer l'affichage des boutons navigation/autoplay même si LightGallery les masque */
        .lg-prev, .lg-next, .lg-autoplay, .lg-autoplay-button, .lg-autoplay-control {
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        /* Décaler les boutons de navigation/autoplay pour laisser la place à la croix */
        @media (max-width: 768px) {
          .lg-next { right: 70px !important; }
          .lg-prev { left: 20px !important; }
          .lg-autoplay, .lg-autoplay-button, .lg-autoplay-control { right: 70px !important; top: 70px !important; }
        }
        .lg-fullscreen svg, .lg-zoom-in svg, .lg-zoom-out svg, .lg-prev svg, .lg-next svg, .lg-autoplay svg, .lg-autoplay-button svg, .lg-autoplay-control svg, .lg-close svg {
          stroke: #fff !important;
          width: 22px !important;
          height: 22px !important;
        }
        .lg-close {
          width: 40px !important;
          height: 40px !important;
          right: 10px !important;
          top: 10px !important;
        }
        @media (max-width: 768px) {
          .lg-prev {
            left: 4px !important;
            top: 40% !important;
          }
          .lg-next {
            right: 4px !important;
            top: 40% !important;
          }
          .lg-close {
            right: 8px !important;
            top: 8px !important;
          }
        }
        /* Masquer le bouton de partage natif si jamais il reste */
        .lg-share {
          display: none !important;
        }
        /* Masquer les pastilles indicateur de position (pager) */
        .lg-pager {
          display: none !important;
        }
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

        /* Animation heartbeat pour le coeur */
        @keyframes heartbeat {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
        }

        /* Styles pour react-lazy-load-image-component */
        .lazy-load-image-background {
          background: transparent !important;
          background-color: transparent !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        .lazy-load-image-background * {
          background: transparent !important;
          background-color: transparent !important;
        }
        .lazy-load-image-background::before,
        .lazy-load-image-background::after {
          background: transparent !important;
          background-color: transparent !important;
        }

        .lazy-load-image-background.blur {
          filter: blur(15px);
          transition: filter 0.3s;
        }

        .lazy-load-image-background.blur.lazy-load-image-loaded {
          filter: blur(0);
        }
      `}</style>
    </div>
  );
}

