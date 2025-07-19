import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Profile } from '@/lib/dataProfil';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { Loader2, ExternalLink } from "lucide-react";
import { debounce } from 'lodash';
import { myFetch } from '@/lib/fetch-wrapper';
import { FaTiktok, FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import type { SocialMediaData } from '@/lib/utils/data-parser';
import { 
  Paper, 
  Grid, 
  Typography, 
  TextField, 
  IconButton, 
  Box, 
  ToggleButtonGroup, 
  ToggleButton,
  LinearProgress,
  Collapse,
  Button as MuiButton,
  Chip,
  Stack,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { 
  CompressOutlined,
  StopOutlined,
  ExpandMoreOutlined,
  ExpandLessOutlined,
  BarChartOutlined,
  ArrowForwardOutlined,
  ZoomInOutlined,
  Upload
} from '@mui/icons-material';


interface CompressionStat {
  imageName: string;
  originalSize: number;
  finalSize: number;
  compressionRate: number;
  targetSize: number;
}

interface AdminProfilProps {
  profile: Profile;
  setProfile: (profile: Profile[]) => void;
}

interface FieldState {
  value: string;
  status: 'idle' | 'typing' | 'updating' | 'success' | 'error';
  timer?: NodeJS.Timeout;
}

interface FieldStates {
  [key: string]: FieldState;
}

interface FieldValues {
  [key: string]: string;
}

interface SocialMedia {
  id: string;
  name: string;
  enabled: boolean;
  link: string;
  icon: React.ReactNode;
}

export default function AdminProfil({ profile, setProfile }: AdminProfilProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'profileLink' | 'profileStorage' | 'profileThumbnail' | null>(null);
  const [showAddImage, setShowAddImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldStates, setFieldStates] = useState<FieldStates>({});
  const [socials, setSocials] = useState<SocialMediaData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  // États pour la compression et thumbnails
  const [isProcessingThumbnail, setIsProcessingThumbnail] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [compressionStats, setCompressionStats] = useState<CompressionStat | null>(null);
  const [showStatsDetails, setShowStatsDetails] = useState(false);
  const [resizeValue, setResizeValue] = useState(85);
  
  // États pour le glisser-déposer et aperçu
  const [isDragging, setIsDragging] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTabValue, setPreviewTabValue] = useState(0);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);

  function getIconComponent(icon: string): React.ReactNode {
    switch (icon.toLowerCase()) {
      case 'tiktok':
        return <FaTiktok />;
      case 'instagram':
        return <FaInstagram />;
      case 'facebook':
        return <FaFacebook />;
      case 'whatsapp':
        return <FaWhatsapp />;
      default:
        return null;
    }
  }

  useEffect(() => {
    async function loadSocialMediaInfo() {
      try {
        const response = await fetch('/api/getSocialMediaInfo');
        const data = await response.json();
        setSocials(data);
      } catch (error) {
        console.error('Error loading social media info:', error);
      }
    }
    
    loadSocialMediaInfo();
  }, []);

  // Map the socials object to array for rendering
  const socialEntries = Object.entries(socials).map(([id, data]) => ({
    id,
    name: data.label,
    icon: getIconComponent(data.icon),
    link: data.href,
    showed: data.showed,
    hoverColor: data.hoverColor,
    hoverIcon: data.hoverIcon
  }));

  const generateProfileThumbnail = async () => {
    if (!profile?.imageUrl || profile.imagetype !== 'profileStorage') return;
  
    setIsProcessingThumbnail(true);
    setCompressionStats(null);
    setThumbnailProgress(0);
    
    try {
      // Simuler le progrès pendant le traitement
      const progressInterval = setInterval(() => {
        setThumbnailProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);

      const response = await fetch('/api/generate-thumbnail/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: 'Profil', // Dossier pour les images de profil
          imageUrl: profile.imageUrl,
          resizePercentage: resizeValue,
          isProfile: true
        }),
      });

      clearInterval(progressInterval);
      setThumbnailProgress(100);
  
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        toast.error(`Échec de la génération de la vignette : ${data.error || 'Erreur inconnue'}`, {
          position: "top-center",
          autoClose: 2000,
        });
        return;
      }

      // Mise à jour des stats de compression
      if (data.stats) {
        setCompressionStats(data.stats);
        setShowStatsDetails(true);
      }

      // Rafraîchir le profil pour obtenir la nouvelle vignette
      await fetchProfile();
      
      toast.success('Miniature générée avec succès !', {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la vignette:', error);
      toast.error('Erreur lors de la génération de la vignette', {
        position: "top-center",
        autoClose: 2000,
      });
    } finally {
      setIsProcessingThumbnail(false);
      setTimeout(() => {
        setThumbnailProgress(0);
      }, 2000);
    }
  };

  const getImageUrl = (profile: Profile, thumbnail: boolean = false, disableCache: boolean = true) => {
    if (profile.imagetype === 'profileStorage') {
      // Utiliser la vignette si disponible et demandée
      const url = thumbnail && profile.imageUrlThumbnail ? 
        profile.imageUrlThumbnail : 
        profile.imageUrl;
      const cacheParam = disableCache ? `&isCachingTriggle=true&t=${Date.now()}` : '';
      return `/api/images?fileUrl=${url}${cacheParam}`;
    }
    return `${profile.imageUrl}${disableCache ? `?t=${Date.now()}` : ''}`;
  };


  const fetchProfile = async () => {
    try {
      const res = await myFetch('/api/profile', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: {
          revalidate: 0,
          tags: ['profile']
        }
      });
      const data = await res.json();
      if (data.profile) {
        setProfile([data.profile]);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des mariages');
    }
  };
  

  useEffect(() => {
    fetchProfile();
    //
  }, []);

