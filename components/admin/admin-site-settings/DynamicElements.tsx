import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Box, Paper, Typography, Button, TextField, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Plus, X, HelpCircle } from 'lucide-react';
import BlurOn from '@mui/icons-material/BlurOn';
import SwipeRight from '@mui/icons-material/SwipeRight';
import ZoomIn from '@mui/icons-material/ZoomIn';
import AutoAwesomeMotion from '@mui/icons-material/AutoAwesomeMotion';
import { OverlaySuccess } from '../OverlaySuccess';

export interface DynamicElementsRef {
  insertAllPending: () => void;
}

interface DynamicElementsProps {
  fieldValues: any;
  setFieldValues: (values: any) => void;
  updateField: (field: string, value: string) => void;
  handleInputChange: (field: string, value: string) => void;
  handleAnimationStyleChange: (type: string, value: string) => void;
  allAccordionsExpanded?: boolean;
  accordionExpandTrigger?: number;
  onPendingInsertionsChange: (hasPending: boolean) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const ANIMATION_TYPES = [
  { value: 'fade', label: 'Fondu (Fade)', icon: <BlurOn /> },
  { value: 'slide', label: 'Glissement (Slide)', icon: <SwipeRight /> },
  { value: 'zoom', label: 'Zoom', icon: <ZoomIn /> },
  { value: 'bounce', label: 'Rebond (Bounce)', icon: <AutoAwesomeMotion /> }
];

export const DynamicElements = forwardRef<DynamicElementsRef, DynamicElementsProps>(({ 
  fieldValues, 
  setFieldValues, 
  updateField, 
  handleInputChange,
  handleAnimationStyleChange,
  allAccordionsExpanded = false,
  accordionExpandTrigger = 0,
  onPendingInsertionsChange,
  expanded = false,
  onExpandedChange
}, ref) => {
  // État pour l'overlay de succès
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [overlayAnimation, setOverlayAnimation] = useState<'none' | 'enter' | 'exit'>('none');

  // États pour les nouveaux éléments dynamiques
  const [newDynamicElement, setNewDynamicElement] = useState('');
  const [newDynamicElement1, setNewDynamicElement1] = useState('');
  const [newDynamicElement2, setNewDynamicElement2] = useState('');
  const [newDynamicElement3, setNewDynamicElement3] = useState('');
  
  // États pour le suivi des insertions en attente
  const [pendingInsertions, setPendingInsertions] = useState({
    type0: false,
    type1: false,
    type2: false,
    type3: false,
  });

  // États pour l'interface utilisateur
  const [dynamicElementsHelp, setDynamicElementsHelp] = useState(false);
  const [dynamicElementsHelpTwo, setDynamicElementsHelpTwo] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // État pour gérer l'ouverture/fermeture de l'accordéon
  const [accordionExpanded, setAccordionExpanded] = useState(expanded);

  // Synchroniser l'état local avec la prop expanded
  useEffect(() => {
    setAccordionExpanded(expanded);
  }, [expanded]);

  useEffect(() => {
    const hasPending = Object.values(pendingInsertions).some(status => status);
    onPendingInsertionsChange(hasPending);
  }, [pendingInsertions, onPendingInsertionsChange]);

  // Écouter les événements de succès pour ce composant
  useEffect(() => {
    const handleDynamicElementsSuccess = () => {
      
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

    const handleBasicInfoSuccess = () => {
      
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
    window.addEventListener('dynamicElementsSuccess', handleDynamicElementsSuccess);
    window.addEventListener('basicSiteInfoSuccess', handleBasicInfoSuccess);
    
    return () => {
      window.removeEventListener('dynamicElementsSuccess', handleDynamicElementsSuccess);
      window.removeEventListener('basicSiteInfoSuccess', handleBasicInfoSuccess);
    };
  }, []);

  // Effet pour synchroniser avec le bouton global
  useEffect(() => {
    if (accordionExpandTrigger > 0) {
      setAccordionExpanded(allAccordionsExpanded);
    }
  }, [accordionExpandTrigger, allAccordionsExpanded]);

  // Fonction pour gérer le changement d'état de l'accordéon
  const handleAccordionChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setAccordionExpanded(isExpanded);
    onExpandedChange?.(isExpanded);
  };

  // Gestion des éléments dynamiques (original)
  const addDynamicElement = (type: number = 0) => {
    let newElement = '';
    let updatedElements: string[] = [];
    let fieldName = '';
    
    switch(type) {
      case 1:
        if (!newDynamicElement1.trim()) return;
        newElement = newDynamicElement1.trim();
        updatedElements = [...(fieldValues.dynamicElements1 || []), newElement];
        fieldName = 'dynamicElements1';
        setNewDynamicElement1('');
        setPendingInsertions(prev => ({ ...prev, type1: true }));
        break;
      case 2:
        if (!newDynamicElement2.trim()) return;
        newElement = newDynamicElement2.trim();
        updatedElements = [...(fieldValues.dynamicElements2 || []), newElement];
        fieldName = 'dynamicElements2';
        setNewDynamicElement2('');
        setPendingInsertions(prev => ({ ...prev, type2: true }));
        break;
      case 3:
        if (!newDynamicElement3.trim()) return;
        newElement = newDynamicElement3.trim();
        updatedElements = [...(fieldValues.dynamicElements3 || []), newElement];
        fieldName = 'dynamicElements3';
        setNewDynamicElement3('');
        setPendingInsertions(prev => ({ ...prev, type3: true }));
        break;
      case 0:
      default:
        if (!newDynamicElement.trim()) return;
        newElement = newDynamicElement.trim();
        updatedElements = [...(fieldValues.dynamicElements || []), newElement];
        fieldName = 'dynamicElements';
        setNewDynamicElement('');
        setPendingInsertions(prev => ({ ...prev, type0: true }));
        break;
    }
    
    setFieldValues((prev: any) => ({
      ...prev,
      [fieldName]: updatedElements
    }));
    
    updateField(fieldName, JSON.stringify(updatedElements));
  };

  const removeDynamicElement = (index: number, type: number = 0) => {
    let fieldName = '';
    let elementsArray: string[] = [];
    
    switch(type) {
      case 1:
        fieldName = 'dynamicElements1';
        elementsArray = [...(fieldValues.dynamicElements1 || [])];
        setPendingInsertions(prev => ({ ...prev, type1: true }));
        break;
      case 2:
        fieldName = 'dynamicElements2';
        elementsArray = [...(fieldValues.dynamicElements2 || [])];
        setPendingInsertions(prev => ({ ...prev, type2: true }));
        break;
      case 3:
        fieldName = 'dynamicElements3';
        elementsArray = [...(fieldValues.dynamicElements3 || [])];
        setPendingInsertions(prev => ({ ...prev, type3: true }));
        break;
      case 0:
      default:
        fieldName = 'dynamicElements';
        elementsArray = [...(fieldValues.dynamicElements || [])];
        setPendingInsertions(prev => ({ ...prev, type0: true }));
        break;
    }
    
    elementsArray.splice(index, 1);
    
    setFieldValues((prev: any) => ({
      ...prev,
      [fieldName]: elementsArray
    }));
    
    updateField(fieldName, JSON.stringify(elementsArray));
  };

  const updateDescriptionWithDynamicPlaceholder = useCallback((type: number = 0) => {
    let placeholder = '';
    let elements: string[] | undefined = [];
    let regex: RegExp;
    
    switch(type) {
      case 1:
        if (!fieldValues.dynamicElements1 || fieldValues.dynamicElements1.length === 0) {
          toast.error('Ajoutez d\'abord des éléments dynamiques de type 1');
          return;
        }
        placeholder = `{[${fieldValues.dynamicElements1.join(',')}]}`;
        elements = fieldValues.dynamicElements1;
        regex = /\{\[([^\]]+)\]\}/g;
        setPendingInsertions(prev => ({ ...prev, type1: false }));
        break;
      case 2:
        if (!fieldValues.dynamicElements2 || fieldValues.dynamicElements2.length === 0) {
          toast.error('Ajoutez d\'abord des éléments dynamiques de type 2');
          return;
        }
        placeholder = `{(${fieldValues.dynamicElements2.join(',')})}`;
        elements = fieldValues.dynamicElements2;
        regex = /\{\(([^)]+)\)\}/g;
        setPendingInsertions(prev => ({ ...prev, type2: false }));
        break;
      case 3:
        if (!fieldValues.dynamicElements3 || fieldValues.dynamicElements3.length === 0) {
          toast.error('Ajoutez d\'abord des éléments dynamiques de type 3');
          return;
        }
        placeholder = `{<${fieldValues.dynamicElements3.join(',')}>}`;
        elements = fieldValues.dynamicElements3;
        regex = /\{<([^>]+)>\}/g;
        setPendingInsertions(prev => ({ ...prev, type3: false }));
        break;
      case 0:
      default:
        if (!fieldValues.dynamicElements || fieldValues.dynamicElements.length === 0) {
          toast.error('Ajoutez d\'abord des éléments dynamiques');
          return;
        }
        placeholder = `{{${fieldValues.dynamicElements.join(',')}}}`;
        elements = fieldValues.dynamicElements;
        regex = /\{\{([^}]+)\}\}/g;
        setPendingInsertions(prev => ({ ...prev, type0: false }));
        break;
    }
    
    // Vérifier si la description contient déjà un placeholder du même type
    const hasPlaceholder = regex.test(fieldValues.descriptionSite);
    
    if (hasPlaceholder) {
      // Remplacer le placeholder existant
      const updatedDescription = fieldValues.descriptionSite.replace(regex, placeholder);
      setFieldValues((prev: any) => ({
        ...prev,
        descriptionSite: updatedDescription
      }));
      updateField('descriptionSite', updatedDescription);
      toast.info(`Placeholder mis à jour dans la description`);
    } else {
      // Ajouter le placeholder à la fin de la description
      const updatedDescription = fieldValues.descriptionSite + (fieldValues.descriptionSite.endsWith(' ') ? '' : ' ') + placeholder;
      setFieldValues((prev: any) => ({
        ...prev,
        descriptionSite: updatedDescription
      }));
      updateField('descriptionSite', updatedDescription);
      // toast.success(`Placeholder de type ${type} ajouté à la description`);
    }
  }, [fieldValues, setFieldValues, updateField]);

