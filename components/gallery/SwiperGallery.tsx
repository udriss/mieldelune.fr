import ShareIcon from '@mui/icons-material/Share';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { FacebookShareButton, TwitterShareButton, PinterestShareButton, WhatsappShareButton } from 'react-share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import React, { useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, Navigation, Autoplay, Keyboard, EffectFade, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/thumbs';
import 'swiper/css/navigation';

export interface SwiperGalleryProps {
  images: { src: string; alt: string; thumb: string }[];
  initialIndex: number;
  onClose: () => void;
  weddingTitle?: string;
  getImageCaption?: (idx: number) => string;
}

// Composant InfoWhatsApp pour l'info-bulle
function InfoWhatsApp() {
  const [open, setOpen] = useState(false);
  
  const handleClickOutside = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  return (
    <>
      <IconButton
        size="small"
        sx={{ 
          color: 'white', 
          ml: 0.5, 
          p: 0.5,
          width: 32,
          height: 32,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          '&:hover': { 
            bgcolor: 'rgba(255, 255, 255, 0.3)',
            transform: 'scale(1.1)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
          }
        }}
        onClick={e => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        aria-label="Informations WhatsApp"
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <Tooltip
        open={open}
        title={
          <Box sx={{ maxWidth: 220, fontSize: 13, p: 0.5 }}>
            Sur ordinateur, WhatsApp Web s'ouvre dans le navigateur.<br />
            Sur mobile, l'application WhatsApp peut s'ouvrir si installée.
          </Box>
        }
        placement="right"
        arrow
        disableFocusListener
        disableHoverListener
        disableTouchListener
      >
        <span />
      </Tooltip>
    </>
  );
}

export default function SwiperGallery({ images, initialIndex, onClose, weddingTitle = '', getImageCaption }: SwiperGalleryProps) {
  // Partage réseaux sociaux
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const openShare = Boolean(shareAnchorEl);
  const handleShareClick = (event: React.MouseEvent<HTMLElement>) => {
    setShareAnchorEl(event.currentTarget);
  };
  const handleShareClose = () => {
    setShareAnchorEl(null);
  };
  const [zoomedIndex, setZoomedIndex] = useState<number|null>(null);
  const wasPausedBeforeZoomRef = useRef(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const captionFn = getImageCaption ? getImageCaption : (idx: number) => images[idx]?.alt || '';
  const isMobile = useMediaQuery('(max-width:600px)');
  const [fadeOut, setFadeOut] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = React.useState<any>(null);
  const mainSwiperRef = useRef<any>(null);
  const [autoplayProgress, setAutoplayProgress] = useState(0); // 0 à 1
  const [autoplayTime, setAutoplayTime] = useState(2000); // ms

  // Effet pour forcer la mise à jour des thumbs quand on dézoome
  React.useEffect(() => {
    if (!isZoomed && thumbsSwiper && !thumbsSwiper.destroyed && mainSwiperRef.current) {
      setTimeout(() => {
        const currentIndex = mainSwiperRef.current.swiper.activeIndex;
        const realIndex = mainSwiperRef.current.swiper.realIndex;
        
        
        // Force complete thumbs update
        thumbsSwiper.update && thumbsSwiper.update();
        
        // Use activeIndex for non-looped navigation, realIndex for looped
        const targetIndex = mainSwiperRef.current.swiper.params.loop ? realIndex : currentIndex;
        thumbsSwiper.slideTo(targetIndex, 0, false);
        
        // Force re-initialization of thumbs connection
        if (mainSwiperRef.current.swiper.thumbs) {
          mainSwiperRef.current.swiper.thumbs.init();
          mainSwiperRef.current.swiper.thumbs.update();
        }
        
        // Force active slide update on thumbs with correct index
        setTimeout(() => {
          if (thumbsSwiper.slides && thumbsSwiper.slides[targetIndex]) {
            // Remove active class from all thumbs
            thumbsSwiper.slides.forEach((slide: any) => {
              slide.classList.remove('swiper-slide-thumb-active');
            });
            // Add active class to current thumb
            thumbsSwiper.slides[targetIndex].classList.add('swiper-slide-thumb-active');
            
          }
        }, 10);
      }, 50);
    }
  }, [isZoomed, thumbsSwiper]);

  React.useEffect(() => {
    if (mainSwiperRef.current) {
      mainSwiperRef.current.swiper.slideTo(initialIndex, 0);
      // Sur mobile, forcer autoplay et pagination fraction
      if (isMobile) {
        mainSwiperRef.current.swiper.params.autoplay = { delay: 3500, disableOnInteraction: false };
        mainSwiperRef.current.swiper.autoplay.start();
        mainSwiperRef.current.swiper.params.pagination = { type: 'fraction' };
        mainSwiperRef.current.swiper.pagination.init();
        mainSwiperRef.current.swiper.pagination.render();
        mainSwiperRef.current.swiper.pagination.update();
      }
    }
  }, [initialIndex, isMobile]);

  // Handler pour la progression de l'autoplay (Material UI)
  const handleAutoplayTimeLeft = (_swiper: any, time: number, progress: number) => {
    setAutoplayProgress(progress);
    setAutoplayTime(time);
    if (progress === 0) {
      setShowProgress(true);
      setFadeOut(false);
    }
    if (progress >= 0.98) {
      setFadeOut(true);
      setTimeout(() => {
        setFadeOut(false);
        setShowProgress(false);
        setTimeout(() => setShowProgress(true), 50);
      }, 200);
    }
  };

  // Plein écran handlers
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fermer la galerie avec la touche Échap
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else if (isFullscreen) {
      document.exitFullscreen();
    }
  };

  // Zoom handlers - Refondus pour synchronisation parfaite
  const handleZoom = (idx: number) => {
    setZoomedIndex(idx);
    wasPausedBeforeZoomRef.current = isPaused;
    setIsPaused(true);
    if (mainSwiperRef.current) {
      mainSwiperRef.current.swiper.autoplay.stop();
    }
  };
  const handleCloseZoom = () => {
    setZoomedIndex(null);
    if (!wasPausedBeforeZoomRef.current) {
      setIsPaused(false);
      if (mainSwiperRef.current) {
        mainSwiperRef.current.swiper.autoplay.start();
      }
    }
    // Forcer la mise à jour des thumbs pour la classe active
    setTimeout(() => {
      if (thumbsSwiper && !thumbsSwiper.destroyed) {
        thumbsSwiper.update && thumbsSwiper.update();
        thumbsSwiper.slideTo(mainSwiperRef.current?.swiper.realIndex ?? 0, 0, false);
      }
    }, 50);
  };

  // Fermer la galerie si clic sur le fond
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current) {
      onClose();
    }
  };

  // Fonction pour simuler un appui sur le bouton pause/play
  const handlePause = () => {
    setIsPaused(prev => {
      const newPaused = !prev;
      if (mainSwiperRef.current) {
        if (!prev) {
          mainSwiperRef.current.swiper.autoplay.stop();
        } else {
          mainSwiperRef.current.swiper.autoplay.start();
        }
      }
      return newPaused;
    });
  };

  return (
    <Box
      ref={containerRef}
      sx={{ 
        position: 'fixed', inset: 0,
        mb: '0px !important',
        zIndex: 50, bgcolor: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleBackdropClick}
    >
      <IconButton onClick={onClose} sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        color: 'white', 
        zIndex: 100,
        width: 48,
        height: 48,
        bgcolor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '50%',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        '&:hover': { 
          bgcolor: 'rgba(255, 255, 255, 0.3)',
          transform: 'scale(1.1)',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
        }
      }}>
        <CloseIcon fontSize="large" />
      </IconButton>
      <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Cercle de progression autoplay Material UI */}
        <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          {/* Progress + Play/Pause ergonomique */}
          <Box 
            sx={{ position: 'relative', width: isMobile ? 48 : 72, height: isMobile ? 48 : 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-busy={showProgress && !isPaused}
            aria-describedby="gallery-autoplay-progress"
          >
            {showProgress && (
              <CircularProgress
                id="gallery-autoplay-progress"
                variant="determinate"
                value={100 - autoplayProgress * 100}
                size={isMobile ? 50 : 60}
                thickness={4}
                sx={{
                  color: '#1976d2',
                  bgcolor: 'transparent',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: 'auto',
                  opacity: fadeOut ? 0 : 1,
                  transition: fadeOut
                    ? 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.35s linear'
                    : 'stroke-dashoffset 0.35s linear',
                  '& .MuiCircularProgress-svg': {
                    transition: fadeOut
                      ? 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 0.35s linear'
                      : 'stroke-dashoffset 0.35s linear',
                  },
                }}
                key={Math.round(autoplayProgress * 100)}
              />
            )}
            <IconButton
              aria-label={isPaused ? 'Reprendre le diaporama' : 'Pause diaporama'}
              onClick={handlePause}
              sx={{
                color: 'white',
                width: 48,
                height: 48,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                p: 0,
                minWidth: 0,
                minHeight: 0,
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                '&:hover': { 
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translate(-50%, -50%) scale(1.1)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
                }
              }}
            >
              {isPaused ? <PlayArrowIcon fontSize={isMobile ? 'small' : 'medium'} /> : <PauseIcon fontSize={isMobile ? 'small' : 'medium'} />}
            </IconButton>
          </Box>
          {/* Bouton plein écran à côté */}
          <Box sx={{ position: 'relative', width: isMobile ? 48 : 72, height: isMobile ? 48 : 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Activer le plein écran'}
            onClick={handleFullscreen}
            sx={{
              color: 'white',
              width: 48,
              height: 48,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: 0,
              minWidth: 0,
              minHeight: 0,
              ml: 1,
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
              }
            }}
          >
            {isFullscreen ? <FullscreenExitIcon fontSize={isMobile ? 'small' : 'medium'} /> : <FullscreenIcon fontSize={isMobile ? 'small' : 'medium'} />}
          </IconButton>
          </Box>
          {/* Bouton zoom à droite du plein écran */}
          <Box sx={{ position: 'relative', width: isMobile ? 48 : 72, height: isMobile ? 48 : 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton
            aria-label={isZoomed ? 'Dézoomer' : 'Zoomer'}
            onClick={() => {
              const swiper = mainSwiperRef.current?.swiper;
              if (isZoomed) {
                // Dézoomer (simule un pinch out)
                if (swiper && swiper.zoom) {
                  swiper.zoom.out();
                }
              } else {
                // Zoomer (simule un pinch in) + PAUSE autoplay comme le double-clic
                if (swiper && swiper.zoom) {
                  // Simule le comportement du double-clic
                  if (swiper.autoplay && swiper.autoplay.running) {
                    wasPausedBeforeZoomRef.current = false;
                    setIsPaused(true);
                    swiper.autoplay.stop();
                  } else {
                    wasPausedBeforeZoomRef.current = true;
                  }
                  swiper.zoom.in();
                }
              }
            }}
            sx={{
              color: 'white',
              width: 48,
              height: 48,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: 0,
              minWidth: 0,
              minHeight: 0,
              ml: 1,
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
              }
            }}
          >
            {isZoomed ? <ZoomOutIcon fontSize={isMobile ? 'small' : 'medium'} /> : <ZoomInIcon fontSize={isMobile ? 'small' : 'medium'} />}
          </IconButton>
          </Box>
          <Box sx={{ position: 'relative', width: isMobile ? 48 : 72, height: isMobile ? 48 : 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Bouton partage à droite du zoom */}
          <IconButton
            aria-label="Partager"
            onClick={handleShareClick}
            sx={{
              color: 'white',
              width: 48,
              height: 48,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              p: 0,
              minWidth: 0,
              minHeight: 0,
              ml: 1,
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
              }
            }}
          >
            <ShareIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Menu
            anchorEl={shareAnchorEl}
            open={openShare}
            onClose={handleShareClose}
            slotProps={{
              paper: {
                sx: {
                  background: 'rgba(255, 255, 255, 0.09)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 6,
                  borderRadius: 2,
                  p: 1,
                  minWidth: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 1,
                }
              }
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
          >
            <MenuItem sx={{justifyContent:'center',p:1}} disableRipple>
              <FacebookShareButton url={typeof window !== 'undefined' ? window.location.href : ''} style={{width:'100%',display:'flex',justifyContent:'center'}}>
                <Box sx={{color:'white'}}>Facebook</Box>
              </FacebookShareButton>
            </MenuItem>
            <MenuItem sx={{justifyContent:'center',p:1}} disableRipple>
              <TwitterShareButton url={typeof window !== 'undefined' ? window.location.href : ''} style={{width:'100%',display:'flex',justifyContent:'center'}}>
                <Box sx={{color:'white'}}>X (Twitter)</Box>
              </TwitterShareButton>
            </MenuItem>
            <MenuItem sx={{justifyContent:'center',p:1}} disableRipple>
              <PinterestShareButton url={typeof window !== 'undefined' ? window.location.href : ''} media={images[0]?.src || ''} style={{width:'100%',display:'flex',justifyContent:'center'}}>
                <Box sx={{color:'white'}}>Pinterest</Box>
              </PinterestShareButton>
            </MenuItem>
            <MenuItem sx={{justifyContent:'center',p:1,display:'flex',alignItems:'center',gap:1}} disableRipple>
              <WhatsappShareButton url={typeof window !== 'undefined' ? window.location.href : ''} style={{width:'100%',display:'flex',justifyContent:'center'}}>
                <Box sx={{color:'white'}}>WhatsApp</Box>
              </WhatsappShareButton>
              <InfoWhatsApp />
            </MenuItem>
            <MenuItem sx={{justifyContent:'center',p:1}} disableRipple>
              <Box sx={{color:'white',opacity:0.5}}>Instagram (non supporté)</Box>
            </MenuItem>
            <MenuItem sx={{justifyContent:'center',p:1}} disableRipple>
              <Box sx={{color:'white',opacity:0.5}}>TikTok (non supporté)</Box>
            </MenuItem>
          </Menu>
          </Box>
        </Box>
        <Swiper
          ref={mainSwiperRef}
          spaceBetween={10}
          navigation
          loop
          autoplay={{ delay: 2000, disableOnInteraction: false }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={400}
          onAutoplayTimeLeft={handleAutoplayTimeLeft}
          onInit={swiper => {
            // Stop autoplay at mount
            if (swiper.autoplay && swiper.autoplay.running) {
              swiper.autoplay.stop();
            }
          }}
          onSlideChange={swiper => {
            
            if (thumbsSwiper && !thumbsSwiper.destroyed) {
              const targetIndex = swiper.params.loop ? swiper.realIndex : swiper.activeIndex;
              thumbsSwiper.slideTo(targetIndex, 400, false);
              
              // Force immediate active class update
              setTimeout(() => {
                if (thumbsSwiper.slides && thumbsSwiper.slides[targetIndex]) {
                  thumbsSwiper.slides.forEach((slide: any) => {
                    slide.classList.remove('swiper-slide-thumb-active');
                  });
                  thumbsSwiper.slides[targetIndex].classList.add('swiper-slide-thumb-active');
                }
              }, 50);
            }
          }}
          onZoomChange={(swiper, scale, imageEl, slideEl) => {
            
            if (scale > 1) {
              // Zoom-in : masquer les thumbs
              if (!isZoomed) {
                setIsZoomed(true);
                
              }
            } else if (scale === 1) {
              // Dézoom : réafficher les thumbs et reprendre autoplay si besoin
              if (isZoomed) {
                setIsZoomed(false);
                
                // if (!wasPausedBeforeZoomRef.current) {
                if (1 === 1) {
                  setIsPaused(false);
                  setShowProgress(true);
                  if (mainSwiperRef.current) {
                    mainSwiperRef.current.swiper.autoplay.start();
                    
                  }
                  
                } else {
                  
                }
              }
            }
          }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          keyboard={{ enabled: true }}
          pagination={{ type: 'fraction' }}
          zoom={true}
          modules={[Thumbs, Navigation, Autoplay, Keyboard, EffectFade, Pagination, Zoom]}
          className="w-full h-[60vh] mb-4"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div
                className="swiper-zoom-container"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '80vh',
                  minHeight: '60vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
                onDoubleClick={() => {
                  // Forcer la pause AVANT le zoom
                  if (mainSwiperRef.current && mainSwiperRef.current.swiper.autoplay.running) {
                    wasPausedBeforeZoomRef.current = false;
                    setIsPaused(true);
                    mainSwiperRef.current.swiper.autoplay.stop();
                  } else {
                    wasPausedBeforeZoomRef.current = true;
                  }
                }}
              >
                <Box
                  component="img"
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="swiper-lazy"
                  sx={{
                    objectFit: 'contain',
                    width: '100%',
                    height: '100%',
                    maxHeight: '80vh',
                    minHeight: '60vh',
                    cursor: 'zoom-in'
                  }}
                />
                <Box className="swiper-lazy-preloader swiper-lazy-preloader-white" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {!isZoomed && (
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={isFullscreen ? 12 : 6}
            slidesPerGroup={2}
            freeMode
            watchSlidesProgress
            centeredSlides
            slideToClickedSlide
            modules={[Thumbs]}
            className="h-24"
            style={{ marginTop: 8, width: isFullscreen ? '100vw' : undefined, maxWidth: isFullscreen ? 'none' : 900 }}
          >
            {images.map((img, idx) => (
              <SwiperSlide key={idx} className="swiper-slide-thumb">
                <Box sx={{ width: '100%',
                  height: 80, overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={img.thumb}
                    alt={img.alt}
                    loading="lazy"
                    className="swiper-lazy thumb-image"
                    sx={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                  />
                  <Box className="swiper-lazy-preloader swiper-lazy-preloader-white" />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </Box>
      <style jsx global>{`
        /* Bordure rouge par défaut sur toutes les miniatures */
        .swiper.h-24 .thumb-image {
          border: 1px solid #ffbcbcff;
          border-radius: 12px;
          transition: border 0.2s;
          cursor: pointer;
        }
        /* Bordure blanche uniquement sur la miniature active */
        .swiper.h-24 .swiper-slide-thumb-active .thumb-image {
          border: 2.5px solid #fff !important;
          border-radius: 12px !important;
        }
        /* Curseur pointer sur les miniatures */
        .swiper.h-24 .swiper-slide-thumb {
          cursor: pointer;
        }
        /* Déplacer les flèches Swiper plus vers l'extérieur */
        /* Flèches Swiper en dehors du Swiper, centrées verticalement sur l'écran */
        /* Flèches Swiper à 50px du bord du Swiper principal */
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-next,
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-prev {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 110 !important;
          width: 70px !important;
          height: 70px !important;
          background: rgba(255, 255, 255, 0.2) !important;
          border-radius: 50% !important;
          backdrop-filter: blur(8px) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-next:hover,
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-prev:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-50%) scale(1.1) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25) !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-next:after,
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-prev:after {
          font-size: 30px !important;
          color: white !important;
          font-weight: bold !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 {
          overflow: visible !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-next {
          right: -50px !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-prev {
          left: -50px !important;
        }
        @media (max-width: 1000px) {
          .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-next {
            right: 8px !important;
          }
          .swiper.w-full.h-\[60vh\].mb-4 .swiper-button-prev {
            left: 8px !important;
          }
        }

        /* Masquer les slides précédents et suivants, n'afficher que l'image active */
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-slide {
          transition: opacity 0.5s cubic-bezier(0.4,0,0.2,1) !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-slide:not(.swiper-slide-active) {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .swiper.w-full.h-\[60vh\].mb-4 .swiper-slide-active {
          opacity: 1 !important;
          z-index: 2;
        }
      `}</style>
    </Box>
  );
}
