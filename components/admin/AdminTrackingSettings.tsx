import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Stack,
  Grid
} from '@mui/material';
import {
  Settings,
  Database,
  Download,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface TrackingSettings {
  enabled: boolean;
  pageTracking: boolean;
  interactionTracking: boolean;
  performanceTracking: boolean;
  sessionTimeout: number; // en minutes
  maxStorageSize: number; // en MB
  dataRetentionDays: number;
  anonymizeIPs: boolean;
}

interface DataSummary {
  connections: number;
  pageVisits: number;
  interactions: number;
  sessions: number;
  storageSize: number;
  oldestEntry: Date | null;
}

export function AdminTrackingSettings() {
  const [settings, setSettings] = useState<TrackingSettings>({
    enabled: true,
    pageTracking: true,
    interactionTracking: true,
    performanceTracking: false,
    sessionTimeout: 30,
    maxStorageSize: 50,
    dataRetentionDays: 90,
    anonymizeIPs: false
  });

  const [dataSummary, setDataSummary] = useState<DataSummary>({
    connections: 0,
    pageVisits: 0,
    interactions: 0,
    sessions: 0,
    storageSize: 0,
    oldestEntry: null
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('trackingSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const lastCleanupStr = localStorage.getItem('lastTrackingCleanup');
    if (lastCleanupStr) {
      setLastCleanup(new Date(lastCleanupStr));
    }

    updateDataSummary();
  }, []);

  // Sauvegarder les paramètres
  const saveSettings = (newSettings: TrackingSettings) => {
    setSettings(newSettings);
    localStorage.setItem('trackingSettings', JSON.stringify(newSettings));
  };

  // Mettre à jour le résumé des données
  const updateDataSummary = () => {
    try {
      const connections = JSON.parse(localStorage.getItem('connections') || '[]');
      const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
      const interactions = JSON.parse(localStorage.getItem('interactions') || '{}');
      const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');

      let totalPageVisits = 0;
      let totalInteractions = 0;
      let oldestTimestamp = Date.now();

      // Compter les visites de pages
      Object.values(pageVisits).forEach((visits: any) => {
        if (Array.isArray(visits)) {
          totalPageVisits += visits.length;
          visits.forEach((visit: any) => {
            if (visit.timestamp < oldestTimestamp) {
              oldestTimestamp = visit.timestamp;
            }
          });
        }
      });

      // Compter les interactions
      Object.values(interactions).forEach((userInteractions: any) => {
        if (Array.isArray(userInteractions)) {
          totalInteractions += userInteractions.length;
        }
      });

      // Calculer la taille approximative du stockage
      const storageSize = (
        JSON.stringify(connections).length +
        JSON.stringify(pageVisits).length +
        JSON.stringify(interactions).length +
        JSON.stringify(sessionData).length
      ) / 1024 / 1024; // Convertir en MB

      setDataSummary({
        connections: connections.length,
        pageVisits: totalPageVisits,
        interactions: totalInteractions,
        sessions: Object.keys(sessionData).length,
        storageSize: Math.round(storageSize * 100) / 100,
        oldestEntry: oldestTimestamp < Date.now() ? new Date(oldestTimestamp) : null
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du résumé des données:', error);
    }
  };

  // Exporter toutes les données
  const exportAllData = () => {
    const data = {
      connections: JSON.parse(localStorage.getItem('connections') || '[]'),
      pageVisits: JSON.parse(localStorage.getItem('pageVisits') || '{}'),
      interactions: JSON.parse(localStorage.getItem('interactions') || '{}'),
      sessionData: JSON.parse(localStorage.getItem('sessionData') || '{}'),
      settings: settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nettoyer les données anciennes
  const cleanupOldData = () => {
    const cutoffDate = Date.now() - (settings.dataRetentionDays * 24 * 60 * 60 * 1000);
    
    // Nettoyer les connexions
    const connections = JSON.parse(localStorage.getItem('connections') || '[]');
    const filteredConnections = connections.filter((conn: any) => conn.timestamp > cutoffDate);
    localStorage.setItem('connections', JSON.stringify(filteredConnections));

    // Nettoyer les visites de pages
    const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
    Object.keys(pageVisits).forEach(connectionId => {
      pageVisits[connectionId] = pageVisits[connectionId].filter((visit: any) => visit.timestamp > cutoffDate);
      if (pageVisits[connectionId].length === 0) {
        delete pageVisits[connectionId];
      }
    });
    localStorage.setItem('pageVisits', JSON.stringify(pageVisits));

    // Nettoyer les interactions
    const interactions = JSON.parse(localStorage.getItem('interactions') || '{}');
    Object.keys(interactions).forEach(connectionId => {
      interactions[connectionId] = interactions[connectionId].filter((interaction: any) => interaction.timestamp > cutoffDate);
      if (interactions[connectionId].length === 0) {
        delete interactions[connectionId];
      }
    });
    localStorage.setItem('interactions', JSON.stringify(interactions));

    setLastCleanup(new Date());
    localStorage.setItem('lastTrackingCleanup', new Date().toISOString());
    updateDataSummary();
  };

  // Supprimer toutes les données
  const clearAllData = () => {
    localStorage.removeItem('connections');
    localStorage.removeItem('pageVisits');
    localStorage.removeItem('interactions');
    localStorage.removeItem('sessionData');
    localStorage.removeItem('currentConnectionId');
    localStorage.removeItem('pageDurations');
    localStorage.removeItem('userInteractions');
    
    updateDataSummary();
  };

  // Anonymiser les IPs
  const anonymizeIPs = () => {
    const connections = JSON.parse(localStorage.getItem('connections') || '[]');
    const anonymizedConnections = connections.map((conn: any) => ({
      ...conn,
      deviceInfo: {
        ...conn.deviceInfo,
        userIp: conn.deviceInfo.userIp.split('.').slice(0, 2).join('.') + '.xxx.xxx'
      }
    }));
    localStorage.setItem('connections', JSON.stringify(anonymizedConnections));
    updateDataSummary();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
        <Settings size={24} />
        Paramètres de Tracking
      </Typography>

      <Grid container spacing={3}>
        {/* Paramètres de tracking */}
        <Grid size={{ xs:12, md:6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration du Tracking
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enabled}
                      onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
                    />
                  }
                  label="Activer le tracking"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pageTracking}
                      onChange={(e) => saveSettings({ ...settings, pageTracking: e.target.checked })}
                      disabled={!settings.enabled}
                    />
                  }
                  label="Suivi des pages visitées"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.interactionTracking}
                      onChange={(e) => saveSettings({ ...settings, interactionTracking: e.target.checked })}
                      disabled={!settings.enabled}
                    />
                  }
                  label="Suivi des interactions"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.performanceTracking}
                      onChange={(e) => saveSettings({ ...settings, performanceTracking: e.target.checked })}
                      disabled={!settings.enabled}
                    />
                  }
                  label="Suivi des performances"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.anonymizeIPs}
                      onChange={(e) => saveSettings({ ...settings, anonymizeIPs: e.target.checked })}
                    />
                  }
                  label="Anonymiser les adresses IP"
                />
                
                <TextField
                  label="Timeout de session (minutes)"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => saveSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  size="small"
                  inputProps={{ min: 5, max: 120 }}
                />
                
                <TextField
                  label="Taille max de stockage (MB)"
                  type="number"
                  value={settings.maxStorageSize}
                  onChange={(e) => saveSettings({ ...settings, maxStorageSize: parseInt(e.target.value) })}
                  size="small"
                  inputProps={{ min: 10, max: 500 }}
                />
                
                <TextField
                  label="Rétention des données (jours)"
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => saveSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) })}
                  size="small"
                  inputProps={{ min: 1, max: 365 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Résumé des données */}
        <Grid size={{ xs:12, md:6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <BarChart3 size={20} />
                Résumé des Données
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText primary="Connexions" secondary={dataSummary.connections} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Pages visitées" secondary={dataSummary.pageVisits} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Interactions" secondary={dataSummary.interactions} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Sessions" secondary={dataSummary.sessions} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Taille de stockage" 
                    secondary={`${dataSummary.storageSize} MB`} 
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={dataSummary.storageSize > settings.maxStorageSize ? 'Dépassé' : 'OK'} 
                      color={dataSummary.storageSize > settings.maxStorageSize ? 'error' : 'success'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {dataSummary.oldestEntry && (
                  <ListItem>
                    <ListItemText 
                      primary="Plus ancienne entrée" 
                      secondary={dataSummary.oldestEntry.toLocaleDateString('fr-FR')} 
                    />
                  </ListItem>
                )}
                {lastCleanup && (
                  <ListItem>
                    <ListItemText 
                      primary="Dernier nettoyage" 
                      secondary={lastCleanup.toLocaleDateString('fr-FR')} 
                    />
                  </ListItem>
                )}
              </List>

              {dataSummary.storageSize > settings.maxStorageSize && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  La taille de stockage dépasse la limite configurée. Considérez un nettoyage.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions de Maintenance
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={16} />}
                  onClick={updateDataSummary}
                >
                  Actualiser
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  onClick={() => setIsExportDialogOpen(true)}
                >
                  Exporter
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Database size={16} />}
                  onClick={() => setIsCleanupDialogOpen(true)}
                >
                  Nettoyer
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<EyeOff size={16} />}
                  onClick={anonymizeIPs}
                  disabled={settings.anonymizeIPs}
                >
                  Anonymiser IPs
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de tracking ?')) {
                      clearAllData();
                    }
                  }}
                >
                  Tout supprimer
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog d'export */}
      <Dialog open={isExportDialogOpen} onClose={() => setIsExportDialogOpen(false)}>
        <DialogTitle>Exporter les données</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous exporter toutes les données de tracking dans un fichier JSON ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Le fichier contiendra toutes les connexions, visites de pages, interactions et paramètres.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsExportDialogOpen(false)}>Annuler</Button>
          <Button onClick={() => { exportAllData(); setIsExportDialogOpen(false); }} variant="contained">
            Exporter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de nettoyage */}
      <Dialog open={isCleanupDialogOpen} onClose={() => setIsCleanupDialogOpen(false)}>
        <DialogTitle>Nettoyer les données anciennes</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer toutes les données antérieures à {settings.dataRetentionDays} jours ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Cette action ne peut pas être annulée. Les données supprimées seront définitivement perdues.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCleanupDialogOpen(false)}>Annuler</Button>
          <Button onClick={() => { cleanupOldData(); setIsCleanupDialogOpen(false); }} variant="contained" color="warning">
            Nettoyer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
