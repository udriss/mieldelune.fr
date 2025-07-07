"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { generateFingerprint } from '@/lib/fingerprint';
import { Wedding, Image as WeddingImage } from '@/lib/dataTemplate';
import { myFetch } from '@/lib/fetch-wrapper';
import { 
  Box, 
  Card, 
  CardMedia, 
  Typography, 
  Grid, 
  Skeleton, 
  CardActionArea,
  Fade,
  Chip,
  Container,
  useTheme,
  Paper
} from '@mui/material';
import { ArrowForward, Favorite, LocationOn } from '@mui/icons-material';
import { SiteData } from '@/lib/dataSite';

// Hook pour charger dynamiquement les Google Fonts
function useGoogleFont(fontFamily: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!fontFamily || fontFamily === 'Arial' || fontFamily === 'Times New Roman') {
      setIsLoaded(true);
      return; // Polices système, pas besoin de charger
    }

    const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Vérifier si la police est déjà chargée
    let link = document.getElementById(fontId) as HTMLLinkElement;
    
    if (!link) {
      // Créer le lien pour charger la police
      link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
      
      // Ajouter les événements de chargement
      link.onload = () => {
        
        setIsLoaded(true);
      };
      
      link.onerror = () => {
        console.error(`Erreur lors du chargement de la police ${fontFamily}`);
        setIsLoaded(true); // Considérer comme chargée même en cas d'erreur
      };
      
      document.head.appendChild(link);
      
      // Fallback timer pour s'assurer que l'état est mis à jour
      const timer = setTimeout(() => {
        
        setIsLoaded(true);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // La police est déjà dans le DOM
      setIsLoaded(true);
    }
  }, [fontFamily]);

  return isLoaded;
}

