'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Box, 
  Typography, 
  Container, 
  Paper,
  Button as MuiButton
} from '@mui/material';

export default function NotFoundPage() {
  const [showAnimation, setShowAnimation] = useState(false);
  const pathname = usePathname();

  // Function to generate page title based on URL
  const generatePageTitle = (pathname: string | null): string => {
    if (!pathname) {
      return 'Page Introuvable | MielDeLune';
    }
    
    if (pathname.startsWith('/mariage/')) {
      return 'Mariage | MielDeLune - Introuvable';
    }
    if (pathname.startsWith('/page/')) {
      return 'Page | MielDeLune - Introuvable';
    }
    if (pathname.startsWith('/contact')) {
      return 'Contact | MielDeLune - Introuvable';
    }
    if (pathname.startsWith('/artiste')) {
      return 'Artiste | MielDeLune - Introuvable';
    }
    if (pathname.startsWith('/reserver')) {
      return 'Réserver | MielDeLune - Introuvable';
    }
    // Default fallback
    return 'Page Introuvable | MielDeLune';
  };

  useEffect(() => {
    // Set the page title dynamically
    document.title = generatePageTitle(pathname);
    
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'transparent', // Fond transparent
        // backdropFilter: 'blur(12px)', // Effet de flou
        position: 'relative'
      }}
    >
      {/* Main Content Container */}
      <Container 
        component="main" 
        maxWidth="md"
        sx={{ 
          flex: 1, 
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            textAlign: 'center', 
            p: 4, 
            maxWidth: '600px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fond semi-transparent
            backdropFilter: 'blur(8px)', // Flou supplémentaire
            border: '1px solid rgba(255, 255, 255, 0.2)', // Bordure subtile
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Animated Heart Icon */}
          <Box sx={{ position: 'relative', width: 128, height: 128, mx: 'auto', mb: 4 }}>
            <Heart 
              className="absolute inset-0 w-full h-full text-pink-500" 
              // className="absolute inset-0 w-full h-full text-pink-500 animate-[heartbeat_5s_ease-in-out_infinite]" 
              strokeWidth={1.5} 
            />
            <HeartOff 
              className={`
                absolute inset-0 w-full h-full text-gray-800/80
                transition-opacity
                ${showAnimation ? 'opacity-100 animate-[fadeInHeart_1.5s_ease-in-out_infinite]' : 'opacity-0'}
              `}
              strokeWidth={2} 
            />
          </Box>

          {/* Error Message */}
          <Typography 
            variant="h2" 
            component="h1"
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '3rem' },
              fontWeight: 'bold', 
              color: 'text.primary',
              mb: 3
            }}
          >
            Page introuvable
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary',
              mb: 4,
              lineHeight: 1.6
            }}
          >
            Cette page a peut-être été déplacée ou n&apos;existe plus, comme un amour perdu...
          </Typography>

          {/* Return Button */}
          <MuiButton 
            variant="contained"
            component={Link}
            href="/"
            sx={{ 
              mt: 2,
              backgroundColor: '#ec4899', 
              '&:hover': { backgroundColor: '#db2777' },
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none'
            }}
          >
            Retourner à l&apos;accueil
          </MuiButton>
        </Paper>
      </Container>
      
      {/* CSS personnalisé pour les animations */}

    </Box>
  );
}