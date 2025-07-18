import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'react-toastify';
import { type SiteData } from '@/lib/dataSite';
import { parseWeddingsData } from '@/lib/utils/data-parser';
import { Wedding } from '@/lib/dataTemplate';
import { myFetch } from '@/lib/fetch-wrapper';
import { Box, Button, Typography, Divider, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Import des sous-composants
import { AppearanceCustomization } from './admin-site-settings/AppearanceCustomization';
import { DynamicElements, DynamicElementsRef } from './admin-site-settings/DynamicElements';
import { GalleryVisibility } from './admin-site-settings/GalleryVisibility';
import { WeddingOrder } from './admin-site-settings/WeddingOrder';

export interface AdminSiteSettingsRef {
  insertAllPending: () => void;
}

interface AdminSiteSettingsProps {
  onPendingInsertionsChange: (hasPending: boolean) => void;
}

interface FieldState {
  value: string;
  status: 'idle' | 'typing' | 'updating' | 'success' | 'error';
  timer?: NodeJS.Timeout;
}

interface FieldStates {
  [key: string]: FieldState;
}

export const AdminSiteSettings = forwardRef<AdminSiteSettingsRef, AdminSiteSettingsProps>(({ onPendingInsertionsChange }, ref) => {
  const [fieldValues, setFieldValues] = useState<SiteData>({
    titleSite: '',
    descriptionSite: '',
    dynamicElements: [],
    dynamicElements1: [],
    dynamicElements2: [],
    dynamicElements3: [],
    animationStyles: {
      default: 'fade',
      type1: 'slide',
      type2: 'zoom',
      type3: 'bounce'
    }
  });

  const dynamicElementsRef = useRef<DynamicElementsRef>(null);

  // États pour gérer les changements en attente et les dialogues
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [showAccordionConfirmDialog, setShowAccordionConfirmDialog] = useState(false);
  const [showPageLeaveDialog, setShowPageLeaveDialog] = useState(false);
  const [nextAccordion, setNextAccordion] = useState<string | null>(null);

  // États pour gérer l'ouverture des accordéons individuellement
  const [openAccordions, setOpenAccordions] = useState({
    appearance: false,
    dynamicElements: false,
    galleryVisibility: false,
    weddingOrder: false
  });

  useImperativeHandle(ref, () => ({
    insertAllPending: () => {
      dynamicElementsRef.current?.insertAllPending();
    }
  }));

  const [fieldStates, setFieldStates] = useState<FieldStates>({
    titleSite: { value: '', status: 'idle' },
    descriptionSite: { value: '', status: 'idle' },
  });

  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [allDescriptionsShown, setAllDescriptionsShown] = useState(false);
  const [allLocationsShown, setAllLocationsShown] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(true);
  const [isLocationSwitchLoading, setIsLocationSwitchLoading] = useState(true);

  // État pour gérer l'expansion/contraction de tous les accordéons
  const [allAccordionsExpanded, setAllAccordionsExpanded] = useState(false);
  const [accordionExpandTrigger, setAccordionExpandTrigger] = useState(0);

  // Effet pour gérer les changements en attente et le garde-fou de rechargement
  useEffect(() => {
    onPendingInsertionsChange(hasPendingChanges);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = '';
        // Afficher notre dialogue personnalisé
        setShowPageLeaveDialog(true);
      }
    };

    // Empêcher l'actualisation avec Ctrl+R ou F5
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasPendingChanges && ((e.ctrlKey && e.key === 'r') || e.key === 'F5')) {
        e.preventDefault();
        setShowPageLeaveDialog(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasPendingChanges, onPendingInsertionsChange]);

  // Fonction pour gérer les changements en attente
  const handlePendingInsertionsChange = useCallback((pending: boolean) => {
    setHasPendingChanges(pending);
  }, []);

  // Fonction pour gérer l'ouverture/fermeture des accordéons avec garde-fou
  const handleAccordionChange = (accordionName: string, isExpanded: boolean) => {
    if (isExpanded && hasPendingChanges && accordionName !== 'dynamicElements') {
      setNextAccordion(accordionName);
      setShowAccordionConfirmDialog(true);
      return;
    }

    setOpenAccordions(prev => ({
      ...prev,
      [accordionName]: isExpanded
    }));
  };

  // Fonction pour déplier/replier tous les accordéons
  const toggleAllAccordions = () => {
    if (hasPendingChanges && !allAccordionsExpanded) {
      setShowAccordionConfirmDialog(true);
      setNextAccordion('all');
      return;
    }

    const newState = !allAccordionsExpanded;
    setAllAccordionsExpanded(newState);
    
    // Mettre à jour tous les accordéons individuels
    setOpenAccordions({
      appearance: newState,
      dynamicElements: newState,
      galleryVisibility: newState,
      weddingOrder: newState
    });
    
    // Utiliser un trigger pour forcer la mise à jour des composants enfants
    setAccordionExpandTrigger(prev => prev + 1);
  };

  // Fonctions de gestion des dialogues
  const handleAccordionDialogSave = () => {
    dynamicElementsRef.current?.insertAllPending();
    setShowAccordionConfirmDialog(false);
    
    // Attendre que les changements soient sauvegardés
    setTimeout(() => {
      if (nextAccordion === 'all') {
        const newState = !allAccordionsExpanded;
        setAllAccordionsExpanded(newState);
        setOpenAccordions({
          appearance: newState,
          dynamicElements: newState,
          galleryVisibility: newState,
          weddingOrder: newState
        });
        setAccordionExpandTrigger(prev => prev + 1);
      } else if (nextAccordion) {
        setOpenAccordions(prev => ({
          ...prev,
          [nextAccordion]: true
        }));
      }
      setNextAccordion(null);
    }, 500);
  };

  const handleAccordionDialogDiscard = () => {
    setShowAccordionConfirmDialog(false);
    setHasPendingChanges(false);
    
    if (nextAccordion === 'all') {
      const newState = !allAccordionsExpanded;
      setAllAccordionsExpanded(newState);
      setOpenAccordions({
        appearance: newState,
        dynamicElements: newState,
        galleryVisibility: newState,
        weddingOrder: newState
      });
      setAccordionExpandTrigger(prev => prev + 1);
    } else if (nextAccordion) {
      setOpenAccordions(prev => ({
        ...prev,
        [nextAccordion]: true
      }));
    }
    setNextAccordion(null);
  };

  const handleAccordionDialogCancel = () => {
    setShowAccordionConfirmDialog(false);
    setNextAccordion(null);
  };

  const handlePageLeaveDialogSave = () => {
    dynamicElementsRef.current?.insertAllPending();
    setShowPageLeaveDialog(false);
    setHasPendingChanges(false);
    // Permettre l'actualisation
    window.location.reload();
  };

  const handlePageLeaveDialogDiscard = () => {
    setShowPageLeaveDialog(false);
    setHasPendingChanges(false);
    // Permettre l'actualisation
    window.location.reload();
  };

  const handlePageLeaveDialogCancel = () => {
    setShowPageLeaveDialog(false);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await myFetch('/api/siteSettings');
        const data = await response.json();
        if (data.success) {
          setFieldValues(data.site);
          
          // Sync the form states
          setFieldStates(prev => ({
            ...prev,
            titleSite: { value: data.site.titleSite || '', status: 'idle' },
            descriptionSite: { value: data.site.descriptionSite || '', status: 'idle' },
          }));
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des paramètres');
      }
    };

    fetchSettings();
  }, []);

  const updateField = useCallback(async (field: string, value: string, showToast = false) => {
    
    
    const data = field === 'dynamicElements' || field === 'dynamicElements1' || field === 'dynamicElements2' || field === 'dynamicElements3' || field === 'animationStyles'
      ? { [field]: field.includes('Elements') ? JSON.parse(value) : (field === 'animationStyles' ? value : value) }
      : { [field]: value };

    setFieldStates(prev => ({
      ...prev,
      [field]: { value, status: 'updating' }
    }));

    try {
      const response = await myFetch('/api/siteSettings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        setFieldStates(prev => ({
          ...prev,
          [field]: { value, status: 'success' }
        }));
        
        if (showToast) {
          toast.success(`✅ ${field} mis à jour avec succès`);
        }

        // Déclencher les événements de succès pour les composants appropriés
        if (field === 'titleSite' || field === 'descriptionSite') {
          window.dispatchEvent(new CustomEvent('basicSiteInfoSuccess'));
        } else if (field === 'dynamicElements' || field === 'dynamicElements1' || 
                   field === 'dynamicElements2' || field === 'dynamicElements3' || 
                   field === 'animationStyles') {
          window.dispatchEvent(new CustomEvent('dynamicElementsSuccess'));
        } else if (field === 'pageSettings') {
          
          window.dispatchEvent(new CustomEvent('pageSettingsSuccess'));
        } else if (field.includes('color') || field.includes('Color') || 
                   field.includes('background') || field.includes('Background') ||
                   field.includes('gradient') || field.includes('Gradient') ||
                   field.includes('granular') || field.includes('Granular') ||
                   field === 'primaryColor' ||
                   field === 'gradientType' || field === 'gradientCenter' || 
                   field === 'gradientAngle' || field === 'gradientStops' ||
                   field === 'gradientColors' || field === 'granularBaseColor' ||
                   field === 'granularGranuleSize' || field === 'granularDensity' ||
                   field === 'granularVariation') {
          
          window.dispatchEvent(new CustomEvent('appearanceCustomizationSuccess'));
        }
        
        // Reset to idle after a short delay
        setTimeout(() => {
          setFieldStates(prev => ({
            ...prev,
            [field]: { value, status: 'idle' }
          }));
        }, 1500);
      } else {
        throw new Error(result.message || 'Erreur de mise à jour');
      }
    } catch (error: any) {
      setFieldStates(prev => ({
        ...prev,
        [field]: { value, status: 'error' }
      }));
      
      toast.error(`❌ Erreur lors de la mise à jour de ${field}: ${error.message}`);
      
      // Reset to idle after error display
      setTimeout(() => {
        setFieldStates(prev => ({
          ...prev,
          [field]: { value, status: 'idle' }
        }));
      }, 3000);
    }
  }, []);

  // Version spécialisée pour les changements de couleurs (sans toast et sans timeout automatique)
  const handleColorInputChange = useCallback((field: string, value: string) => {
    // Mettre à jour l'état local immédiatement pour un aperçu en temps réel
    setFieldValues((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Marquer comme en cours de mise à jour
    setFieldStates(prev => ({
      ...prev,
      [field]: { value, status: 'updating' }
    }));

    // Utiliser updateField pour la sauvegarde (sans toast automatique)
    // L'overlay sera déclenché automatiquement par updateField
    updateField(field, value, false).catch((error) => {
      console.error('Erreur lors de la sauvegarde de la couleur:', error);
      toast.error('Erreur lors de la sauvegarde');
    });
  }, [updateField]);

  const handleInputChange = (field: string, value: string) => {
    // Mettre à jour l'état local immédiatement
    setFieldValues((prev: any) => ({
      ...prev,
      [field]: value
    }));

    // Gérer le statut de frappe
    const existingTimer = fieldStates[field]?.timer;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Nouveau timer pour la sauvegarde automatique
    const newTimer = setTimeout(() => {
      updateField(field, value);
    }, 1000); // Délai de 1 seconde

    setFieldStates(prev => ({
      ...prev,
      [field]: {
        value,
        status: 'typing',
        timer: newTimer
      }
    }));
  };

  // Fonction pour gérer le changement des styles d'animation
  const handleAnimationStyleChange = (type: string, value: string) => {
    const updatedStyles = {
      ...(fieldValues.animationStyles || {
        default: 'fade',
        type1: 'slide',
        type2: 'zoom',
        type3: 'bounce'
      }),
      [type]: value
    };
    
    // Mettre à jour l'état local directement avec l'objet
    setFieldValues((prev: any) => ({
      ...prev,
      animationStyles: updatedStyles
    }));
    
    // Envoyer une mise à jour directe de tout l'objet animationStyles
    myFetch('/api/siteSettings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        animationStyles: updatedStyles
      })
    })
    .then(async response => {
      const result = await response.json();
      if (result.success) {
        toast.success(`🎨 Style d'animation mis à jour: ${value}`);
        // Déclencher l'événement de succès pour les éléments dynamiques
        window.dispatchEvent(new CustomEvent('dynamicElementsSuccess'));
      } else {
        throw new Error(result.message || 'Erreur de mise à jour');
      }
    })
    .catch(error => {
      toast.error(`❌ Erreur: ${error.message}`);
    });
  };

  const fetchWeddings = async () => {
    try {
      const res = await myFetch('/api/mariages', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
        next: { 
          revalidate: 0,
          tags: ['weddings']
        }
      });
      
      const data = await res.json();
      
      if (data.weddings) {
        setWeddings(data.weddings);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des mariages', {
        position: "top-center",
        autoClose: false,
        theme: "dark",
        style: {
          width: '400px',
        },
      });
    }
  };
  
  useEffect(() => {
    fetchWeddings();
  }, []);

  useEffect(() => {
    if (weddings.length > 0) {
      const descriptionsShown = weddings.filter(w => w.showDescription).length;
      const locationsShown = weddings.filter(w => w.showLocation).length;
      
      setAllDescriptionsShown(descriptionsShown === weddings.length);
      setAllLocationsShown(locationsShown === weddings.length);
      setIsSwitchLoading(false);
      setIsLocationSwitchLoading(false);
    } else {
      setIsSwitchLoading(false);
      setIsLocationSwitchLoading(false);
    }
  }, [weddings]);

  return (
    <Box maxWidth={800} display="flex" flexDirection="column" alignItems="center" width="100%">

      {/* Dialogue de confirmation pour changement d'accordéon */}
      <Dialog open={showAccordionConfirmDialog} onClose={handleAccordionDialogCancel}>
        <DialogTitle>Changements non insérés</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous avez des éléments dynamiques qui n'ont pas été insérés dans la description. Voulez-vous les insérer avant de continuer ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAccordionDialogCancel}>Rester</Button>
          <Button onClick={handleAccordionDialogDiscard}>Continuer sans insérer</Button>
          <Button onClick={handleAccordionDialogSave} autoFocus>Insérer et continuer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation pour rechargement de page */}
      <Dialog open={showPageLeaveDialog} onClose={handlePageLeaveDialogCancel}>
        <DialogTitle>Actualisation de la page</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous avez des modifications non insérées. Voulez-vous les sauvegarder avant d'actualiser la page ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePageLeaveDialogCancel}>Annuler</Button>
          <Button onClick={handlePageLeaveDialogDiscard}>Actualiser sans sauvegarder</Button>
          <Button onClick={handlePageLeaveDialogSave} autoFocus>Sauvegarder et actualiser</Button>
        </DialogActions>
      </Dialog>

      {/* Bouton pour déplier/replier tous les accordéons */}
      <Box sx={{ width: '100%', mt: 3, mb: 1, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={toggleAllAccordions}
          startIcon={allAccordionsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            borderColor: '#e5e7eb',
            color: '#6b7280',
            fontSize: '0.875rem',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              borderColor: '#d1d5db',
              backgroundColor: '#f9fafb'
            }
          }}
        >
          {allAccordionsExpanded ? 'Replier tous les accordéons' : 'Déplier tous les accordéons'}
        </Button>
      </Box>

      {/* Conteneur pour tous les accordéons */}
      <Box sx={{
        width: '100%',
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}>

        {/* Personnalisation de l'apparence */}
        <AppearanceCustomization 
          fieldValues={fieldValues}
          setFieldValues={setFieldValues}
          handleInputChange={handleInputChange}
          handleColorInputChange={handleColorInputChange}
          allAccordionsExpanded={allAccordionsExpanded}
          accordionExpandTrigger={accordionExpandTrigger}
          expanded={openAccordions.appearance}
          onExpandedChange={(expanded: boolean) => handleAccordionChange('appearance', expanded)}
        />

        <Divider sx={{ borderWidth: '1px' }} />

        {/* Éléments dynamiques et informations de base du site */}
        <DynamicElements 
          ref={dynamicElementsRef}
          fieldValues={fieldValues}
          setFieldValues={setFieldValues}
          updateField={updateField}
          handleInputChange={handleInputChange}
          handleAnimationStyleChange={handleAnimationStyleChange}
          allAccordionsExpanded={allAccordionsExpanded}
          accordionExpandTrigger={accordionExpandTrigger}
          onPendingInsertionsChange={handlePendingInsertionsChange}
          expanded={openAccordions.dynamicElements}
          onExpandedChange={(expanded: boolean) => handleAccordionChange('dynamicElements', expanded)}
        />

        <Divider sx={{ borderWidth: '1px' }} />

        {/* Gestion de la visibilité des galeries */}
        <GalleryVisibility 
          weddings={weddings}
          setWeddings={setWeddings}
          allDescriptionsShown={allDescriptionsShown}
          setAllDescriptionsShown={setAllDescriptionsShown}
          allLocationsShown={allLocationsShown}
          setAllLocationsShown={setAllLocationsShown}
          isSwitchLoading={isSwitchLoading}
          setIsSwitchLoading={setIsSwitchLoading}
          isLocationSwitchLoading={isLocationSwitchLoading}
          setIsLocationSwitchLoading={setIsLocationSwitchLoading}
          fetchWeddings={fetchWeddings}
          allAccordionsExpanded={allAccordionsExpanded}
          accordionExpandTrigger={accordionExpandTrigger}
          expanded={openAccordions.galleryVisibility}
          onExpandedChange={(expanded: boolean) => handleAccordionChange('galleryVisibility', expanded)}
        />

        <Divider sx={{ borderWidth: '1px' }} />

        {/* Gestion de l'ordre des mariages */}
        <WeddingOrder 
          weddings={weddings} 
          allAccordionsExpanded={allAccordionsExpanded}
          accordionExpandTrigger={accordionExpandTrigger}
          expanded={openAccordions.weddingOrder}
          onExpandedChange={(expanded: boolean) => handleAccordionChange('weddingOrder', expanded)}
        />

      </Box>

    </Box>
  );
});

AdminSiteSettings.displayName = 'AdminSiteSettings';
