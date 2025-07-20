import { Wedding } from '@/lib/dataTemplate';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import { Paper, Typography, Switch, FormControlLabel, IconButton, Box, Button as MuiButton, Grid } from '@mui/material';
import { ExternalLink } from 'lucide-react';


interface WeddingFormProps {
  editedWedding: Wedding | null;
  fieldValues: { [key: string]: string };
  setFieldValues: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  fieldStates: Record<string, {
    value: string;
    status: 'idle' | 'typing' | 'updating' | 'error' | 'success';
    timer?: NodeJS.Timeout;
  }>;
  handleInputChange: (field: string, value: string) => void;
  handleSwitchChange: (field: string, value: boolean) => void;
  handleDelete: () => void;
  toggleVisibility: () => void;
  isDeleting: boolean;
}

export function WeddingForm({ 
  editedWedding, 
  fieldValues, 
  setFieldValues, 
  fieldStates, 
  handleInputChange,
  handleSwitchChange,
  handleDelete,
  toggleVisibility,
  isDeleting
}: WeddingFormProps) {
  
  const getInputStyle = (field: string) => {
    const status = fieldStates[field]?.status;
    return `transition-colors duration-300 ${
      status === 'typing' ? 'bg-orange-50 border-red-300' :
      status === 'updating' ? 'bg-orange-100 border-orange-500' :
      status === 'error' ? 'bg-red-50 border-red-500' :
      status === 'success' ? 'bg-green-50 border-green-500' :
      ''
    }`;
  };

  const handleSave = async () => {
    try {
      const response = await myFetch('/api/updateWeddingInfos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editedWedding?.id,
          ...fieldValues,
        }),
      });

      if (!response.ok) throw new Error('Failed to update wedding');

      toast.success('🎉 Données mises à jour', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        },
      });
    } catch (error) {
      toast.error('Echec de mise à jour.', {
        position: "top-center",
        autoClose: 1500,
        hideProgressBar: false,
        theme: "dark",
        style: {
          width: '300px',
        },
      });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        width: "100%",
      }}
    >
      <Paper elevation={1} sx={{ mt: 8, width: '100%', p: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
        <Box sx={{ mb: 4, width: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Informations du mariage
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton
                size="small"
                onClick={() => window.open(`/mariage/${editedWedding?.id}`, '_blank')}
                title="Voir la page du mariage"
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
                Voir la page du mariage
              </Typography>
            </Box>
          </Box>
        </Box>
        <Grid container
        sx={{
          alignItems: 'center',
          gap: {
            md: .5,
            lg: 2,
          }
        }}
        >
          {/* Titre */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
               mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Titre</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Input
              className={getInputStyle('title')}
              value={fieldValues.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex : Mariage de Sophie & Lucas"
            />
          </Grid>
          {/* Date */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              }, 
              mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Date</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Input
              className={getInputStyle('date')}
              value={fieldValues.date || ''}
              onChange={(e) => handleInputChange('date', e.target.value)}
              placeholder="Ex : 15 août 2025"
            />
          </Grid>
          {/* Lieu */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
              mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Lieu</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Input
              className={getInputStyle('location')}
              value={fieldValues.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ex : Château de la Loire, Tours"
            />
          </Grid>
          {/* Afficher lieu */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
              mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Afficher lieu</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editedWedding?.showLocation ?? true)}
                  onChange={(e) => handleSwitchChange('showLocation', e.target.checked)}
                  name="showLocation"
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem' }}>{Boolean(editedWedding?.showLocation ?? true) ? "Affiché" : "Masqué"}</Typography>}
            />
          </Grid>
          {/* Description */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
              mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Description</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Textarea
              placeholder="Quelques mots sur le mariage, le lieu, l'ambiance..."
              rows={3}
              value={fieldValues.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={getInputStyle('description')}
            />
          </Grid>
          {/* Afficher description */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
               mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Afficher description</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(editedWedding?.showDescription ?? true)}
                  onChange={(e) => handleSwitchChange('showDescription', e.target.checked)}
                  name="showDescription"
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem' }}>{Boolean(editedWedding?.showDescription ?? true) ? "Affichée" : "Masquée"}</Typography>}
            />
          </Grid>
          {/* Template */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="subtitle2" 
            sx={{ 
              textAlign: {
                sm: 'left',
                lg: 'right'
              },
               mt: {
                xs: 1.5,
                lg: 0,
              }
            }}
            >Template</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Select 
              value={fieldValues.templateType || 'timeline'} 
              onValueChange={(value) => handleInputChange('templateType', value)}
            >
              <SelectTrigger className={getInputStyle('templateType')}>
                <SelectValue placeholder="Choisir un template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timeline">Timeline</SelectItem>
                <SelectItem value="masonry">Masonry</SelectItem>
                <SelectItem value="grid">Grille (ancien)</SelectItem>
              </SelectContent>
            </Select>
          </Grid>
        </Grid>
        <Box
        sx={{
          gap: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          flexDirection: {
            xs: 'column',
            md: 'row',
          },
          maxWidth:{
            xs: 350,
            md: '100%',
          },
          margin: '0 auto',
          mt:4,
        }}
        >
          <MuiButton
            onClick={handleDelete}
            variant="outlined"
            size="small"
            disabled={isDeleting}
            sx={{
              bgcolor: 'white',
              borderColor: 'gray.300',
              color: 'black',
              '&:hover': {
                bgcolor: 'red.100',
                borderColor: 'gray.300',
              },
            }}
            className="col-span-3"
          >
            {isDeleting ? 'Suppression...' : "Supprimer l'événement"}
          </MuiButton>
          <MuiButton
            onClick={toggleVisibility}
            variant="outlined"
            size="small"
            sx={{
              bgcolor: 'white',
              borderColor: 'gray.300',
              color: 'black',
              fontWeight: 600,
              '&:hover': {
                bgcolor: editedWedding?.visible ? 'orange.100' : 'green.100',
                borderColor: 'gray.300',
              },
            }}
            className="col-span-3"
          >
            {editedWedding?.visible ? "Masquer l'événement" : "Rendre l'événément visible"}
          </MuiButton>
          <MuiButton
            onClick={handleSave}
            variant="outlined"
            size='small'
            sx={{
              bgcolor: 'white',
              borderColor: 'gray.300',
              color: 'black',
              '&:hover': {
                bgcolor: 'green.100',
                borderColor: 'gray.300',
              },
            }}
            className="col-span-3"
          >
            Enregistrer les modifications
          </MuiButton>
        </Box>
      </Paper>
    </Box>
  );
}