useEffect(() => {
  if (profile) {
    setFieldValues({
      socialUrl: profile.socialUrl || '',
      artistName: profile.artistName || '',
      subTitle: profile.subTitle || '',
      description: profile.description || ''
    });
  }
  //
}, [profile]);


  const handleInputChange = (field: string, value: string) => {
    //
    
    setFieldValues(prev => ({
      ...prev,
      [field]: value
    }));
  
    if (fieldStates[field]?.timer) {
      clearTimeout(fieldStates[field].timer);
      //
    }
  
    const newTimer = setTimeout(() => {
      //
      updateField(field, value);
    }, 1500);
  
    setFieldStates(prev => ({
      ...prev,
      [field]: {
        value,
        status: 'typing',
        timer: newTimer
      }
    }));
  };

  const updateField = async (field: string, value: string) => {
    try {
      //
      //
      
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          value,
          status: 'updating',
          timer: undefined
        }
      }));
  
      const response = await myFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [field]: value
        })
      });
  
      if (!response.ok) throw new Error('Failed to update');

      //
      
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          value,
          status: 'success',
          timer: undefined
        }
      }));
  
    } catch (error) {
      console.error('Update failed:', error);
      setFieldStates(prev => ({
        ...prev,
        [field]: {
          value,
          status: 'error',
          timer: undefined
        }
      }));
    }
  };