export default function ClientWrapper() {
  const router = useRouter();
  const initialized = useRef(false);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [siteSettings, setSiteSettings] = useState<SiteData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Récupérer la police configurée pour les albums
  const albumsFontFamily = (siteSettings as any)?.pageSettings?.Albums?.fontFamily || 'Montserrat';
  
  // Charger la police Google Fonts pour les albums
  const isFontLoaded = useGoogleFont(albumsFontFamily);

  const initFingerprint = async () => {
    if (initialized.current) return;
    
    try {
      const deviceId = await generateFingerprint();
      localStorage.setItem('deviceFingerprint', deviceId);
      initialized.current = true;
    } catch (error) {
      console.error('Error generating fingerprint:', error);
    }
  };

  useEffect(() => {
    initFingerprint();

    const fetchWeddingsAndSettings = async () => {
      try {
        // Fetch weddings
        const weddingsRes = await myFetch('/api/mariages', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store',
          next: { 
            revalidate: 0 
          }
        });
        const weddingsData = await weddingsRes.json();
        if (weddingsData.weddings && Array.isArray(weddingsData.weddings)) {
          setWeddings(weddingsData.weddings);
        }

        // Fetch site settings
        const settingsRes = await myFetch('/api/siteSettings');
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setSiteSettings(settingsData.site);
          
        }

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchWeddingsAndSettings();
  }, []);

  // Log pour débugger le chargement de la police
  useEffect(() => {
    if (albumsFontFamily && isFontLoaded) {
      
    }
  }, [albumsFontFamily, isFontLoaded]);

  const getImageUrl = (image: WeddingImage, thumbnail: boolean = true) => {
    if (image.fileType === 'coverStorage' || image.fileType === 'storage') {
      const url = thumbnail && image.fileUrlThumbnail ? 
        image.fileUrlThumbnail : 
        image.fileUrl;
      return `/api/images?fileUrl=${url}`;
    }
    return image.fileUrl;
  }

  interface LoadingImagesState {
    [key: number]: boolean;
  }

  const handleImageLoad = (imageId: number): void => {
    setLoadingImages((prev: LoadingImagesState) => ({
      ...prev,
      [imageId]: false
    }));
  };

  // Tri par id croissant avant l'affichage
  const sortedWeddings = [...weddings].sort((a, b) => Number(a.id) - Number(b.id));
  const theme = useTheme();


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <Container 
      sx={{ 
        mt: 6,
        mb: { xs: 4, sm: 6, md: 8, lg: 10, xl: 12 },
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        maxWidth: '800px',
        minWidth: '300px',
      }}
    >
      <Grid container spacing={6}>
        {sortedWeddings.map((wedding, index) => (
          wedding.visible && (
            <Grid size={{ xs:12 }} key={wedding.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.1
                }}
                style={{ width: '100%' }}
              >
                <Card 
                  sx={{ 
                    minWidth: '270px',
                    width: '100%',
                    borderRadius: '16px',
                    boxShadow: hoveredId === wedding.id ? 
                      '0 15px 40px rgba(0,0,0,0.25)' : 
                      '0 5px 15px rgba(0,0,0,0.1)',
                    transition: 'all 0.4s ease',
                    overflow: 'hidden',
                    position: 'relative',
                    height: { xs: '350px', sm: 450 },
                    transform: hoveredId === wedding.id ? 'translateY(-5px)' : 'translateY(0)',
                    filter: hoveredId && hoveredId !== wedding.id ? 'brightness(0.7)' : 'brightness(1)'
                  }}
                  onMouseEnter={() => setHoveredId(wedding.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <CardActionArea 
                    onClick={() => router.push(`/mariage/${wedding.id}`)}
                    sx={{ 
                      height: '100%',
                      width: '100%',
                      position: 'relative',
                      display: 'block'
                    }}
                  >
                    {/* Image couvrant toute la carte */}
                    <Box sx={{ 
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 0
                    }}>
                      {wedding.coverImage && (
                        <>
                          {loadingImages[wedding.coverImage.id] ? (
                            <Box 
                              sx={{ 
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(8px)',
                                zIndex: 1
                              }}
                            >
                              <Favorite
                                sx={{
                                  position: 'absolute',
                                  fontSize: 100,
                                  color: theme.palette.primary.light,
                                  opacity: 0.6
                                }}
                              />
                              <Skeleton
                                variant="rectangular"
                                width="100%"
                                height="100%"
                                animation="wave"
                                sx={{
                                  backgroundColor: 'white',
                                  filter: 'blur(2px)',
                                  opacity: 0.5,
                                }}
                              />
                            </Box>
                          ) : (
                            <CardMedia
                              component="img"
                              image={getImageUrl(wedding.coverImage)}
                              alt={`${wedding.title}`}
                              sx={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                transition: 'all 0.6s ease-in-out',
                                transform: hoveredId === wedding.id ? 'scale(1.05)' : 'scale(1)'
                              }}
                              onLoad={() => wedding.coverImage && handleImageLoad(Number(wedding.coverImage.id))}
                            />
                          )}
                        </>
                      )}
                    </Box>

                    {/* Badge date */}
                    {wedding.date && wedding.date.trim() !== "" && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          zIndex: 10
                        }}
                      >
                        <Chip 
                          label={wedding.date} 
                          color="primary" 
                          sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '0.9rem',
                            bgcolor: 'rgba(255,255,255,0.95)',
                            color: theme.palette.primary.main,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            borderRadius: '20px',
                            padding: '5px 5px'
                          }} 
                        />
                      </Box>
                    )}

                    {/* Contenu mis en valeur */}
                    <Box
                      component={Paper}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.59)',
                        backdropFilter: 'blur(5px)',
                        color: 'white',
                        padding: { xs: 3, sm: 4 },
                        zIndex: 5,
                        transition: 'all 0.3s ease',
                        transform: hoveredId === wedding.id ? 'translateY(0)' : 'translateY(0)',
                        minHeight: (siteSettings?.showWeddingDescription === true || (siteSettings?.showWeddingDescription as any) === 'true') && wedding.showDescription && wedding.description ? '200px' : '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}
                      elevation={0}
                    >
                      <Typography 
                        variant="h4" 
                        component="h2" 
                        gutterBottom
                        className={isMobile ? "" : "page-content-albums"}
                        sx={{ 
                          fontWeight: 700,
                          color: 'white',
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          position: 'relative',
                          pb: 1,
                          fontSize: isMobile ? '35px !important' : undefined,
                          fontFamily: isMobile ? `${albumsFontFamily}, sans-serif` : undefined,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '60px',
                            height: '3px',
                            backgroundColor: 'rgb(238, 159, 159)',
                            borderRadius: '3px'
                          }
                        }}
                      >
                        {wedding.title}
                      </Typography>
                      {(siteSettings?.showWeddingDescription === true || (siteSettings?.showWeddingDescription as any) === 'true') && wedding.showDescription && wedding.description && (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            mt: 2,
                            mb: 2,
                            lineHeight: 1.6,
                            color: 'rgba(255,255,255,0.95)',
                            fontSize: { xs: '1rem', sm: '1.1rem' },
                            fontWeight: 400,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {wedding.description}
                        </Typography>
                      )}

                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mt: 1, 
                          color: 'rgba(255,255,255,0.9)',
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)'
                        }}>
                          {(siteSettings?.showWeddingLocation === true || (siteSettings?.showWeddingLocation as any) === 'true') && wedding.showLocation !== false && wedding.location && wedding.location.trim() !== '' && (
                            <>
                              <LocationOn sx={{ fontSize: '1.1rem', mr: 0.7, color: 'rgb(238, 159, 159)' }} />
                              <Typography 
                                variant="body1"
                                sx={{
                                  fontStyle: 'italic',
                                  fontWeight: 400,
                                  fontSize: { xs: '0.9rem', sm: '1rem' },
                                }}
                              >
                                {wedding.location}
                              </Typography>
                            </>
                          )}
                        </Box>

                        <Box 
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'end',
                            mt: 1,
                            color: 'rgb(238, 159, 159)',
                            fontWeight: 600,
                            opacity: hoveredId === wedding.id ? 1 : 0.9,
                            transform: hoveredId === wedding.id ? 'translateX(8px)' : 'translateX(0)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <Typography 
                            variant="button" 
                            sx={{ 
                              mr: 1, 
                              fontSize: '1rem',
                              letterSpacing: '0.5px' 
                            }}
                          >
                            Découvrir
                          </Typography>
                          <ArrowForward fontSize="small" />
                        </Box>
                      </Box>



                    </Box>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          )
        ))}
      </Grid>
    </Container>
  );
}
