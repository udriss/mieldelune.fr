import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Profile } from '@/lib/dataProfil';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { Loader2 } from "lucide-react";
import { debounce } from 'lodash';
import { myFetch } from '@/lib/fetch-wrapper';
import { FaTiktok, FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import type { SocialMediaData } from '@/lib/utils/data-parser';
import { Paper, Grid, Typography, TextField } from '@mui/material';


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
  const [uploadType, setUploadType] = useState<'profileLink' | 'profileStorage' | null>(null);
  const [showAddImage, setShowAddImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [fieldStates, setFieldStates] = useState<FieldStates>({});
  const [socials, setSocials] = useState<SocialMediaData>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const getImageUrl = (profile: Profile) => {
    //
    if (profile.imagetype === 'profileStorage') {
      return `/api/images?fileUrl=${profile.imageUrl}`;
    }
    return profile.imageUrl; // For 'link' and 'coverLink' types
  };

  interface UploadResponse {
    success: boolean;
    error?: string;
    data: {
      imageUrl: string;
      imagetype: 'profileStorage' | 'profileLink';
    };
  }

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
      <Typography variant="h6" fontWeight={600} mb={2}>
        Profil</Typography>
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
          <Button 
            className="bg-white border-gray-600 text-black hover:bg-green-100"
            variant={'outline'}
            onClick={handleSubmit}
          >Enregistrer le profil</Button>
        </Grid>
      </Grid>
    </Paper>

      <Paper elevation={1} sx={{ mt: 8, width: '800px', p: 3, borderRadius: 2, border: '1px solid #e5e7eb',
         maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Image de profil
        </Typography>
      <div className="grid grid-cols-4 gap-4 border rounded-lg p-4 min-h-[170px] flex items-center">
        {profile?.imageUrl ? (
          <div>
            <Image
              src={getImageUrl(profile)}
              alt="Profile image"
              width={128}
              height={128}
              className="w-32 h-32 object-cover rounded-lg"
              priority={false}
              quality={25}
            />
            <p className="text-sm mt-1">
              {profile.imagetype === 'profileStorage' 
                ? '(Stockage local)' 
                : '(URL externe)'}
            </p>
          </div>
        ) : (
          <p className="text-sm mt-1">Pas d&apos;image de profil</p>
        )}

        <div className="flex gap-4 flex-col justify-center m-4">
          <Button 
            variant={uploadType === 'profileLink' ? 'default' : 'outline'}
            size="sm"
            className='font-semibold border-gray-600'
            onClick={() => {
              setUploadType('profileLink');
              setShowAddImage(true);
            }}
          >
            Lien web
          </Button>
          <Button 
            variant={uploadType === 'profileStorage' ? 'default' : 'outline'}
            size="sm"
            className='font-semibold border-gray-600'
            onClick={() => {
              setUploadType('profileStorage');
              setShowAddImage(true);
            }}
          >
            Fichier
          </Button>
        </div>

        {showAddImage && (
        <div className="max-h-[160px] col-span-2 rounded-lg">
          {uploadType === 'profileLink' && (
            <div className="flex items-center space-x-2 h-full">
              <Input 
                type="text" 
                placeholder="Entrez l'URL de l'image"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="default" 
                onClick={() => handleImageUpload(newImageUrl, 'profileLink')}
              >
                Ajouter
              </Button>
            </div>
          )}
          
          {uploadType === 'profileStorage' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files?.[0] as File, 'profileStorage')}
                  className="flex-1"
                  disabled={isUploading}
                />
              </div>
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Upload en cours ...</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={handleCancelUpload}
                    >
                      Annuler
                    </Button>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 text-center">
                    {uploadProgress.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
      </Paper>

      <Paper elevation={1} sx={{ mt: 8, width: '800px', p: 3, borderRadius: 2, border: '1px solid #e5e7eb',
         maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Réseaux sociaux</Typography>
      <div className="space-y-4 mt-4">
        {socialEntries.map((social) => (
          <div key={social.id} className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
              <div className="flex items-center gap-3">
                {social.icon}
                <span className="text-base">{social.name}</span>
              </div>
              <Switch
                checked={social.showed}
                onCheckedChange={() => handleToggle(social.id)}
              />
            </div>
            
            {social.showed && (
              <div className="px-4">
                <Input
                  type="text"
                  placeholder={`Lien ${social.name}`}
                  value={social.link}
                  onChange={(e) => handleLinkChange(social.id, e.target.value)}
                  className="w-full text-base"
                />
              </div>
            )}
          </div>
        ))}
        <div className='flex justify-end w-fll'>
        <Button 
          className="bg-white border-gray-600 text-black hover:bg-green-100"
          variant={'outline'}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
          </div>
      </div>
      </Paper>
      </Grid>
  );
}

