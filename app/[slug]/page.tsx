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
    width?: string;
    height?: string;
    alt?: string;
    autoplay?: boolean;
    controls?: boolean;
  };
}

export default function CustomPageView() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordChecking, setIsPasswordChecking] = useState(false);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const response = await myFetch(`/api/page/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPage(data.page);
      } else {
        setError(data.error || 'Page non trouvée');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la page:', error);
      setError('Erreur lors du chargement de la page');
    } finally {
      setLoading(false);
    }
  };

  const checkPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Mot de passe requis');
      return;
    }

    try {
      setIsPasswordChecking(true);
      setPasswordError(null);
      
      const response = await myFetch(`/api/page/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPage(data.page);
      } else {
        setPasswordError(data.error || 'Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du mot de passe:', error);
      setPasswordError('Erreur lors de la vérification');
    } finally {
      setIsPasswordChecking(false);
    }
  };

  const renderContentElement = (element: ContentElement) => {
    switch (element.type) {
      case 'title':
        const HeadingTag = `h${element.settings?.level || 1}` as keyof JSX.IntrinsicElements;
        return (
          <Typography
            key={element.id}
            component={HeadingTag}
            variant={`h${element.settings?.level || 1}` as any}
            sx={{ mb: 2, fontWeight: 600 }}
          >
            {element.content}
          </Typography>
        );

      case 'text':
        return (
          <Typography
            key={element.id}
            variant="body1"
            sx={{ mb: 3, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
          >
            {element.content}
          </Typography>
        );

      case 'image':
        return (
          <Box key={element.id} sx={{ mb: 3, textAlign: 'center' }}>
            <Image
              src={element.content}
              alt={element.settings?.alt || 'Image'}
              width={800}
              height={600}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              priority={false}
            />
            {element.settings?.alt && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {element.settings.alt}
              </Typography>
            )}
          </Box>
        );

      case 'video':
        return (
          <Box key={element.id} sx={{ mb: 3, textAlign: 'center' }}>
            <video
              controls={element.settings?.controls !== false}
              autoPlay={element.settings?.autoplay || false}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <source src={element.content} />
              Votre navigateur ne supporte pas cette vidéo.
            </video>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => window.history.back()}>
          Retour
        </Button>
      </Container>
    );
  }

  if (!page) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="info">
          Page non trouvée
        </Alert>
      </Container>
    );
  }

  // Si la page est protégée par mot de passe et qu'on n'a pas encore saisi le bon mot de passe
  if (page.isPasswordProtected && page.content.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box display="flex" justifyContent="center" mb={3}>
            <Lock size={48} color="#999" />
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Page protégée
          </Typography>
          
          <Typography variant="body1" color="textSecondary" mb={4}>
            Cette page est protégée par un mot de passe. Veuillez entrer le mot de passe pour y accéder.
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              type="password"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              onKeyPress={(e) => e.key === 'Enter' && checkPassword()}
              disabled={isPasswordChecking}
            />
            
            <Button
              variant="contained"
              onClick={checkPassword}
              disabled={isPasswordChecking || !password.trim()}
              startIcon={isPasswordChecking ? <CircularProgress size={20} /> : <Eye />}
            >
              {isPasswordChecking ? 'Vérification...' : 'Accéder à la page'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, minHeight: '80vh' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          {page.title}
        </Typography>
        
        {page.content.length === 0 ? (
          <Alert severity="info">
            Cette page ne contient pas encore de contenu.
          </Alert>
        ) : (
          <Box>
            {page.content
              .sort((a, b) => a.order - b.order)
              .map(element => renderContentElement(element))}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
