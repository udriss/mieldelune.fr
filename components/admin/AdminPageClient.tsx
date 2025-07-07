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
import { Box, Paper, Tabs, Tab, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { myFetch } from '@/lib/fetch-wrapper';

interface AdminClientWrapperProps {
  initialWeddings: Wedding[];
  initialProfile: Profile[];
}

export default function AdminClientWrapper({ initialWeddings, initialProfile }: AdminClientWrapperProps) {
  const [weddingsToTransfer, setWeddingsForTransfer] = useState<Wedding[]>(initialWeddings);
  const [profileToTransfer, setProfileForTransfer] = useState<Profile[]>(initialProfile);
  const [activeTab, setActiveTab] = useState<string>('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nextTab, setNextTab] = useState<string | null>(null);
  const siteSettingsRef = useRef<AdminSiteSettingsRef>(null);
  
  const router = useRouter();
  const handleLogout = () => {
    document.cookie = "adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin/login");
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingChanges]);

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
      });
      
      const data = await res.json();
      
      if (data.weddings) {
        setWeddingsForTransfer(data.weddings);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des mariages sur la page principale', {
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
    if (activeTab === 'parameters' && hasPendingChanges) {
      setNextTab(newValue);
      setShowConfirmDialog(true);
    } else {
      setActiveTab(newValue);
      document.cookie = `activeTab=${newValue}; path=/; max-age=31536000`;
    }
  };

  const handleDialogSave = () => {
    siteSettingsRef.current?.insertAllPending();
    setShowConfirmDialog(false);
  };

  const handleDialogDiscard = () => {
    setShowConfirmDialog(false);
    if (nextTab) {
      setHasPendingChanges(false); // Allow tab change, changes will be lost on component unmount/remount
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
        <DialogTitle>Changements non insérés</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous avez des éléments dynamiques qui n'ont pas été insérés dans la description. Voulez-vous les insérer avant de changer d'onglet ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel}>Rester sur la page</Button>
          <Button onClick={handleDialogDiscard}>Changer sans insérer</Button>
          <Button onClick={handleDialogSave} autoFocus>Insérer et changer</Button>
        </DialogActions>
      </Dialog>

      <Box 
        className="w-full min-h-screen flex flex-col items-center justify-start mt-16"
      >
        <Box sx={{ mb: 2 }} />
        <Box className="w-full min-w-[800px] max-w-[800px]">
          <Header onLogout={handleLogout} />
        </Box>
        <Box sx={{ mb: 2 }} />
        
        <Container maxWidth="xl" sx={{ p: 3 }}>
          <Box className="w-full">
            <Paper 
              elevation={0}
              sx={{
                position: 'sticky',
                top: '4rem',
                zIndex: 1000,
                minWidth: '800px',
                maxWidth: '800px',
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
                <Tab label="Connexions" value="connections" />
              </Tabs>
            </Paper>
      
            <Box className="mt-4 flex flex-col items-center justify-center">
              {activeTab === 'nouveau' && <NewEventButton onEventCreated={handleEventCreated} />}
              {activeTab === 'modification' && <AdminWeddings weddings={weddingsToTransfer} setWeddings={setWeddingsForTransfer} />}
              {activeTab === 'profil' &&  <AdminProfil profile={profileToTransfer[0]} setProfile={setProfileForTransfer} />}
              {activeTab === 'disponibilites' && <AdminAvailability />}
              {activeTab === 'parameters' && <AdminSiteSettings ref={siteSettingsRef} onPendingInsertionsChange={setHasPendingChanges} />}
              {activeTab === 'connections' && <ConnectionsList />}
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}
