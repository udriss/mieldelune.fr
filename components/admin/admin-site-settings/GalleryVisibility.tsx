import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Wedding } from '@/lib/dataTemplate';
import { myFetch } from '@/lib/fetch-wrapper';
import {
  Box,
  Paper,
  Typography,
  Switch as MuiSwitch,
  FormControlLabel,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import LocationOn from '@mui/icons-material/LocationOn';
import Description from '@mui/icons-material/Description';
import { Plus } from 'lucide-react';
import { OverlaySuccess } from '../OverlaySuccess';

interface GalleryVisibilityProps {
  weddings: Wedding[];
  setWeddings: React.Dispatch<React.SetStateAction<Wedding[]>>;
  allDescriptionsShown: boolean;
  setAllDescriptionsShown: React.Dispatch<React.SetStateAction<boolean>>;
  allLocationsShown: boolean;
  setAllLocationsShown: React.Dispatch<React.SetStateAction<boolean>>;
  isSwitchLoading: boolean;
  setIsSwitchLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLocationSwitchLoading: boolean;
  setIsLocationSwitchLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchWeddings: () => Promise<void>;
  allAccordionsExpanded?: boolean;
  accordionExpandTrigger?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function GalleryVisibility({
  weddings,
  setWeddings,
  allDescriptionsShown,
  setAllDescriptionsShown,
  allLocationsShown,
  setAllLocationsShown,
  isSwitchLoading,
  setIsSwitchLoading,
  isLocationSwitchLoading,
  setIsLocationSwitchLoading,
  fetchWeddings,
  allAccordionsExpanded = false,
  accordionExpandTrigger = 0,
  expanded = false,
  onExpandedChange
}: GalleryVisibilityProps) {

  // État pour l'overlay de succès
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [overlayAnimation, setOverlayAnimation] = useState<'none' | 'enter' | 'exit'>('none');

  // État pour gérer l'ouverture/fermeture de l'accordéon
  const [accordionExpanded, setAccordionExpanded] = useState(expanded);

  // Synchroniser l'état avec la prop expanded
  useEffect(() => {
    setAccordionExpanded(expanded);
  }, [expanded]);

  // Écouter les événements de succès pour ce composant
  useEffect(() => {
    const handleGallerySuccess = () => {
      
      setShowSuccessOverlay(true);
      setOverlayAnimation('enter');
      
      // Masquer l'overlay après 1 seconde
      setTimeout(() => {
        setOverlayAnimation('exit');
        setTimeout(() => {
          setShowSuccessOverlay(false);
          setOverlayAnimation('none');
        }, 400);
      }, 1000);
    };

    // Écouter les événements personnalisés
    window.addEventListener('galleryVisibilitySuccess', handleGallerySuccess);
    
    return () => {
      window.removeEventListener('galleryVisibilitySuccess', handleGallerySuccess);
    };
  }, []);

  // Effet pour synchroniser avec le bouton global
  useEffect(() => {
    if (accordionExpandTrigger > 0) {
      setAccordionExpanded(allAccordionsExpanded);
    }
  }, [accordionExpandTrigger, allAccordionsExpanded]);

  const handleAllDescriptionsToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setIsSwitchLoading(true);

    try {
      const response = await myFetch('/api/updateAllDescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showDescription: isChecked }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // toast.success(`✅ ${isChecked ? 'Affichage' : 'Masquage'} des descriptions activé pour tous les mariages`);
        setAllDescriptionsShown(isChecked);
        await fetchWeddings();
        // Déclencher l'overlay de succès
        window.dispatchEvent(new CustomEvent('galleryVisibilitySuccess'));
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      // Rétablir l'état précédent en cas d'erreur
      setAllDescriptionsShown(!isChecked);
    } finally {
      // Le re-fetch de fetchWeddings va déclencher le useEffect qui met à jour isSwitchLoading
    }
  };

  const handleAllLocationsToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    setIsLocationSwitchLoading(true);

    try {
      const response = await myFetch('/api/updateAllLocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showLocation: isChecked }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // toast.success(`✅ ${isChecked ? 'Affichage' : 'Masquage'} des localisations activé pour tous les mariages`);
        setAllLocationsShown(isChecked);
        await fetchWeddings();
        // Déclencher l'overlay de succès
        window.dispatchEvent(new CustomEvent('galleryVisibilitySuccess'));
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      // Rétablir l'état précédent en cas d'erreur
      setAllLocationsShown(!isChecked);
    } finally {
      // Le re-fetch de fetchWeddings va déclencher le useEffect qui met à jour isLocationSwitchLoading
    }
  };

  const handleIndividualSwitchChange = async (weddingId: number, field: 'showDescription' | 'showLocation', value: boolean) => {
    try {
      // Optimistic update - mettre à jour l'état local immédiatement
      setWeddings(prevWeddings => 
        prevWeddings.map(wedding => 
          wedding.id === weddingId 
            ? { ...wedding, [field]: value }
            : wedding
        )
      );

      const response = await myFetch('/api/updateWeddingVisibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weddingId: weddingId.toString(),
          field,
          value
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Récupérer le titre du wedding depuis l'état local ou la réponse API
        const weddingTitle = result.updatedWedding?.title || 
                           weddings.find(w => w.id === weddingId)?.title || 
                           `Mariage ID ${weddingId}`;
        
        // toast.success(`${field === 'showDescription' ? 'Description' : 'Localisation'} ${value ? 'affichée' : 'masquée'} pour "${weddingTitle}"`, {
        //   position: "top-center",
        //   autoClose: 1500,
        //   hideProgressBar: false,
        //   theme: "dark",
        //   style: {
        //     width: '400px',
        //     textAlign: 'center',
        //   },
        // });
        
        // Mettre à jour les états globaux après modification individuelle
        await fetchWeddings();
        // Déclencher l'overlay de succès
        window.dispatchEvent(new CustomEvent('galleryVisibilitySuccess'));
      } else {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
      
      // Rollback - rétablir l'état précédent en cas d'erreur
      setWeddings(prevWeddings => 
        prevWeddings.map(wedding => 
          wedding.id === weddingId 
            ? { ...wedding, [field]: !value }
            : wedding
        )
      );
    }
  };

  // Calculer les états intermédiaires pour les switches
  const getLocationSwitchSx = () => {
    if (weddings.length === 0) return undefined;
    const visibleCount = weddings.filter(w => w.showLocation).length;
    const isIndeterminate = visibleCount > 0 && visibleCount < weddings.length;
    return isIndeterminate ? {
      '& .MuiSwitch-thumb': {
        backgroundColor: '#ff9800',
      },
      '& .MuiSwitch-track': {
        backgroundColor: '#ffcc80',
      }
    } : undefined;
  };

  const getDescriptionSwitchSx = () => {
    if (weddings.length === 0) return undefined;
    const visibleCount = weddings.filter(w => w.showDescription).length;
    const isIndeterminate = visibleCount > 0 && visibleCount < weddings.length;
    return isIndeterminate ? {
      '& .MuiSwitch-thumb': {
        backgroundColor: '#ff9800',
      },
      '& .MuiSwitch-track': {
        backgroundColor: '#ffcc80',
      }
    } : undefined;
  };

  // Fonction pour gérer le changement d'état de l'accordéon
  const handleAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setAccordionExpanded(isExpanded);
    onExpandedChange?.(isExpanded);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Overlay de succès */}
      <OverlaySuccess 
        show={showSuccessOverlay} 
        animation={overlayAnimation}
      />
      
      <Accordion elevation={0} sx={{ 
        width: '100%', 
        borderRadius: 0, 
        border: 'none', 
        boxShadow: 'none',
        backgroundColor: 'transparent',
        '&:first-of-type': {
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        '&:last-of-type': {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
        '&.MuiAccordion-root': {
          borderRadius: 0,
        }
      }}
        expanded={accordionExpanded}
        onChange={handleAccordionChange}
      >
      <AccordionSummary
        expandIcon={<Plus style={{ transition: 'transform 0.3s', transform: accordionExpanded ? 'rotate(45deg)' : 'none' }} />}
        aria-controls="gallery-visibility-content"
        id="gallery-visibility-header"
        sx={{ 
          borderRadius: 0,
          minHeight: 48,
          '&.Mui-expanded': {
            minHeight: 48,
          },
          '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Affichage des informations sur la galerie
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, borderRadius: 0 }}>

        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
      {/* Section Localisation - Switch global + contrôles individuels */}
      <Box mb={4}>
        {/* Switch global localisation */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <MuiSwitch
                checked={allLocationsShown}
                onChange={handleAllLocationsToggle}
                disabled={isLocationSwitchLoading || weddings.length === 0}
                name="showAllLocations"
                sx={getLocationSwitchSx()}
              />
            }
            label={
              <Typography variant="body2" >
          Afficher la localisation sur toutes les cartes de mariage (global)
              </Typography>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1, ml: 0 }}>
            Ceci active ou désactive la visibilité de la localisation pour l'ensemble des galeries.
          </Typography>
        </Box>

        {/* Contrôles individuels localisation */}
        {weddings.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOn sx={{ fontSize: '1rem', color: 'primary.main' }} />
              Contrôle individuel par galerie :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {weddings.map((wedding) => (
                <ToggleButton
                  key={`location-${wedding.id}`}
                  value={wedding.id}
                  selected={wedding.showLocation}
                  onChange={() => handleIndividualSwitchChange(wedding.id, 'showLocation', !wedding.showLocation)}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    minWidth: 'auto',
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    border: '1px solid',
                    borderColor: wedding.showLocation ? 'rgba(33, 150, 243, 0.3)' : 'rgba(0, 0, 0, 0.12)',
                    backgroundColor: wedding.showLocation ? 'rgba(33, 150, 243, 0.08)' : 'rgba(255, 255, 255, 0.8)',
                    color: wedding.showLocation ? 'rgba(33, 150, 243, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: wedding.showLocation ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.05)',
                      borderColor: 'rgba(33, 150, 243, 0.4)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(33, 150, 243, 0.2)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(33, 150, 243, 0.12)',
                      borderColor: 'rgba(33, 150, 243, 0.4)',
                      '&:hover': {
                        backgroundColor: 'rgba(33, 150, 243, 0.18)',
                      }
                    }
                  }}
                >
                  {wedding.title}
                </ToggleButton>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Section Description - Switch global + contrôles individuels */}
      <Box mb={2}>
        {/* Switch global description */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <MuiSwitch
          checked={allDescriptionsShown}
          onChange={handleAllDescriptionsToggle}
          disabled={isSwitchLoading || weddings.length === 0}
          name="showAllDescriptions"
          sx={getDescriptionSwitchSx()}
              />
            }
            label={
              <Typography variant="body2">
          Afficher la description sur toutes les cartes de mariage (global)
              </Typography>
            }
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -1, ml: 0 }}>
            Ceci active ou désactive la visibilité de la description pour l'ensemble des galeries.
          </Typography>
        </Box>

        {/* Contrôles individuels description */}
        {weddings.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description sx={{ fontSize: '1rem', color: 'secondary.main' }} />
              Contrôle individuel par galerie :
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {weddings.map((wedding) => (
                <ToggleButton
                  key={`description-${wedding.id}`}
                  value={wedding.id}
                  selected={wedding.showDescription}
                  onChange={() => handleIndividualSwitchChange(wedding.id, 'showDescription', !wedding.showDescription)}
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    minWidth: 'auto',
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    border: '1px solid',
                    borderColor: wedding.showDescription ? 'rgba(152, 33, 243, 0.3)' : 'rgba(0, 0, 0, 0.12)',
                    backgroundColor: wedding.showDescription ? 'rgba(152, 33, 243, 0.08)' : 'rgba(255, 255, 255, 0.8)',
                    color: wedding.showDescription ? 'rgba(152, 33, 243, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: wedding.showDescription ? 'rgba(152, 33, 243, 0.15)' : 'rgba(152, 33, 243, 0.05)',
                      borderColor: 'rgba(152, 33, 243, 0.4)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(152, 33, 243, 0.2)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(152, 33, 243, 0.12)',
                      borderColor: 'rgba(152, 33, 243, 0.4)',
                      '&:hover': {
                        backgroundColor: 'rgba(152, 33, 243, 0.18)',
                      }
                    }
                  }}
                >
                  {wedding.title}
                </ToggleButton>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      </Box>
      </AccordionDetails>
    </Accordion>
    </Box>
  );
}
