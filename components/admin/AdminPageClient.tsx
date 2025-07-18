'use client';

import { useRouter } from "next/navigation";
import { Header } from "@/components/admin/admin-header";
import { useEffect, useState, useRef } from "react";
import { Wedding } from '@/lib/dataTemplate';
import { toast } from 'react-toastify';
import { ConnectionsList } from '@/components/admin/ConnectionsList';
import { AdminWeddings }  from '@/components/admin/admin-weddings-modify';
import NewEventButton  from '@/components/admin/nouvel-evenement';
import AdminProfil from '@/components/admin/admin-profil';
import { Profile } from '@/lib/dataProfil';
import { AdminSiteSettings, AdminSiteSettingsRef } from '@/components/admin/admin-site-settings';
import { AdminAvailability } from '@/components/admin/admin-availability';
import { CustomPagesManager } from '@/components/admin/CustomPagesManager';
import { Box, Paper, Tabs, Tab, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { myFetch } from '@/lib/fetch-wrapper';

interface AdminClientWrapperProps {
  initialWeddings: Wedding[];
  initialProfile: Profile[];
}

export default function AdminClientWrapper({ initialWeddings, initialProfile }: AdminClientWrapperProps) {
  const [weddingsToTransfer, setWeddingsForTransfer] = useState<Wedding[]>(initialWeddings);
  const [profileToTransfer, setProfileForTransfer] = useState<Profile[]>(initialProfile);
  const [activeTab, setActiveTab] = useState<string>('nouveau');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [hasCustomPageChanges, setHasCustomPageChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextTab, setNextTab] = useState<string | null>(null);
  const siteSettingsRef = useRef<AdminSiteSettingsRef>(null);
  const mainScrollableRef = useRef<HTMLDivElement>(null);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  
  const router = useRouter();
  const handleLogout = () => {
    document.cookie = "adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin/login");
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges || hasCustomPageChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingChanges, hasCustomPageChanges]);

  const fetchWeddings = async () => {
    // Protection contre les appels multiples simultanés
    if (isFetchingRef.current) {
      console.log('🚫 Appel fetchWeddings ignoré - déjà en cours');
      return;
    }

    // Débouncer les appels pour éviter les appels excessifs
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(async () => {
      if (isFetchingRef.current) {
        console.log('🚫 Appel fetchWeddings ignoré - déjà en cours (debounced)');
        return;
      }

      isFetchingRef.current = true;
      console.log('🔄 Chargement des mariages depuis la page AdminPageClient - DEBUT');

      try {
        const res = await myFetch('/api/mariages', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store',
        });
        
        const data = await res.json();
        
        if (data.weddings) {
          setWeddingsForTransfer(data.weddings);
          console.log('✅ Mariages rechargés avec succès');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des mariages:', error);
        toast.error('Erreur lors du chargement des mariages sur la page principale', {
          position: "top-center",
          autoClose: false,
          theme: "dark",
          style: {
            width: '400px',
          },
        });
      } finally {
        // Libérer le verrou après un délai pour éviter les appels trop rapprochés
        setTimeout(() => {
          isFetchingRef.current = false;
          console.log('🔓 Verrou fetchWeddings libéré');
        }, 1000);
      }
    }, 800); // Augmenter le délai de débouncing à 800ms
  };

  useEffect(() => {
    // Recharger les mariages quand on switche vers l'onglet modification
    if (activeTab === 'modification') {
      fetchWeddings();
    }
  }, [activeTab]);

  useEffect(() => {
    // Load initial tab from cookie
    const savedTab = document.cookie
      .split('; ')
      .find(row => row.startsWith('activeTab='))
      ?.split('=')[1] || 'nouveau';
    
    setActiveTab(savedTab);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    // Vérifier s'il y a des changements non sauvegardés dans les paramètres du site
    if (activeTab === 'parameters' && hasPendingChanges) {
      setNextTab(newValue);
      setShowConfirmDialog(true);
      return;
    }
    
    // Vérifier s'il y a des changements non sauvegardés dans les pages personnalisées
    if (activeTab === 'custom-pages' && hasCustomPageChanges) {
      toast.warning('Veuillez sauvegarder vos modifications avant de changer d\'onglet');
      return;
    }
    
    // Continuer le changement d'onglet normalement
    setActiveTab(newValue);
    document.cookie = `activeTab=${newValue}; path=/; max-age=31536000`;
  };

  const handleDialogSave = () => {
    siteSettingsRef.current?.insertAllPending();
    setShowConfirmDialog(false);
  };

  const handleDialogDiscard = () => {
    setShowConfirmDialog(false);
    if (nextTab) {
      setHasPendingChanges(false); // Allow tab change, changes will be lost on component unmount/remount
      setHasCustomPageChanges(false); // Reset aussi les changements des pages personnalisées
      setActiveTab(nextTab);
      document.cookie = `activeTab=${nextTab}; path=/; max-age=31536000`;
      setNextTab(null);
    }
  };

  const handleDialogCancel = () => {
    setShowConfirmDialog(false);
    setNextTab(null);
  };

  useEffect(() => {
    // Effect to change tab after saving is complete
    if (nextTab && !hasPendingChanges) {
      setActiveTab(nextTab);
      document.cookie = `activeTab=${nextTab}; path=/; max-age=31536000`;
      setNextTab(null);
    }
  }, [hasPendingChanges, nextTab]);

  const handleEventCreated = (newWeddingId: string) => {
    setActiveTab('modification');
    // Save tab to cookie
    document.cookie = `activeTab=modification; path=/; max-age=31536000`; // 1 year
    // Save the new wedding ID to cookie for auto-selection
    document.cookie = `lastWeddingId=${newWeddingId}; path=/; max-age=31536000`;
  };

  return (
    <>
      <Dialog open={showConfirmDialog} onClose={handleDialogCancel}>
        <DialogTitle>Changements non sauvegardés</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {activeTab === 'parameters' 
              ? 'Vous avez des éléments dynamiques qui n\'ont pas été insérés dans la description. Voulez-vous les insérer avant de changer d\'onglet ?'
              : 'Vous avez des modifications non sauvegardées. Voulez-vous les enregistrer avant de continuer ?'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel}>Rester sur la page</Button>
          <Button onClick={handleDialogDiscard}>
            {activeTab === 'parameters' ? 'Changer sans insérer' : 'Abandonner les modifications'}
          </Button>
          <Button onClick={handleDialogSave} autoFocus>
            {activeTab === 'parameters' ? 'Insérer et changer' : 'Sauvegarder et changer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box 
        ref={mainScrollableRef}
        className="mainScrollableRef w-full h-screen overflow-y-auto flex flex-col"
        sx={{
          mb:16, // Pour laisser de l'espace pour le header
          // Styles de scrollbar personnalisés pour la scrollbar principale
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(0,0,0,0.4)',
            },
          },
        }}
      >
        <Box 
          className="w-full flex flex-col items-center justify-start pt-16 mb-32"
        >
        <Box sx={{ mb: 2 }} />
        <Box className="w-full min-w-[800px] max-w-[800px]">
          <Header onLogout={handleLogout} />
        </Box>
        <Box sx={{ mb: 2 }} />
        
        <Container maxWidth='md' sx={{ p: 3, maxWidth: '1000px', width: '100%' }}>
          <Box className="w-full">
            <Paper 
              elevation={0}
              sx={{
                position: activeTab === 'custom-pages' ? 'static' : 'sticky',
                top: activeTab === 'custom-pages' ? 'auto' : 0, // 4rem = 64px
                zIndex: activeTab === 'custom-pages' ? 'auto' : 1000,
                minWidth: '800px',
                maxWidth: '100%',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(12px)',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="standard"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#3b82f6',
                    height: '2px'
                  },
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    minWidth: 'auto',
                    py: 2,
                    px: 2,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    color: '#6b7280',
                    '&:hover': {
                      color: '#374151',
                    },
                    '&.Mui-selected': {
                      color: '#2563eb',
                    }
                  }
                }}
              >
                <Tab label="Nouveau" value="nouveau" />
                <Tab label="Modifications" value="modification" />
                <Tab label="Profil" value="profil" />
                <Tab label="Disponibilités" value="disponibilites" />
                <Tab label="Gestion du site web" value="parameters" />
                <Tab label="Pages perso" value="custom-pages" />
                <Tab label="Connexions" value="connections" />
              </Tabs>
            </Paper>
      
            <Box className="mt-4 flex flex-col items-center justify-center w-full">
              {activeTab === 'nouveau' && <NewEventButton onEventCreated={handleEventCreated} />}
              {activeTab === 'modification' && <AdminWeddings weddings={weddingsToTransfer} setWeddings={setWeddingsForTransfer} onDataRefresh={fetchWeddings} />}
              {activeTab === 'profil' &&  <AdminProfil profile={profileToTransfer[0]} setProfile={setProfileForTransfer} />}
              {activeTab === 'disponibilites' && <AdminAvailability />}
              {activeTab === 'parameters' && <AdminSiteSettings ref={siteSettingsRef} onPendingInsertionsChange={setHasPendingChanges} />}
              {activeTab === 'custom-pages' && <CustomPagesManager onUnsavedChanges={setHasCustomPageChanges} scrollableContainerRef={mainScrollableRef} />}
              {activeTab === 'connections' && <ConnectionsList />}
            </Box>
          </Box>
        </Container>
        </Box>
      </Box>
    </>
  );
}
