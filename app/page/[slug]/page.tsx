'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button,
  Container,
  CircularProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { Lock, Eye } from 'lucide-react';
import { myFetch } from '@/lib/fetch-wrapper';
import Image from 'next/image';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  isPasswordProtected: boolean;
  password?: string;
  isPublished: boolean;
  isRandomSlug: boolean;
  showTitle?: boolean; // Nouveau: contrôle l'affichage du titre sur la page
  // Nouvelles propriétés pour la personnalisation du titre
  titleSettings?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
    color?: string;
  };
  content: ContentElement[];
  createdAt: number;
  updatedAt: number;
}

interface ContentElement {
  id: string;
  type: 'title' | 'text' | 'image' | 'video';
  content: string;
  order: number;
  settings?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    width?: string | '100%' | '50%'; // Largeur pour images et vidéos
    height?: string;
    alt?: string;
    autoplay?: boolean;
    controls?: boolean;
    // Nouvelles propriétés pour la typographie
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
    color?: string;
  };
}

// Hook pour charger les Google Fonts au niveau global
function useGoogleFonts(page: CustomPage | null) {
  useEffect(() => {
    if (!page) return;

    const fontsToLoad = new Set<string>();
    
    // Ajouter la police du titre si elle existe
    if (page.titleSettings?.fontFamily && 
        page.titleSettings.fontFamily !== 'Arial' && 
        page.titleSettings.fontFamily !== 'Times New Roman') {
      fontsToLoad.add(page.titleSettings.fontFamily);
    }
    
    // Ajouter les polices des éléments de contenu
    page.content.forEach(element => {
      if (element.type === 'title' || element.type === 'text') {
        const fontFamily = element.settings?.fontFamily;
        if (fontFamily && fontFamily !== 'Arial' && fontFamily !== 'Times New Roman') {
          fontsToLoad.add(fontFamily);
        }
      }
    });

    fontsToLoad.forEach(fontFamily => {
      const fontId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      let link = document.getElementById(fontId) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [page]);
}

export default function CustomPageView() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Charger les Google Fonts pour cette page
  useGoogleFonts(page);

  useEffect(() => {
    if (slug) {
      fetchPage();
    }
  }, [slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await myFetch(`/api/page/${slug}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Page non trouvée');
        } else if (response.status === 403) {
          setError('Page non publiée');
        } else {
          setError('Erreur lors du chargement de la page');
        }
        return;
      }

      const data = await response.json();
      setPage(data.page);
      
      // Si la page n'est pas protégée par mot de passe, on peut l'afficher directement
      if (!data.page.isPasswordProtected) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la page:', error);
      setError('Erreur lors du chargement de la page');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!page) return;

    try {
      const response = await myFetch(`/api/page/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setPage(data.page); // Mettre à jour avec le contenu complet
        setIsAuthenticated(true);
        setError(null);
      } else {
        setError('Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      setError('Erreur lors de la vérification du mot de passe');
    }
  };

  const renderContentElement = (element: ContentElement) => {
    const { type, content, settings } = element;
    
    const fontFamily = settings?.fontFamily || 'Montserrat';
    const fontSize = settings?.fontSize;
    const fontWeight = settings?.fontWeight || '400';
    const color = settings?.color || '#000000';

    switch (type) {
      case 'title':
        const level = settings?.level || 1;
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        const defaultSize = fontSize || (4 - level * 0.5);
        
        return (
          <Tag key={element.id} style={{ 
            margin: '1.5rem 0',
            fontSize: fontSize ? `${fontSize}px` : `${defaultSize}rem`,
            fontWeight: fontWeight,
            fontFamily: `'${fontFamily}', Arial, sans-serif`,
            color: color,
            lineHeight: 1.2
          }}>
            {content}
          </Tag>
        );

      case 'text':
        return (
          <Typography key={element.id} paragraph style={{ 
            margin: '1rem 0',
            lineHeight: 1.6,
            color: color,
            fontSize: fontSize ? `${fontSize}px` : '16px',
            fontWeight: fontWeight,
            fontFamily: `'${fontFamily}', Arial, sans-serif`
          }}>
            {content}
          </Typography>
        );

      case 'image':
        const isExternalImage = content.startsWith('http');
        return (
          <Box key={element.id} sx={{ margin: '1rem 0', textAlign: 'center' }}>
            {isExternalImage ? (
              <img
                src={content}
                alt={settings?.alt || 'Image'}
                style={{
                  maxWidth: settings?.width || '100%',
                  height: settings?.height || 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <Image
                src={content}
                alt={settings?.alt || 'Image'}
                width={parseInt(settings?.width || '800')}
                height={parseInt(settings?.height || '600')}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            )}
          </Box>
        );

      case 'video':
        const embedUrl = getVideoEmbedUrl(content);
        const isYouTubeOrVimeo = getYouTubeVideoId(content) || getVimeoVideoId(content);
        const videoWidth = settings?.width === '50%' ? '50%' : '100%';
        const maxWidth = settings?.width === '50%' ? '400px' : '800px';
        
        return (
          <Box key={element.id} sx={{ 
            margin: '1rem 0', 
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box sx={{ 
              width: videoWidth,
              maxWidth: maxWidth,
              position: 'relative'
            }}>
              {isYouTubeOrVimeo && embedUrl ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="400"
                  style={{
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={content}
                  controls={settings?.controls !== false}
                  autoPlay={settings?.autoplay || false}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  // Fonction pour extraire l'ID d'une vidéo YouTube
  function getYouTubeVideoId(url: string): string | null {
    const regexs = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const regex of regexs) {
      const match = url.match(regex);
      if (match) return match[1];
    }
    return null;
  }

  // Fonction pour extraire l'ID d'une vidéo Vimeo
  function getVimeoVideoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
  }

  // Fonction pour obtenir l'URL d'embed d'une vidéo
  function getVideoEmbedUrl(url: string): string | null {
    const youtubeId = getYouTubeVideoId(url);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }
    
    const vimeoId = getVimeoVideoId(url);
    if (vimeoId) {
      return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    // Si ce n'est ni YouTube ni Vimeo, retourner l'URL originale
    return url;
  }

  if (loading) {
    return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: 4, 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}
    >
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Chargement de la page...</Typography>
    </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button href="/" variant="contained">
          Retour à l'accueil
        </Button>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Page non trouvée
        </Alert>
        <Button href="/" variant="contained">
          Retour à l'accueil
        </Button>
      </Container>
    );
  }

  // Si la page est protégée et qu'on n'est pas authentifié
  if (page.isPasswordProtected && !isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Lock style={{ fontSize: 60, color: '#1976d2' }} />
            </Box>
            <Typography variant="h5" gutterBottom>
              Page protégée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Cette page est protégée par un mot de passe
            </Typography>
            
            <Box component="form" onSubmit={handlePasswordSubmit}>
              <TextField
                type={showPassword ? 'text' : 'password'}
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <Button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      <Eye size={20} />
                    </Button>
                  ),
                }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
              >
                Accéder à la page
              </Button>
              
              <Button href="/" variant="text" fullWidth>
                Retour à l'accueil
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Affichage de la page
  return (
    <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        {/* Affichage conditionnel du titre avec personnalisation */}
        {(page.showTitle !== false) && (
          <Typography variant="h3" gutterBottom sx={{ 
            textAlign: 'center',
            color: page.titleSettings?.color || 'primary.main',
            fontWeight: page.titleSettings?.fontWeight || 'bold',
            fontFamily: page.titleSettings?.fontFamily ? `'${page.titleSettings.fontFamily}', Arial, sans-serif` : 'inherit',
            fontSize: page.titleSettings?.fontSize ? `${page.titleSettings.fontSize}px` : 'inherit',
            mb: 4 
          }}>
            {page.title}
          </Typography>
        )}
        
        <Box sx={{ minHeight: '50vh' }}>
          {page.content
            .sort((a, b) => a.order - b.order)
            .map(renderContentElement)}
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
          <Button href="/" variant="outlined">
            Retour à l'accueil
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
