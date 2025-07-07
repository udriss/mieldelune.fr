import LightGallery from 'lightgallery/react';
import { useRouter } from 'next/navigation';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import { Skeleton, useMediaQuery, Box } from '@mui/material';

// Material UI Timeline components
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';

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

const getImageUrl = (image: WeddingImage, thumbnail: boolean = true) => {
  if (image.fileType === 'storage') {
    const url = thumbnail && image.fileUrlThumbnail ? 
      image.fileUrlThumbnail : 
      image.fileUrl;
    return `/api/images?fileUrl=${url}`;
  }
  return image.fileUrl;
}

export function TimelineGallery({ wedding }: { wedding: Wedding }) {
  const router = useRouter();
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [imageDimensions, setImageDimensions] = useState<{ [key: string]: { width: number, height: number } }>({});
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Filtrer les images pour n'afficher que celles qui sont visibles
  const visibleWeddingImages = useMemo(() => {
    return wedding.images.filter(image => image.imageVisibility !== false);
  }, [wedding.images]);
  
  // Generate timeline dates based on wedding date
  const generateTimelineDates = useCallback(() => {
    const dates: string[] = [];
    if (!wedding.date) return Array(visibleWeddingImages.length).fill("");
    
    try {
      // Parse wedding date (assuming format: DD/MM/YYYY)
      const [day, month, year] = wedding.date.split('/').map(Number);
      const weddingDate = new Date(year, month - 1, day);
      
      // Create dates for timeline (starting from two days before wedding)
      const startDate = new Date(weddingDate);
      startDate.setDate(weddingDate.getDate() - 2);
      
      // Create a date for each image, starting from prep to ceremony to reception
      visibleWeddingImages.forEach((_, index) => {
        const eventDate = new Date(startDate);
        // Space out timestamps throughout the day
        eventDate.setHours(9 + Math.floor(index / 3));
        eventDate.setMinutes((index % 3) * 20);
        
        const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const formattedDate = eventDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        dates.push(`${formattedDate} · ${formattedTime}`);
      });
      
      return dates;
    } catch (error) {
      console.error("Error parsing wedding date:", error);
      return Array(visibleWeddingImages.length).fill("");
    }
  }, [wedding.date, visibleWeddingImages.length]);

  const timelineDates = generateTimelineDates();
  
  // Captions for timeline events
  const timelineEvents = [
    "Préparatifs de la mariée",
    "Moments entre amies",
    "Dernières retouches",
    "Arrivée du marié",
    "Cérémonie",
    "Échange des vœux",
    "Sortie des mariés",
    "Séance photo",
    "Réception",
    "Premier dance",
    "Soirée festive",
    "Moments de joie"
  ];

  // Function to get caption for each image
  const getImageCaption = (index: number) => {
    // If image has a description and it's visible
    if (visibleWeddingImages[index]?.description && visibleWeddingImages[index]?.descriptionVisibility !== false) {
      return visibleWeddingImages[index].description;
    }

    // For images without description or with hidden description
    return `Moment #${index + 1}`;
  };
  
  const handleImageLoad = useCallback((imageId: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    // Capture les dimensions réelles de l'image
    const img = event.currentTarget;
    setImageDimensions(prev => ({
      ...prev,
      [imageId]: {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    }));
    
    // Marque l'image comme chargée
    setLoadingImages(prev => ({
      ...prev,
      [imageId]: false
    }));
  }, []);

  // Fonction pour calculer la largeur en fonction de la proportion réelle
  const calculateWidth = (imageId: string, defaultHeight: number = 600) => {
    if (!imageDimensions[imageId]) return 'auto';
    
    const { width, height } = imageDimensions[imageId];
    const aspectRatio = width / height;
    
    // Calcule la largeur basée sur la hauteur fixe et le ratio d'aspect réel
    return `${defaultHeight * aspectRatio}px`;
  };

  // Fonction pour calculer la hauteur optimale en fonction de l'image
  const calculateHeight = (imageId: string, maxHeight: number = 600) => {
    if (!imageDimensions[imageId]) return `${maxHeight}px`;
    
    const { width, height } = imageDimensions[imageId];
    const aspectRatio = width / height;
    
    // Si l'image est plus haute que large ou presque carrée, limite sa hauteur
    if (height >= width * 0.8) {
      return `${maxHeight}px`;
    }
    
    // Pour les images larges (paysage), adapte la hauteur pour qu'elles ne soient pas trop petites
    // mais s'adapte plus naturellement aux proportions de l'image
    if (aspectRatio > 1.8) { // Images très larges (panoramiques ou 16:9)
      return `${Math.max(300, maxHeight * 0.6)}px`;
    } else if (aspectRatio > 1.3) { // Images larges standard
      return `${Math.max(400, maxHeight * 0.75)}px`;
    }
    
    // Images presque carrées
    return `${maxHeight}px`;
  };

  // Generate a random date in the past for timeline aesthetic
  const generateRandomDate = (index: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    // Subtract a random number of days, but ensure chronological order with index
    pastDate.setDate(today.getDate() - (index * 5 + Math.floor(Math.random() * 3)));
    return pastDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long'
    });
  };

  return (
    <div className="min-h-screen w-full mt-16">
      <div className="mx-auto py-8">
        <div className="relative top-4 left-4">
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

        {/* Gallery with Timeline layout */}
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
            <Timeline 
              position={isMobile ? "right" : "alternate"} 
              className="wedding-timeline"
              sx={{
                padding: isMobile ? '0 0 0 20px' : '0',
                '@media (max-width: 768px)': {
                  '.MuiTimelineItem-root': {
                    flexDirection: 'row',
                    '&::before': {
                      display: 'none'
                    }
                  }
                }
              }}
            >
              {visibleWeddingImages.map((image, index) => {
                const isImageLoading = loadingImages[image.id] !== false;
                const isLeft = index % 2 === 0;
                const randomDelay = index * 0.15; // Sequential animation delay
                const caption = getImageCaption(index);
                
                return (
                  <TimelineItem 
                    key={image.id}
                    className="timeline-item"
                    sx={{ 
                      opacity: 0,
                      animation: `fadeIn 0.7s ease-out ${randomDelay}s forwards`,
                    }}
                  >
                    <TimelineSeparator>
                      <TimelineDot 
                        color={isLeft ? "secondary" : "primary"}
                        variant="outlined"
                        sx={{
                          borderWidth: 2,
                          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                        }}
                      />
                      <TimelineConnector 
                        sx={{ 
                          bgcolor: isLeft ? 'secondary.light' : 'primary.light',
                          width: '2px',
                          opacity: 0.6
                        }} 
                      />
                    </TimelineSeparator>
                    
                    <TimelineContent 
                      className="timeline-content" 
                      sx={{ 
                        py: 3, 
                        px: isMobile ? 2 : 3,
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        flexDirection: 'column',
                        animationDelay: `${randomDelay}s`,
                        animationDuration: '0.7s',
                        animationFillMode: 'forwards',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {/* Time display */}
                      {/* <div className="timeline-date mb-2 text-sm text-gray-500 font-light italic w-full text-center md:text-left">
                        {timelineDates[index]}
                      </div> */}
                      
                      <div className="timeline-image-container w-full">
                        <a
                          className="gallery-item block cursor-pointer"
                          data-src={getImageUrl(image, false)}
                          data-sub-html={`<h4>${caption}</h4><p>${wedding.title}</p>`}
                          data-facebook-title={`${wedding.title} - ${caption}`}
                          data-twitter-title={`${wedding.title} - ${caption}`}
                          data-pinterest-text={`${wedding.title} - ${caption}`}
                        >
                          <div 
                            className={`relative overflow-hidden rounded-lg transform transition-all hover:scale-[1.02] ${
                              isLeft ? 'hover:rotate-1' : 'hover:rotate-[-1deg]'
                            }`}
                            style={{ 
                              margin: '0 auto',
                              borderRadius: '20px',
                              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
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
                            <div className="overflow-hidden" style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0',
                              boxSizing: 'border-box',
                            }}>
                              <Image
                                src={getImageUrl(image)}
                                alt={`${wedding.title} - ${caption}`}
                                className={`transition-all duration-500 ${
                                  isImageLoading ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                                }`}
                                width={500}
                                height={500}
                                style={{ 
                                  objectFit: 'cover',
                                  width: '100%',
                                  height: isMobile ? '200px' : '350px',
                                  borderRadius: '12px',
                                }}
                                sizes="(max-width: 640px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 50vw, 33vw"
                                priority={index < 6}
                                loading={index < 6 ? 'eager' : 'lazy'}
                                onLoad={(e) => handleImageLoad(image.id, e)}
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
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          </LightGallery>
        </div>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');
        
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(30px) translateX(0);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) translateX(0);
          }
        }

        @keyframes fadeInLeft {
          from { 
            opacity: 0; 
            transform: translateY(20px) translateX(-30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) translateX(0);
          }
        }

        @keyframes fadeInRight {
          from { 
            opacity: 0; 
            transform: translateY(20px) translateX(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) translateX(0);
          }
        }
        
        .wedding-timeline {
          position: relative;
          padding: 0;
        }
        
        .timeline-item {
          min-height: 100px;
          margin-bottom: 2.5rem;
        }
        
        .timeline-image-container {
          transition: all 0.3s ease;
          transform-origin: center;
        }
        
        .timeline-image-container img {
          border-radius: 12px;
        }
        
        .timeline-content:hover .timeline-image-container {
          transform: scale(1.03);
        }

        .timeline-date {
          font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.5px;
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
        
        /* Styles pour écrans mobiles */
        @media (max-width: 768px) {
          .timeline-item {
            margin-bottom: 1.5rem;
          }
          
          .timeline-content {
            padding-left: 12px !important;
            padding-right: 0 !important;
          }
          
          .timeline-image-container {
            max-width: 100% !important;
          }
          
          .MuiTimelineConnector-root {
            min-height: 40px !important;
          }

          .timeline-date {
            text-align: left !important;
            padding-left: 4px;
            font-size: 0.8rem;
          }
        }
        
        @media (max-width: 640px) {
          .timeline-content {
            padding-top: 10px !important;
            padding-bottom: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

