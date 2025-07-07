import { Profile } from '@/lib/dataProfil';
import Image from 'next/image';
import { SocialIcons } from '@/components/artiste/social-icons';
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { useArtistCardDimensions } from '@/hooks/useArtistCardDimensions';
import { useState, useEffect, useRef } from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { keyframes } from '@mui/system';

interface ArtistCardProps {
  profile: Profile;
}

export default function ArtistCard({ profile }: ArtistCardProps) {
  const [artistNameFontSize, setArtistNameFontSize] = useState(20);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Animation de clignotement pour l'icône
  const blinkAnimation = keyframes`
    50% {
      opacity: 0.3;
    }
  `;

  useEffect(() => {
    // Récupération de la taille de police du nom d'artiste depuis siteData ou CSS
    const getArtistNameFontSize = async () => {
      try {
        // Tentative de récupération via l'API siteSettings
        const response = await fetch('/api/siteSettings');
        if (response.ok) {
          const siteData = await response.json();
          const profilSettings = siteData.pageSettings?.Profil;
          if (profilSettings?.artistNameFontSize) {
            return profilSettings.artistNameFontSize;
          }
        }
      } catch (error) {
        
      }

      // Fallback: récupération depuis les styles CSS calculés
      const artistNameElement = document.querySelector('.artist-name.page-content-profil');
      if (artistNameElement) {
        const computedStyle = window.getComputedStyle(artistNameElement);
        const fontSize = parseFloat(computedStyle.fontSize);
        return fontSize || 20;
      }
      return 20;
    };

    getArtistNameFontSize().then(setArtistNameFontSize);

    // Observer pour détecter les changements de style en temps réel
    const observer = new MutationObserver(() => {
      getArtistNameFontSize().then(setArtistNameFontSize);
    });

    observer.observe(document.head, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const dimensions = useArtistCardDimensions({
    artistNameFontSize,
    hasSubTitle: !!(profile.subTitle && profile.subTitle.trim() !== ''),
    descriptionLength: profile.description?.length || 0,
  });

  useEffect(() => {
    const descriptionEl = descriptionRef.current;

    const checkScroll = () => {
      if (descriptionEl) {
        const isScrollable = descriptionEl.scrollHeight > descriptionEl.clientHeight;
        const isNotAtBottom = descriptionEl.scrollHeight - descriptionEl.scrollTop > descriptionEl.clientHeight + 1; // +1 pour la précision
        setShowScrollIndicator(isScrollable && isNotAtBottom);
      }
    };

    // Vérifier au montage et lors des changements de dimensions
    checkScroll();

    // Ajouter les écouteurs d'événements
    descriptionEl?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    // Nettoyage
    return () => {
      descriptionEl?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [profile.description, dimensions]); // Se déclenche si la description ou les dimensions changent

  const getImageUrl = (profile: Profile) => {
    if (profile.imagetype === 'profileStorage') {
      return `/api/images?fileUrl=${profile.imageUrl}`;
    }
    return profile.imageUrl;
  };

  return (
    <>
      <Card 
        className="group relative w-full max-w-[1200px] mx-auto overflow-hidden shadow-lg transition-all duration-300 hover:scale-105"
        sx={{
          borderRadius: '5px',
          height: dimensions.cardHeight > 0 ? `${dimensions.cardHeight}px` : 'auto', // Hauteur dynamique ou auto
          minHeight: dimensions.cardHeight > 0 ? `${dimensions.cardHeight}px` : 'auto', // Pas de minimum si pas de contenu
          '&:hover': {
            transform: 'scale(1.05)',
          },
          transition: 'all 0.3s ease',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box className="grid grid-cols-3 min-h-full"
        >
          {/* Left side - Image */}
          <Box className="relative col-span-1 min-h-full overflow-hidden">
            <Image
              src={profile.imageUrl}
              alt={profile.artistName}
              width={0}
              height={0}
              sizes="(max-width: 600px) 100vw, 600px"
              className="object-cover w-full h-full min-h-[400px]"
              priority
              style={{ objectFit: 'cover', minHeight: '400px' }}
            />
            <Box className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Typography 
                variant="h6" 
                className="text-white text-lg font-medium"
                sx={{ color: 'white', fontSize: '1.125rem', fontWeight: 500 }}
              >
                {/* {profile.artistName} */}
              </Typography>
            </Box>
          </Box>

          {/* Right side - Content */}
          <CardContent className="col-span-2 relative p-6 text-white flex flex-col justify-start">
            <Box
              sx={{
                position: 'relative', // Ajouté pour positionner l'icône
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                height: 'auto',
                maxHeight: dimensions.cardHeight > 0 ? `${dimensions.cardHeight - 48}px` : 'none', // Hauteur de la carte moins le padding de CardContent (24px * 2)
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden', // On cache le débordement ici pour mieux contrôler
              }}
            >
              {profile.artistName && profile.artistName.trim() !== '' && (
                <Typography
                  variant="h2" 
                  className="artist-name page-content-profil font-bold mb-4 text-black pr-2
                              scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                              hover:scrollbar-thumb-gray-500"
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: 'black',
                    paddingRight: '0.5rem',
                    fontFamily: 'inherit', // Hérite explicitement la police
                    overflowWrap: 'break-word' // Permet la césure des mots très longs
                  }}
                >
                  {profile.artistName}
                </Typography>
              )}
              
              {profile.subTitle && profile.subTitle.trim() !== '' && (
                <Typography
                  variant="h4" 
                  className="page-content-profil mb-4 text-black pr-2
                    scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                    hover:scrollbar-thumb-gray-500"
                  sx={{
                    marginBottom: '1rem',
                    color: 'black',
                    paddingRight: '0.5rem',
                    fontFamily: 'inherit', // Hérite explicitement la police
                    fontSize: 'inherit', // Hérite explicitement la taille
                    overflowWrap: 'break-word' // Permet la césure des mots très longs
                  }}
                >
                  {profile.subTitle}
                </Typography>
              )}
              
              <Typography
                ref={descriptionRef}
                variant="body1"
                className="page-content-profil text-black pr-2
                            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                            hover:scrollbar-thumb-gray-500"
                sx={{
                  color: 'black',
                  overflowY: 'auto',
                  padding: '0.5rem',
                  fontFamily: 'inherit', // Hérite explicitement la police
                  fontSize: 'inherit', // Hérite explicitement la taille
                  whiteSpace: 'pre-wrap', // Preserve les retours à la ligne
                  wordWrap: 'break-word', // Permet la césure des mots longs
                  flex: '1', // Prend tout l'espace disponible
                  minHeight: '10px', // Hauteur minimale garantie
                  marginBottom: '1rem', // Assure un espace avant le bouton
                }}
              >
                {profile.description}
              </Typography>

              {profile.socialUrl && (
                <Box sx={{ flexShrink: 0 }}>
                  {' '}
                  {/* Suppression du marginTop */}
                  <Button
                    href={profile.socialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="page-content-profil self-start px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full 
                             hover:bg-white/30 transition-colors duration-200"
                    sx={{
                      alignSelf: 'flex-start',
                      paddingX: '1rem',
                      paddingY: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      borderRadius: '9999px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      transition: 'colors 0.2s ease',
                      textTransform: 'none',
                      fontFamily: 'inherit', // Hérite explicitement la police
                      fontSize: 'inherit', // Hérite explicitement la taille
                      flexShrink: 0, // Ne se réduit pas
                    }}
                  >
                    Me suivre
                  </Button>
                </Box>
              )}

              {showScrollIndicator && (
                <>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '5px', // Ajusté pour être dans le coin inférieur droit
                    right: '5px', // Positionné à droite
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${blinkAnimation} 2s infinite ease-in-out`,
                    zIndex: 10,
                  }}
                >
                  <ArrowDownwardIcon sx={{ color: 'black' }} />
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: '5px', // Ajusté pour être dans le coin inférieur droit
                    left: '5px', // Positionné à droite
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: `${blinkAnimation} 2s infinite ease-in-out`,
                    zIndex: 10,
                  }}
                >
                  <ArrowDownwardIcon sx={{ color: 'black' }} />
                </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Box>
      </Card>
      <Box className="mt-8">
        <SocialIcons />
      </Box>
    </>
  );
}