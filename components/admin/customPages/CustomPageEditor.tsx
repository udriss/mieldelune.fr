'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { toast } from 'react-toastify';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Import des composants refactorisés
import {
  CustomPage,
  ContentElement,
  preloadEssentialFonts,
  useAllGoogleFonts,
  useTitleGoogleFont,
  EditorToolbar,
  TitleSettings,
  PragmaticSortableContentElement,
  reorderContentElements,
  autoScrollRegistry,
} from './editor';

interface CustomPageEditorProps {
  page: CustomPage;
  onSave: (page: CustomPage) => void;
  onCancel: () => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
}

// Initialiser le préchargement dès que possible
if (typeof window !== 'undefined') {
  preloadEssentialFonts();
}

export default function CustomPageEditor({ page, onSave, onCancel, onUnsavedChanges, scrollableContainerRef }: CustomPageEditorProps) {
  const [editedPage, setEditedPage] = useState<CustomPage>(JSON.parse(JSON.stringify(page)));
  const [initialPage, setInitialPage] = useState<CustomPage>(JSON.parse(JSON.stringify(page)));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Charger les polices Google pour la prévisualisation
  useAllGoogleFonts();
  useTitleGoogleFont(editedPage.titleSettings?.fontFamily || 'Montserrat');

  // Configurer le moniteur global D&D et l'auto-scroll
  useEffect(() => {
    // Utiliser le conteneur scrollable parent s'il est fourni, sinon utiliser document.documentElement
    const scrollableElement = scrollableContainerRef?.current || document.documentElement;
    
    // Enregistrer l'auto-scroll avec le registry
    const autoScrollCleanup = autoScrollRegistry.registerAutoScroll(scrollableElement);
    
    const monitorCleanup = monitorForElements({
      canMonitor: ({ source }) => source.data.type === 'content-element',
      onDrop({ source, location }) {
        const draggedData = source.data;
        if (draggedData.type !== 'content-element') return;

        const innerMost = location.current.dropTargets[0];
        if (!innerMost) return;

        const targetData = innerMost.data;
        if (targetData.type !== 'content-element') return;

        const draggedId = draggedData.elementId as string;
        const targetId = targetData.elementId as string;
        const edge = targetData.closestEdge as 'top' | 'bottom';

        if (draggedId === targetId || !edge) return;

        // Utiliser la fonction de réordonnancement simplifiée
        const reorderedContent = reorderContentElements(
          editedPage.content,
          draggedId,
          targetId,
          edge
        );

        setEditedPage(prev => ({
          ...prev,
          content: reorderedContent,
          updatedAt: Date.now()
        }));

        // Nettoyer tous les indicateurs visuels après le drop
        setTimeout(() => {
          // Déclencher un événement pour nettoyer les indicateurs
          window.dispatchEvent(new CustomEvent('clearDropIndicators'));
        }, 50);
      },
    });

    return () => {
      monitorCleanup();
      // L'auto-scroll sera nettoyé automatiquement par le registry
      if (autoScrollCleanup) {
        autoScrollCleanup();
      }
    };
  }, [editedPage.content, scrollableContainerRef]);

  // Synchroniser l'état interne si la prop `page` change
  useEffect(() => {
    const newPage = JSON.parse(JSON.stringify(page));
    setEditedPage(newPage);
    setInitialPage(newPage);
    setHasUnsavedChanges(false); // Réinitialiser lors du changement de page
  }, [page]);

  // Détecter les changements non sauvegardés
  useEffect(() => {
    const isChanged = JSON.stringify(editedPage) !== JSON.stringify(initialPage);
    setHasUnsavedChanges(isChanged);
    if (onUnsavedChanges) {
      onUnsavedChanges(isChanged);
    }
    
    // Debug: afficher l'état du registry
    console.log('Auto-scroll registry status:', autoScrollRegistry.getDebugInfo());
  }, [editedPage, initialPage, onUnsavedChanges]);

  // Nettoyer le registry d'auto-scroll au démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer toutes les registrations d'auto-scroll
      autoScrollRegistry.cleanupAll();
    };
  }, []);

  const addElement = (type: ContentElement['type']) => {
    const newElement: ContentElement = {
      id: `element_${Date.now()}`,
      type,
      content: '',
      order: editedPage.content.length,
      settings: type === 'title' 
        ? { level: 1, fontFamily: 'Montserrat', fontSize: 24, fontWeight: '600' }
        : type === 'text' 
        ? { fontFamily: 'Montserrat', fontSize: 16, fontWeight: '400' }
        : {}
    };

    setEditedPage(prev => ({
      ...prev,
      content: [...prev.content, newElement],
      updatedAt: Date.now()
    }));
  };

  const updateElement = (updatedElement: ContentElement) => {
    setEditedPage(prev => ({
      ...prev,
      content: prev.content.map(el => 
        el.id === updatedElement.id ? updatedElement : el
      ),
      updatedAt: Date.now()
    }));
  };

  const deleteElement = (elementId: string) => {
    setEditedPage(prev => ({
      ...prev,
      content: prev.content.filter(el => el.id !== elementId),
      updatedAt: Date.now()
    }));
  };

  const handleSave = () => {
    if (!editedPage.title.trim()) {
      toast.error('Le titre de la page est requis');
      return;
    }

    onSave(editedPage);
    setHasUnsavedChanges(false); // Reset changes after successful save
  };

  const handleReset = () => {
    // Réinitialiser aux valeurs d'origine sans changer d'onglet
    const resetPage = JSON.parse(JSON.stringify(initialPage));
    setEditedPage(resetPage);
    setHasUnsavedChanges(false);
    toast.info('Modifications annulées');
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Barre d'outils sticky */}
      <EditorToolbar
        title={editedPage.title}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onCancel={onCancel}
        onReset={handleReset}
        onAddElement={addElement}
      />

      <Box 
        sx={{ 
          px: 3, 
          pb: 3,
        }}
      >
        {/* Paramètres du titre */}
        <TitleSettings
          page={editedPage}
          onUpdate={setEditedPage}
        />

        {/* Liste de contenu avec Pragmatic Drag & Drop */}
        <Box>
          <Typography variant="h6" mb={3} sx={{ 
            fontWeight: 600,
            color: '#1f2937',
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&::before': {
              content: '""',
              width: 4,
              height: 24,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: 2,
            }
          }}>
            Contenu de la page
          </Typography>
          
          {editedPage.content.length === 0 ? (
            <Paper sx={{ 
              p: 6, 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.05))',
              border: '2px dashed rgba(59, 130, 246, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
                  }}
                >
                    <Box
                      sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h6" sx={{ color: 'rgba(59, 130, 246, 0.8)' }}>
                      <AddCircleOutlineIcon fontSize="large" />
                      </Typography>
                    </Box>
                </Box>
                <Typography variant="h6" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
                  Aucun contenu ajouté
                </Typography>
                <Typography variant="body1" color="textSecondary" mb={2}>
                  Utilisez les boutons ci-dessus pour commencer à créer votre page
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Box 
              sx={{
                background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8), rgba(241, 245, 249, 0.8))',
                borderRadius: '16px',
                p: 3,
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(8px)',
                minHeight: '200px',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.02) 50%, transparent 70%)',
                  borderRadius: '16px',
                  pointerEvents: 'none',
                },
              }}
            >
              {editedPage.content
                .sort((a, b) => a.order - b.order)
                .map((element) => (
                  <PragmaticSortableContentElement
                    key={element.id}
                    element={element}
                    onUpdate={updateElement}
                    onDelete={deleteElement}
                    scrollableContainerRef={scrollableContainerRef}
                  />
                ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
