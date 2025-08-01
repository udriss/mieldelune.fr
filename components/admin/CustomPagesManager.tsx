'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import { 
  Plus, 
  Edit, 
  Delete, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock,
  Save,
  Settings,
  List,
  Globe,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import { myFetch } from '@/lib/fetch-wrapper';
import CustomPageEditor from '@/components/admin/customPages/CustomPageEditor';
import { CustomPageSettings } from '@/components/admin/customPages/CustomPageSettings';
import { CustomPage, ContentElement } from '@/components/admin/customPages/editor';

interface CustomPagesManagerProps {
  onUnsavedChanges?: (hasChanges: boolean) => void;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
}

export function CustomPagesManager({ onUnsavedChanges, scrollableContainerRef }: CustomPagesManagerProps = {}) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Notifier le parent des changements non sauvegardés
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);

  // Charger les pages existantes
  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const response = await myFetch('/api/custom-pages');
      const data = await response.json();
      
      if (data.success) {
        setPages(data.pages || []);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pages:', error);
      toast.error('Erreur lors du chargement des pages');
    }
  };

  const generateRandomSlug = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    let slug = '';
    for (let i = 0; i < 4; i++) {
      slug += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 2; i++) {
      slug += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return slug;
  };

  const createNewPage = () => {
    if (hasUnsavedChanges) {
      toast.warning('Veuillez sauvegarder vos modifications avant de créer une nouvelle page');
      return;
    }
    
    const newPage: CustomPage = {
      id: `page_${Date.now()}`,
      title: 'Nouvelle page',
      slug: generateRandomSlug(),
      isPasswordProtected: false,
      isPublished: false,
      isRandomSlug: true,
      showTitle: true, // Par défaut, afficher le titre
      titleSettings: {
        fontFamily: 'Montserrat',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb'
      },
      content: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    setSelectedPage(newPage);
    setIsCreating(true);
    setSelectedTab(1); // Basculer vers l'éditeur
    setHasUnsavedChanges(false);
  };

  const savePage = async (page: CustomPage) => {
    try {
      const response = await myFetch('/api/custom-pages', {
        method: isCreating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }
      
      // Mettre à jour la page sélectionnée avec les données retournées par l'API
      setSelectedPage(data.page);
      
      if (isCreating) {
        setPages(prev => [...prev, data.page]);
        setIsCreating(false);
      } else {
        setPages(prev => prev.map(p => p.id === page.id ? data.page : p));
      }
      
      // Reset l'état des changements non sauvegardés après une sauvegarde réussie
      setHasUnsavedChanges(false);
      
      toast.success('Page sauvegardée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de la page');
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      const response = await myFetch(`/api/custom-pages/${pageId}`, { 
        method: 'DELETE' 
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }
      
      setPages(prev => prev.filter(p => p.id !== pageId));
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setSelectedTab(0);
      }
      
      // Actualiser les données depuis l'API après suppression
      await loadPages();
      
      toast.success('Page supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la page');
    }
  };

  const confirmDelete = (pageId: string) => {
    setPageToDelete(pageId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (pageToDelete) {
      deletePage(pageToDelete);
      setPageToDelete(null);
    }
    setShowDeleteDialog(false);
  };

  const togglePagePublish = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const updatedPage = { ...page, isPublished: !page.isPublished, updatedAt: Date.now() };
    await savePage(updatedPage);
  };

  const copyPageUrl = (page: CustomPage) => {
    const url = `${window.location.origin}/${page.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiée dans le presse-papiers');
  };

  const renderPagesList = () => (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Gestion des pages personnalisées
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={createNewPage}
          sx={{ 
            bgcolor: '#3b82f6', 
            '&:hover': { bgcolor: '#2563eb' }
          }}
        >
          Nouvelle page
        </Button>
      </Box>

      {pages.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Globe 
                size={100} 
                color="#9ca3af" 
                style={{ 
                  margin: 'auto',
                  position: 'absolute', 
                  top: '50%', 
                  left: '0',
                  right: '0', 
                  opacity: 0.1,
                  zIndex: 0,
                }} 
              />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Aucune page disponible
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={3}>
              Ajoutez votre première page personnalisée pour commencer
            </Typography>
            <Button variant="outlined" startIcon={<Plus />} onClick={createNewPage}>
              Ajouter une page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {pages.map((page) => (
            <Card key={page.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Typography variant="h6">{page.title}</Typography>
                      <Chip 
                        label={page.isPublished ? 'Publié' : 'Brouillon'}
                        color={page.isPublished ? 'success' : 'default'}
                        size="small"
                      />
                      {page.isPasswordProtected && (
                        <Chip 
                          icon={<Lock size={14} />}
                          label="Protégé"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      URL: /{page.slug}
                    </Typography>
                    
                    <Typography variant="caption" color="textSecondary">
                      {page.content.length} élément(s) • 
                      Modifié le {new Date(page.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <IconButton
                      size="small"
                      onClick={() => window.open(`/page/${page.slug}`, '_blank')}
                      disabled={!page.isPublished}
                      title={page.isPublished ? "Ouvrir la page dans un nouvel onglet" : "La page n'est pas publiée"}
                    >
                      <ExternalLink size={16} />
                    </IconButton>

                    <IconButton 
                      size="small" 
                      onClick={() => copyPageUrl(page)}
                      title="Copier l'URL"
                    >
                      <Copy size={16} />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => togglePagePublish(page.id)}
                      title={page.isPublished ? 'Dépublier' : 'Publier'}
                    >
                      {page.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        if (hasUnsavedChanges) {
                          toast.warning('Veuillez sauvegarder vos modifications avant de changer de page');
                          return;
                        }
                        
                        setSelectedPage(page);
                        setIsCreating(false);
                        setSelectedTab(1);
                        setHasUnsavedChanges(false);
                      }}
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => confirmDelete(page.id)}
                      title="Supprimer"
                      color="error"
                    >
                      <Delete size={16} />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );

  return (
    <Paper elevation={1} 
    sx={{ 
        mb: 12,
        width: '100%', 
        maxWidth: '1200px', 
        borderRadius: 2, 
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)', 
        backdropFilter: 'blur(8px)',
        // RETIRER toute contrainte de height et overflow pour que le sticky fonctionne !
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // Ajouter un padding-right pour éviter la superposition des scrollbars
        pr: 0, // 8px de padding à droite
    }}>
      <Paper 
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0, // Se positionner sous la barre Tabs principale
          zIndex: 1001, // Au-dessus de la barre Tabs principale (z-index: 1000)
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #e5e7eb',
          //flexShrink: 0, // Ne pas rétrécir
          maxHeight:60, 
          p:0,
        }}
      >
        <Tabs 
          value={selectedTab} 
          onChange={(_, value) => {
            // Empêcher le changement d'onglet s'il y a des modifications non sauvegardées
            if (hasUnsavedChanges && selectedTab !== 0) {
              toast.warning('Veuillez sauvegarder vos modifications avant de changer d\'onglet');
              return;
            }
            
            setSelectedTab(value);
            
            // Reset l'état des changements non sauvegardés quand on retourne à la liste
            if (value === 0) {
              setHasUnsavedChanges(false);
            }
          }}
          variant="fullWidth"
          sx={{
            maxHeight:60,
            p:0,
            '& .MuiTabs-indicator': {
              backgroundColor: '#3b82f6',
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#2563eb',
              }
            }
          }}
        >
          <Tab 
            label="Liste des pages" 
            icon={<List size={18} />}
            iconPosition="start"
            sx={{
              maxHeight:60,
              minHeight: 60,
              p:0,
            }}
          />
          <Tab 
            label="Éditeur" 
            icon={<Edit size={18} />}
            iconPosition="start"
            disabled={!selectedPage}
            sx={{
              maxHeight:60,
              minHeight: 60,
              p:0,
            }}
          />
          <Tab 
            label="Paramètres" 
            icon={<Settings size={18} />}
            iconPosition="start"
            disabled={!selectedPage}
            sx={{
              maxHeight:60,
              minHeight: 60,
              p:0,
            }}
          />
        </Tabs>
      </Paper>

      {/* Conteneur pour le contenu */}
      <Box
        sx={{
          flex: 1,
          overflow: 'visible',
          // Plus besoin de scrollbar personnalisée ici car le scroll se fait au niveau parent
        }}
      >
        {selectedTab === 0 && renderPagesList()}
        
        {selectedTab === 1 && selectedPage && (
          <CustomPageEditor 
            page={selectedPage}
            onSave={(page) => {
              savePage(page);
            }}
            onCancel={() => {
              setSelectedPage(null);
              setSelectedTab(0);
              setIsCreating(false);
              setHasUnsavedChanges(false);
            }}
            onUnsavedChanges={setHasUnsavedChanges}
            scrollableContainerRef={scrollableContainerRef}
          />
        )}
        
        {selectedTab === 2 && selectedPage && (
          <CustomPageSettings 
            page={selectedPage}
            onSave={(page) => {
              savePage(page);
            }}
            onSlugGenerate={() => {
              const updatedPage = { 
                ...selectedPage, 
                slug: generateRandomSlug(),
                isRandomSlug: true,
                updatedAt: Date.now()
              };
              setSelectedPage(updatedPage);
            }}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        )}
      </Box>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cette page ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
