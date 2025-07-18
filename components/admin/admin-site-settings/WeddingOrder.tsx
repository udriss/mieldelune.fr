import React, { useState, useEffect } from 'react';
import { Wedding } from '@/lib/dataTemplate';
import AdminClientWrapper from '@/components/admin/AdminClientWrapper';
import { Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Plus } from 'lucide-react';
import { OverlaySuccess } from '../OverlaySuccess';

interface WeddingOrderProps {
  weddings: Wedding[];
  allAccordionsExpanded?: boolean;
  accordionExpandTrigger?: number;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function WeddingOrder({ 
  weddings,
  allAccordionsExpanded = false,
  accordionExpandTrigger = 0,
  expanded = false,
  onExpandedChange
}: WeddingOrderProps) {
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
    const handleOrderSuccess = () => {
      
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
    window.addEventListener('weddingOrderSuccess', handleOrderSuccess);
    
    return () => {
      window.removeEventListener('weddingOrderSuccess', handleOrderSuccess);
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

  return (
    <Box sx={{ position: 'relative', width: '100%', borderRadius: 0, }}>
      {/* Overlay de succès */}
      <OverlaySuccess 
        show={showSuccessOverlay} 
        animation={overlayAnimation}
      />
      
      <Accordion 
        elevation={0} 
        sx={{ 
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
        expandIcon={<Plus style={{ transform: accordionExpanded ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease-in-out' }} />}
        aria-controls="wedding-order-content"
        id="wedding-order-header"
        sx={{ 
          borderRadius: 0,
          minHeight: 48,
          '&.Mui-expanded': {
            minHeight: 48,
            borderRadius: 0,
          },
          '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)'
            }
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Gérer l'ordre des mariages
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, borderRadius: 0 }}>
        <AdminClientWrapper 
          weddings={weddings}
        />
      </AccordionDetails>
    </Accordion>
    </Box>
  );
}