const getInputStyle = (field: string) => {
  const status = fieldStates[field]?.status;
  return `col-span-5 transition-colors duration-300 ${
    status === 'typing' ? 'bg-orange-50 border-red-300' :
    status === 'updating' ? 'bg-orange-100 border-orange-500' :
    status === 'error' ? 'bg-red-50 border-red-500' :
    status === 'success' ? 'bg-green-50 border-green-500' : ''
  }`;
  };

  // };

  interface UploadResponse {
    success: boolean;
    error?: string;
    data: {
      imageUrl: string;
      imagetype: 'profileStorage' | 'profileLink';
    };
  }

  const validateUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const urlObj = new URL(url, window.location.origin);

    // Check if the URL has a valid image extension
    const hasImageExtension = imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(`.${ext}`));

    return regex.test(url) && hasImageExtension;
  };
  interface UrlChangeEvent {
    target: {
      value: string;
    }
  }



  const handleUrlChange = (e: UrlChangeEvent): void => {
    const url: string = e.target.value;
    setNewImageUrl(url);
    setIsValidUrl(validateUrl(url));
  };

  const handleImageUpload = async (
    source: File | string,
    type: 'profileStorage' | 'profileLink'
) => {
    if (typeof source === 'string') {
      // Handle URL upload (no changes needed)
      const formData = new FormData();
      formData.append('url', source);
      // ...existing URL upload code...
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', source);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              setProfile([{
                ...profile,
                imageUrl: response.data.imageUrl,
                imagetype: response.data.imagetype
              }]);
              toast.success('Image mise à jour avec succès');
              setShowAddImage(false);
            }
          } catch (error) {
            toast.error('Erreur lors du traitement de la réponse');
          }
        } else {
          toast.error('Erreur lors du téléchargement');
        }
        setIsUploading(false);
        resolve();
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast.error('Erreur réseau');
        reject(new Error('Network error'));
      };

      xhr.open('POST', '/api/uploadProfil', true);
      xhr.send(formData);
    });
};

  const handleSubmit = async () => {
    try {
      await myFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      
      setProfile([profile]); // Ensure parent state is updated
      toast.success('🎉 Profil mis à jour', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        },
      });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCancelUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonctions pour le glisser-déposer
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageUpload(files[0], 'profileStorage');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0], 'profileStorage');
    }
  };

  const handleToggle = (id: string) => {
    setSocials(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        showed: !prev[id].showed
      }
    }));
  };
  
  const handleLinkChange = (id: string, newLink: string) => {
    setSocials(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        href: newLink
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = Object.fromEntries(
        socialEntries.map(({ id, link, showed }) => [
          id,
          {
            ...socials[id],
            href: link,
            showed: showed
          }
        ])
      );

      const response = await fetch('/api/getSocialMediaInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('🎉 Les réseaux sociaux ont été mis à jour', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        },
      });
    } catch (error) {
      toast.success('Échec de la mise à jour des réseaux sociaux', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '400px',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Grid container spacing={2} direction={'column'} className="mb-8">

      
    <Paper elevation={1} sx={{ mt: 8, width: '800px', p: 3, borderRadius: 2, border: '1px solid #e5e7eb', maxWidth: '800px', margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Profil
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => window.open('/artiste', '_blank')}
            title="Voir la page artiste"
            sx={{ 
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              '&:hover': {
                backgroundColor: '#eff6ff',
                borderColor: '#2563eb'
              }
            }}
          >
            <ExternalLink size={16} />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            Voir la page de profil
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={2} direction={'row'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        justifyItems: 'center',
        flexWrap: 'wrap',
        mb: 2
      }}>
        <Grid size={{ xs:'grow' }}>
          <Typography variant='body2' className="text-right" sx={{ whiteSpace: 'nowrap', color: 'rgb(177, 177, 177)' }}>
            Réseau social principal
          </Typography>
        </Grid>
        <Grid size={{ xs:9 }}>
          <Input
            className={getInputStyle('socialUrl')}
            value={fieldValues.socialUrl || ''}
            onChange={(e) => handleInputChange('socialUrl', e.target.value)}
            placeholder="URL du réseau social"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} direction={'row'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        justifyItems: 'center',
        flexWrap: 'wrap',
        mb: 2,
      }}>
        <Grid size={{ xs:'grow' }}>
          <Typography variant="body2" className="text-right" sx={{ whiteSpace: 'nowrap', color: 'rgb(177, 177, 177)' }}>
            Nom d'artiste
          </Typography>
        </Grid>
        <Grid size={{ xs:9 }}>
          <Input
            className={getInputStyle('artistName')}
            value={fieldValues.artistName || ''}
            onChange={(e) => handleInputChange('artistName', e.target.value)}
            placeholder="Nom d'artiste"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} direction={'row'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        justifyItems: 'center',
        flexWrap: 'wrap',
        mb: 2,
      }}>
      <Grid size={{ xs:'grow' }}>
          <Typography variant="body2" className="text-right" sx={{ whiteSpace: 'nowrap', color: 'rgb(177, 177, 177)' }}>
            Sous-titre
          </Typography>
        </Grid>
        <Grid size={{ xs:9 }}>
          <Input
            className={getInputStyle('subTitle')}
            value={fieldValues.subTitle || ''}
            onChange={(e) => handleInputChange('subTitle', e.target.value)}
            placeholder="Ex: Photographe professionnel, Artiste digital, etc."
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} direction={'row'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        justifyItems: 'center',
        flexWrap: 'wrap',
        mb: 2,
      }}>
      <Grid size={{ xs:'grow' }}>
          <Typography variant="body2" className="text-right" sx={{ whiteSpace: 'nowrap', color: 'rgb(177, 177, 177)' }}>
            Description
          </Typography>
        </Grid>
        <Grid size={{ xs:9 }}>
          <TextField
            multiline
            minRows={4}
            maxRows={12}
            fullWidth
            variant="outlined"
            value={fieldValues.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Description"
            slotProps={{
              input:{
                style: {
                  overflowY: 'auto',
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: fieldStates.description?.status === 'typing' ? '#fff7ed' : 
                     fieldStates.description?.status === 'updating' ? '#ffedd5' :
                     fieldStates.description?.status === 'error' ? '#fef2f2' :
                     fieldStates.description?.status === 'success' ? '#f0fdf4' : 'transparent',
                transition: 'background-color 0.3s',
                '& fieldset': {
                  borderColor: fieldStates.description?.status === 'typing' ? '#fdba74' : 
                       fieldStates.description?.status === 'updating' ? '#f97316' :
                       fieldStates.description?.status === 'error' ? '#ef4444' :
                       fieldStates.description?.status === 'success' ? '#22c55e' : 'inherit',
                }
              }
            }}
          />
        </Grid>
      </Grid>
      {/* élément enlevé car enregistrement automatique*/}
      <Grid container spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
        <Grid >
          <MuiButton
            variant="outlined"
            onClick={handleSubmit}
            sx={{
              bgcolor: 'white',
              borderColor: 'gray.300',
              color: 'black',
              '&:hover': {
                bgcolor: 'green.100', // correspond à hover:bg-green-100
                borderColor: 'gray.300',
              },
            }}
          >
            Enregistrer le profil
          </MuiButton>
        </Grid>
      </Grid>
    </Paper>

      <Paper elevation={1} sx={{ mt: 8, width: '800px', p: 3, borderRadius: 2, border: '1px solid #e5e7eb',
         maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Image de profil
        </Typography>
      <Grid container spacing={2} sx={{ border: '1px solid #e5e7eb', borderRadius: 1, p: 1, minHeight: 150 }}>
        <Grid size={{ xs: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" height="100%">
            {profile?.imageUrl ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={profile.imageUrlThumbnail 
                      ? getImageUrl(profile, true, true) 
                      : getImageUrl(profile, false, true)}
                    alt="Profile image"
                    sx={{
                      maxWidth: '1200px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      maxHeight: 'auto',
                    }}
                    key={`profile-${imageRefreshKey}-${profile.imageUrlThumbnail || 'no-thumb'}`}
                  />
                  <Tooltip title="Cliquez pour voir l'aperçu en grand format et comparer l'original avec la vignette">
                    <IconButton
                      size="small"
                      onClick={() => setShowPreviewDialog(true)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: '#3b82f6',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                        width: 24,
                        height: 24,
                      }}
                    >
                      <ZoomInOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {profile.imagetype === 'profileStorage' 
                    ? '(Stockage local)' 
                    : '(URL externe)'}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Pas d'image de profil
              </Typography>
            )}
          </Box>
        </Grid>
        
        <Grid size={{ xs: 3 }}>
          <Box display="flex" flexDirection="column" gap={2} justifyContent="flex-start" height="100%"
          sx={{
            minHeight: 100,
          }}>
          <Box display="flex" flexDirection="column" gap={2} justifyContent="center"
          sx={{
            height: '100%',
            maxHeight: 150,
          }}>
            {/* ToggleButtonGroup pour le choix du type d'upload */}
            <Box width="100%">
              <ToggleButtonGroup
                orientation="vertical"
                value={uploadType}
                exclusive
                onChange={(_, newType) => {
                  if (newType) {
                    setUploadType(newType);
                    setShowAddImage(true);
                  }
                }}
                size="small"
                sx={{ width: '100%' }}
              >
                <ToggleButton value="profileLink" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'flex-start' }}>
                  Lien web
                </ToggleButton>
                <ToggleButton value="profileStorage" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'flex-start' }}>
                  Upload de fichier
                </ToggleButton>
                <ToggleButton value="profileThumbnail" sx={{ fontSize: '0.75rem', py: 1, justifyContent: 'flex-start' }} disabled={isProcessingThumbnail}>
                  Produire la vignette
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
          </Box>
        </Grid>

        {showAddImage && (
          <Grid size={{ xs: 6 }}>
            <Box sx={{ 
              height: 200, 
              maxHeight: 230, 
              p: 2, 
              bgcolor: '#f9fafb', 
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'space-around',
            }}>
              {uploadType === 'profileLink' && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="textarea"
                    value={newImageUrl}
                    onChange={handleUrlChange}
                    placeholder="Entrez l'URL de l'image"
                    rows={3}
                    sx={{
                      width: '100%',
                      resize: 'vertical',
                      overflow: 'auto',
                      border: `2px solid ${isValidUrl ? '#aae4acff' : '#f44336'}`,
                      borderRadius: '4px',
                      padding: '8px',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <MuiButton
                  variant="outlined"
                  onClick={() => handleImageUpload(newImageUrl, 'profileLink')}
                  sx={{
                    bgcolor: 'white',
                    borderColor: 'gray.300',
                    color: 'black',
                    '&:hover': {
                    bgcolor: 'green.100',
                    borderColor: 'gray.300',
                    },
                  }}
                  >
                  Ajouter
                  </MuiButton>
                </Box>
              )}
              
              {uploadType === 'profileStorage' && (
                <Box>
                  {/* Zone de glisser-déposer */}
                  <Paper
                    variant="outlined"
                    sx={{
                      border: '2px dashed',
                      borderColor: isDragging ? 'primary.main' : 'grey.300',
                      backgroundColor: isDragging ? 'primary.light' : 'background.paper',
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'grey.50'
                      }
                    }}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                  >
                    <Stack spacing={1} alignItems="center">
                      <Upload style={{ width: 40, height: 40, color: '#9CA3AF' }} />
                      <Typography variant="body2" fontWeight="medium" color="text.primary">
                        Glissez-déposez vos images ici ou cliquez pour parcourir
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Formats acceptés: JPG, PNG, GIF, WEBP
                      </Typography>
                    </Stack>
                    <TextField
                      inputRef={fileInputRef}
                      type="file"
                      slotProps={{ 
                        htmlInput: {
                          accept: "image/*",
                          multiple: false
                        }
                      }}
                      disabled={isUploading}
                      onChange={handleFileSelect}
                      sx={{ display: 'none' }}
                    />
                  </Paper>
                  {isUploading && (
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <Typography variant="body2">Upload en cours...</Typography>
                        </Box>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={handleCancelUpload}
                        >
                          Annuler
                        </Button>
                      </Box>
                      <Box width="100%" height={8} bgcolor="#e5e7eb" borderRadius={4} overflow="hidden">
                        <Box 
                          height="100%" 
                          bgcolor="#3b82f6" 
                          borderRadius={4}
                          sx={{ 
                            width: `${uploadProgress}%`,
                            transition: 'width 0.3s'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" textAlign="center" mt={0.5}>
                        {uploadProgress.toFixed(0)} %
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {uploadType === 'profileThumbnail' && (
                <Box>
                  {profile?.imageUrl && profile.imagetype === 'profileLink' && (
                    <Box display="flex" alignItems="center" height="100%">
                      <Typography variant="body2" color="text.secondary">
                        Impossible de produire une vignette pour une image externe
                      </Typography>
                    </Box>
                  )}
                  
                  {profile?.imageUrl && profile.imagetype === 'profileStorage' && (
                    <Box display="flex" flexDirection="column" justifyContent="center" gap={2}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0,
                        }}
                      >
                        <Typography variant="overline" color="text.secondary">
                          <CompressOutlined fontSize="small" sx={{ mr: 1 }} />
                          Taille finale à conserver
                        </Typography>
                        <Typography variant="overline" color="text.secondary">
                          {resizeValue} % (compression à {100 - resizeValue} %)
                        </Typography>
                        <Box sx={{ width: 200, mt: 1 }}>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            value={resizeValue}
                            onChange={(e) => setResizeValue(Number(e.target.value))}
                            style={{
                              width: '100%',
                              height: '8px',
                              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${resizeValue}%, #e5e7eb ${resizeValue}%, #e5e7eb 100%)`,
                              borderRadius: '4px',
                              outline: 'none',
                              WebkitAppearance: 'none',
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box display="flex" justifyContent="center">
                        <MuiButton
                          variant="outlined"
                          onClick={generateProfileThumbnail}
                          disabled={isProcessingThumbnail}
                          sx={{
                            bgcolor: 'white',
                            borderColor: 'gray.300',
                            color: 'black',
                            '&:hover': {
                              bgcolor: 'green.100',
                              borderColor: 'gray.300',
                            },
                          }}
                        >
                          {isProcessingThumbnail ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              En cours...
                            </Box>
                          ) : (
                            'Lancer'
                          )}
                        </MuiButton>
                      </Box>
                      
                      {isProcessingThumbnail && (
                        <Box sx={{ p: 2, bgcolor: 'rgba(194, 194, 194, 0.29)', borderRadius: 1, border: '1px solid', borderColor: 'primary.main' }}>
                          <Box display="flex" flexDirection="column" gap={1}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <Typography variant="body2" color="primary.dark" fontWeight={500}>
                                Production : {Math.round(thumbnailProgress)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={thumbnailProgress} 
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Box informative sur les vignettes */}
      <Grid size={{ xs: 12 }}>
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#f3f4f6',
            borderRadius: 1,
            p: 2,
            border: '1px dashed #cbd5e1',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Une <strong>vignette&nbsp;</strong>est une version compressée de l'image de profil, générée pour accélérer le chargement côté client et réduire la consommation de données. Elle est utilisée dans l'interface pour un affichage plus rapide.
          </Typography>
        </Box>
      </Grid>

      {/* Statistiques de compression */}
      {compressionStats && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'success.50', 
          borderRadius: 1, 
          border: '1px solid', 
          borderColor: 'success.200'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="body2" color="success.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
              <BarChartOutlined fontSize="small" />
              Statistiques de compression - Image de profil
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setShowStatsDetails(!showStatsDetails)}
              sx={{ color: 'success.dark' }}
            >
              {showStatsDetails ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
            </IconButton>
          </Box>
          
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille originale :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.originalSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="info"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille finale :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.finalSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="success"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taille cible :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.targetSize.toFixed(1)}KB`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color="warning"
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="success.dark">Taux de compression :</Typography>
                <Chip 
                  size="small" 
                  label={`${compressionStats.compressionRate}%`}
                  sx={{ fontFamily: 'monospace', fontSize: '0.70rem', height: 20 }}
                  color={compressionStats.compressionRate > 0 ? 'success' : 'error'}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Détails de compression */}
          <Collapse in={showStatsDetails}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={500} color="success.dark" sx={{ mb: 1 }}>
                Détail de compression
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontFamily: 'monospace',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={compressionStats.imageName}
                >
                  {compressionStats.imageName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={`${compressionStats.originalSize.toFixed(1)}KB`}
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    color="info"
                    variant="outlined"
                  />
                  <ArrowForwardOutlined fontSize="small" sx={{ color: 'success.dark' }} />
                  <Chip
                    size="small"
                    label={`${compressionStats.finalSize.toFixed(1)}KB`}
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}
      </Paper>

      <Paper elevation={1} sx={{ mt: 8, width: '800px', p: 3, borderRadius: 2, border: '1px solid #e5e7eb',
         maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Réseaux sociaux</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        {socialEntries.map((social) => (
          <Box key={social.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: social.hoverColor || '#333', fontSize: '1.25rem' }}>
                  {social.icon}
                </Box>
                <Typography variant="body1">
                  {social.name}
                </Typography>
              </Box>
              <Switch
                checked={social.showed}
                onCheckedChange={() => handleToggle(social.id)}
              />
            </Box>
            
            {social.showed && (
              <Box sx={{ px: 2 }}>
                <Input
                  type="text"
                  placeholder={`Lien ${social.name}`}
                  value={social.link}
                  onChange={(e) => handleLinkChange(social.id, e.target.value)}
                  className="w-full text-base"
                />
              </Box>
            )}
          </Box>
        ))}
      </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mt: 2 }}>
        <MuiButton
          variant="outlined"
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            bgcolor: 'white',
            borderColor: 'gray.300',
            color: 'black',
            '&:hover': {
              bgcolor: 'green.100', // correspond à hover:bg-green-100
              borderColor: 'gray.300',
            },
          }}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </MuiButton>
        </Box>
      </Paper>

      {/* Dialog pour l'aperçu de l'image de profil */}
      <Dialog
        open={showPreviewDialog}
        onClose={() => {
          setShowPreviewDialog(false);
          setPreviewTabValue(0);
        }}
        maxWidth='xl'
        fullWidth
        sx={{
          maxWidth: '1350px',
          margin: '0 auto',
        }}
      >
        <DialogTitle>
          Aperçu de l'image de profil
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs 
            value={previewTabValue} 
            onChange={(_, newValue) => setPreviewTabValue(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Image originelle" />
            <Tab 
              label="Vignette" 
              disabled={!profile?.imageUrlThumbnail}
            />
          </Tabs>
          
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            {profile?.imageUrl && (
              <>
                {previewTabValue === 0 && (
                  <Box
                    component="img"
                    src={getImageUrl(profile, false, true)}
                    alt="Aperçu image de profil - Originale"
                    sx={{
                      maxWidth: '1200px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      maxHeight: 'auto',
                    }}
                    key={`original-${imageRefreshKey}`}
                  />
                )}
                {previewTabValue === 1 && profile.imageUrlThumbnail && (
                  <Box
                    component="img"
                    src={getImageUrl(profile, true, true)}
                    alt="Aperçu image de profil - Vignette"
                    sx={{
                      maxWidth: '1200px',
                      height: 'auto',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      maxHeight: 'auto',
                    }}
                    key={`thumbnail-${imageRefreshKey}`}
                  />
                )}
                {previewTabValue === 1 && !profile.imageUrlThumbnail && (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Aucune vignette disponible
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => {
            setShowPreviewDialog(false);
            setPreviewTabValue(0);
          }} color="primary">
            Fermer
          </MuiButton>
        </DialogActions>
      </Dialog>
      </Grid>
  );
}