  const insertAllPending = useCallback(() => {
    Object.entries(pendingInsertions).forEach(([typeKey, isPending]) => {
      if (isPending) {
        const typeNumber = parseInt(typeKey.replace('type', ''), 10);
        updateDescriptionWithDynamicPlaceholder(typeNumber);
      }
    });
  }, [pendingInsertions, updateDescriptionWithDynamicPlaceholder]);

  useImperativeHandle(ref, () => ({
    insertAllPending,
  }));

  const TabButton = ({ id, label, active }: { id: number, label: string, active: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-t-md text-sm ${
        active 
          ? 'bg-gray-100 font-medium border-t border-l border-r border-gray-300'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
  
  // Rendu d'un onglet d'éléments dynamiques
  const renderDynamicElementsTab = (
    type: number, 
    title: string, 
    elements: string[] | undefined, 
    newElement: string, 
    setNewElement: React.Dispatch<React.SetStateAction<string>>,
    placeholderFormat: string,
    animationStyle: string
  ) => {
    const isPending = 
      type === 0 ? pendingInsertions.type0 :
      type === 1 ? pendingInsertions.type1 :
      type === 2 ? pendingInsertions.type2 :
      pendingInsertions.type3;

    return (
      <div className={`${activeTab === type ? 'block' : 'hidden'}`}>
        <div className="bg-gray-50 p-3 rounded-md mb-2">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Format:</strong> {placeholderFormat}
          </div>
          
          {/* Sélection du style d'animation */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Style d'animation</label>
            <div className="flex flex-wrap gap-2">
              {ANIMATION_TYPES.map(animType => (
                <button
                  key={animType.value}
                  onClick={() => handleAnimationStyleChange(
                    type === 0 ? 'default' : 
                    type === 1 ? 'type1' : 
                    type === 2 ? 'type2' : 'type3', 
                    animType.value
                  )}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
                    animationStyle === animType.value 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  } border`}
                >
                  {animType.icon}
                  {animType.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Ajout d'éléments */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newElement}
              onChange={(e) => setNewElement(e.target.value)}
              placeholder="Nouveau mot ou expression..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addDynamicElement(type)}
            />
            <button
              onClick={() => addDynamicElement(type)}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
          
          {/* Liste des éléments */}
          {elements && elements.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-2">Éléments ({elements.length}):</div>
              <div className="flex flex-wrap gap-2">
                {elements.map((element, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    {element}
                    <button
                      onClick={() => removeDynamicElement(index, type)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Bouton d'insertion */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => updateDescriptionWithDynamicPlaceholder(type)}
            disabled={!elements || elements.length === 0}
            className="w-full"
            sx={{
              animation: isPending ? `blinker 1.5s linear infinite` : 'none',
              '@keyframes blinker': {
                '50%': {
                  opacity: 0.5,
                  borderColor: 'primary.main',
                },
              },
            }}
          >
            Insérer dans la description
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Overlay de succès */}
      <OverlaySuccess 
        show={showSuccessOverlay} 
        animation={overlayAnimation}
      />
      
      {/* Accordéon unique pour Titre, description et éléments dynamiques */}
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
        aria-controls="site-info-content"
        id="site-info-header"
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
          Titre, description et éléments dynamiques du site
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, borderRadius: 0 }}>
        
        {/* Section Titre et description du site */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 500 }}>
            Informations de base
          </Typography>
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => setDynamicElementsHelpTwo(!dynamicElementsHelpTwo)} 
            className="flex items-center text-xs text-blue-500 hover:underline"
          >
            <HelpCircle className="w-3 h-3 mr-1" />
            {dynamicElementsHelpTwo ? 'Masquer l\'aide' : 'Comment ça marche ?'}
          </button>
        </div>
        
        {dynamicElementsHelpTwo && (
          <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm">
            <p>Les éléments dynamiques permettent de donner des effets de défilement de mots dans la description du site.</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Choisissez l'un des 4 types d'éléments dynamiques (chaque type a son propre format et style d'animation)</li>
              <li>Ajoutez plusieurs mots ou expressions dans l'onglet correspondant</li>
              <li>Sélectionnez le style d'animation souhaité pour ce groupe</li>
              <li>Cliquez sur "Insérer dans la description" pour placer le marqueur correspondant</li>
              <li>Les mots défileront automatiquement avec l'animation choisie</li>
            </ol>
          </div>
        )}
          <Box 
            sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
            
            <Box width="100%" mb={2}>
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Titre du site
              </Typography>
              <TextField
                value={fieldValues.titleSite}
                onChange={(e) => handleInputChange('titleSite', e.target.value)}
                placeholder="Ex: MielDeLune.Art | Photographe Professionnel de Mariage"
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>
            <Box width="100%">
              <Typography variant="subtitle2" color="text.secondary" mb={0.5}>
                Description du site
              </Typography>
              <TextField
                value={fieldValues.descriptionSite}
                onChange={(e) => handleInputChange('descriptionSite', e.target.value)}
                placeholder="Ex: Studio de photographie spécialisé dans les mariages..."
                fullWidth
                size="small"
                multiline
                minRows={3}
              />
            </Box>
          </Box>
        </Box>

        {/* Section des éléments dynamiques */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary', fontWeight: 500 }}>
            Éléments dynamiques
          </Typography>
          <div className='w-full'>
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => setDynamicElementsHelp(!dynamicElementsHelp)} 
            className="flex items-center text-xs text-blue-500 hover:underline"
          >
            <HelpCircle className="w-3 h-3 mr-1" />
            {dynamicElementsHelp ? 'Masquer l\'aide' : 'Comment ça marche ?'}
          </button>
        </div>
        
        {dynamicElementsHelp && (
          <div className="bg-blue-50 p-3 rounded-md mb-3 text-sm">
            <p>Les éléments dynamiques permettent de donner des effets de défilement de mots dans la description du site.</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Choisissez l'un des 4 types d'éléments dynamiques (chaque type a son propre format et style d'animation)</li>
              <li>Ajoutez plusieurs mots ou expressions dans l'onglet correspondant</li>
              <li>Sélectionnez le style d'animation souhaité pour ce groupe</li>
              <li>Cliquez sur "Insérer dans la description" pour placer le marqueur correspondant</li>
              <li>Les mots défileront automatiquement avec l'animation choisie</li>
            </ol>
          </div>
        )}
        
        {/* Onglets pour les différents types d'éléments dynamiques */}
        <div className="flex border-b border-gray-300 text-sm">
          <TabButton id={0} label="Type Standard {{...}}" active={activeTab === 0} />
          <TabButton id={1} label="Type 1 {[...]}" active={activeTab === 1} />
          <TabButton id={2} label="Type 2 {(...)}" active={activeTab === 2} />
          <TabButton id={3} label="Type 3 {<...>}" active={activeTab === 3} />
        </div>
        
        {/* Contenu des onglets */}
        {renderDynamicElementsTab(
          0,
          "Éléments Standard",
          fieldValues.dynamicElements,
          newDynamicElement,
          setNewDynamicElement,
          "{{mot1,mot2,mot3}}",
          fieldValues.animationStyles?.default || 'fade'
        )}
        
        {renderDynamicElementsTab(
          1,
          "Éléments Type 1",
          fieldValues.dynamicElements1,
          newDynamicElement1,
          setNewDynamicElement1,
          "{[mot1,mot2,mot3]}",
          fieldValues.animationStyles?.type1 || 'slide'
        )}
        
        {renderDynamicElementsTab(
          2,
          "Éléments Type 2",
          fieldValues.dynamicElements2,
          newDynamicElement2,
          setNewDynamicElement2,
          "{(mot1,mot2,mot3)}",
          fieldValues.animationStyles?.type2 || 'zoom'
        )}
        
        {renderDynamicElementsTab(
          3,
          "Éléments Type 3",
          fieldValues.dynamicElements3,
          newDynamicElement3,
          setNewDynamicElement3,
          "{<mot1,mot2,mot3>}",
          fieldValues.animationStyles?.type3 || 'bounce'
        )}
        
        {/* Prévisualisation des effets */}
        <div className="mt-4 pt-3 border-t border-gray-200 text-sm">
          <h5 className="text-sm font-medium mb-2">Exemples des effets d'animation</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">Fade (Fondu)</div>
              <div className="h-8 flex items-center">Les mots apparaissent en fondu vertical</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">Slide (Glissement)</div>
              <div className="h-8 flex items-center">Les mots glissent horizontalement</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">Zoom</div>
              <div className="h-8 flex items-center">Les mots arrivent avec un effet de zoom</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-500 mb-1">Bounce (Rebond)</div>
              <div className="h-8 flex items-center">Les mots rebondissent légèrement</div>
            </div>
          </div>
          </div>
        </div>
        </Box>
      </AccordionDetails>
    </Accordion>
    </Box>
  );
});

DynamicElements.displayName = 'DynamicElements';
