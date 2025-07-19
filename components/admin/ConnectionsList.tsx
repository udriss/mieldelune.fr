import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  MapPin, 
  Eye,
  Trash2,
  Filter,
  Search,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  Paper, 
  Typography, 
  Box, 
  IconButton, 
  Collapse, 
  Divider, 
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Devices,
  LocationOn,
  AccessTime,
  SignalCellularAlt,
  Visibility
} from '@mui/icons-material';
import { Connection as ExtendedConnection, ConnectionStats, PageVisit } from '@/types/connections';

export function ConnectionsList() {
  const [connections, setConnections] = useState<ExtendedConnection[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedConnection, setSelectedConnection] = useState<ExtendedConnection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        let data: ExtendedConnection[] = await response.json();
        
        data = data.map(conn => {
            const { platform, browser, deviceType } = parseUserAgent(conn.deviceInfo.userAgent);
            const { location } = parseLocationFromTimezone(conn.deviceInfo.timezone);
            return {
                ...conn,
                deviceInfo: {
                    ...conn.deviceInfo,
                    platform,
                    browser,
                    deviceType,
                    location,
                }
            };
        });

        setConnections(data);
      } else {
        console.error('Failed to fetch connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  }, []);


  // Charger et traiter les connexions
  useEffect(() => {
    fetchConnections();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, [fetchConnections]);

  // Fonction pour parser l'User Agent
  const parseUserAgent = (userAgent: string) => {
    let platform = 'Unknown';
    let browser = 'Unknown';
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (!userAgent) return { platform, browser, deviceType };

    // Détection du type d'appareil et de la plateforme en priorité
    if (/iPhone/.test(userAgent)) {
      platform = 'iOS';
      deviceType = 'mobile';
    } else if (/iPad/.test(userAgent)) {
      platform = 'iOS';
      deviceType = 'tablet';
    } else if (/Android/.test(userAgent)) {
      platform = 'Android';
      deviceType = /Mobile/.test(userAgent) ? 'mobile' : 'tablet';
    } else if (/Windows/.test(userAgent)) {
      platform = 'Windows';
      deviceType = 'desktop';
    } else if (/Macintosh/.test(userAgent)) {
      platform = 'macOS';
      deviceType = 'desktop';
    } else if (/Linux/.test(userAgent)) {
      platform = 'Linux';
      deviceType = 'desktop';
    }

    // Détection du navigateur
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    return { platform, browser, deviceType };
  };

  // Fonction pour extraire des informations de localisation basiques du timezone
  const parseLocationFromTimezone = (tz: string) => {
    const location: { country?: string; city?: string } = {};
    if (!tz) return { location };
    if (tz.includes('Europe/Paris')) {
      location.country = 'France';
      location.city = 'Paris';
    } else if (tz.includes('Europe/')) {
      location.country = 'Europe';
      location.city = tz.split('/')[1].replace(/_/g, ' ');
    } else if (tz.includes('America/')) {
      location.country = 'Amérique';
      location.city = tz.split('/')[1].replace(/_/g, ' ');
    } else if (tz.includes('Asia/')) {
      location.country = 'Asie';
      location.city = tz.split('/')[1].replace(/_/g, ' ');
    }
    return { location };
  };

  // Calculer les statistiques
  const stats: ConnectionStats = useMemo(() => {
    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const uniqueIPs = new Set(connections.map(c => c.deviceInfo.userIp)).size;
    const activeNow = connections.filter(c => c.isActive).length;
    
    const validDurations = connections.filter(c => c.sessionDuration && c.sessionDuration > 0);
    const avgSessionDuration = validDurations.reduce((acc, c) => acc + (c.sessionDuration || 0), 0) / (validDurations.length || 1);

    // Top pages
    const pageVisits = connections.flatMap(c => c.pagesVisited || []);
    const pageMap = new Map();
    pageVisits.forEach(visit => {
      pageMap.set(visit.page, (pageMap.get(visit.page) || 0) + 1);
    });
    const topPages = Array.from(pageMap.entries())
      .map(([page, visits]) => ({ page, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Top pays
    const countryMap = new Map();
    connections.forEach(c => {
      const country = c.deviceInfo.location?.country || 'Inconnu';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    const topCountries = Array.from(countryMap.entries())
      .map(([country, visits]) => ({ country, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Types d'appareils
    const deviceMap = new Map();
    connections.forEach(c => {
      const type = c.deviceInfo.deviceType || 'desktop';
      deviceMap.set(type, (deviceMap.get(type) || 0) + 1);
    });
    const deviceTypes = Array.from(deviceMap.entries())
      .map(([type, count]) => ({ type, count }));

    // Navigateurs
    const browserMap = new Map();
    connections.forEach(c => {
      const browser = c.deviceInfo.browser || 'Inconnu';
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    const browsers = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: connections.length,
      today: connections.filter(c => c.timestamp >= today).length,
      thisWeek: connections.filter(c => c.timestamp >= weekAgo).length,
      thisMonth: connections.filter(c => c.timestamp >= monthAgo).length,
      activeNow,
      uniqueIPs,
      avgSessionDuration,
      topPages,
      topCountries,
      deviceTypes,
      browsers
    };
  }, [connections]);

  // Filtrer et trier les connexions
  const filteredConnections = useMemo(() => {
    let filtered = connections.filter(conn => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        conn.deviceInfo.userIp.includes(searchTerm) ||
        (conn.deviceInfo.userAgent && conn.deviceInfo.userAgent.toLowerCase().includes(searchTermLower)) ||
        (conn.deviceInfo.browser && conn.deviceInfo.browser.toLowerCase().includes(searchTermLower)) ||
        (conn.deviceInfo.platform && conn.deviceInfo.platform.toLowerCase().includes(searchTermLower));

      const matchesFilter = filterType === 'all' ||
        (filterType === 'active' && conn.isActive) ||
        (filterType === 'desktop' && conn.deviceInfo.deviceType === 'desktop') ||
        (filterType === 'mobile' && conn.deviceInfo.deviceType === 'mobile') ||
        (filterType === 'tablet' && conn.deviceInfo.deviceType === 'tablet');

      return matchesSearch && matchesFilter;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'ip':
          aValue = a.deviceInfo.userIp;
          bValue = b.deviceInfo.userIp;
          break;
        case 'duration':
          aValue = a.sessionDuration || 0;
          bValue = b.sessionDuration || 0;
          break;
        case 'lastActivity':
          aValue = a.lastActivity || 0;
          bValue = b.lastActivity || 0;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [connections, searchTerm, filterType, sortBy, sortOrder]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openConnectionDetails = (connection: ExtendedConnection) => {
    setSelectedConnection(connection);
    setIsDialogOpen(true);
  };

  const closeConnectionDetails = () => {
    setSelectedConnection(null);
    setIsDialogOpen(false);
  };

  const formatDuration = (ms: number) => {
    if (!ms || ms === 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  const clearConnections = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données de connexion ? Cette action est irréversible.')) {
        try {
            const response = await fetch('/api/connections/clear', { method: 'POST' });
            if (response.ok) {
                setConnections([]);
            } else {
                alert('Erreur lors de la suppression des données.');
            }
        } catch (error) {
            console.error('Error clearing connections:', error);
            alert('Erreur lors de la suppression des données.');
        }
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(connections, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `connections-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Rendu des statistiques
  const renderStats = () => (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Users size={20} color="#1976d2" />
            <Typography variant="h5" sx={{ mt: 1 }}>{stats.total}</Typography>
            <Typography variant="caption" color="text.secondary">Total Connexions</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Activity size={20} color="#2e7d32" />
            <Typography variant="h5" sx={{ mt: 1 }}>{stats.activeNow}</Typography>
            <Typography variant="caption" color="text.secondary">Actives Maintenant</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Globe size={20} color="#ed6c02" />
            <Typography variant="h5" sx={{ mt: 1 }}>{stats.uniqueIPs}</Typography>
            <Typography variant="caption" color="text.secondary">IPs Uniques</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Clock size={20} color="#9c27b0" />
            <Typography variant="h5" sx={{ mt: 1 }}>
              {formatDuration(stats.avgSessionDuration)}
            </Typography>
            <Typography variant="caption" color="text.secondary">Durée Moyenne</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Rendu de la vue en cartes
  const renderCardView = () => (
    <Stack spacing={2}>
      {filteredConnections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((conn) => (
        <Paper key={conn.id} elevation={1} sx={{ borderRadius: 2, p: 2, border: '1px solid #e5e7eb' }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleExpand(conn.id)}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                {getDeviceIcon(conn.deviceInfo.deviceType)}
                {conn.isActive && <Badge badgeContent="●" color="success" />}
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {conn.deviceInfo.userIp}
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip 
                    label={conn.deviceInfo.browser || 'Inconnu'} 
                    size="small" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={conn.deviceInfo.platform || 'Inconnu'} 
                    size="small" 
                    variant="outlined" 
                  />
                  {conn.deviceInfo.location?.country && (
                    <Chip 
                      label={conn.deviceInfo.location.country} 
                      size="small" 
                      variant="outlined" 
                      icon={<MapPin size={12} />}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Box textAlign="right">
              <Typography variant="body2" color="text.secondary">
                {new Date(conn.timestamp).toLocaleString('fr-FR')}
              </Typography>
              {conn.sessionDuration && conn.sessionDuration > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Session: {formatDuration(conn.sessionDuration)}
                </Typography>
              )}
              <IconButton size="small">
                {expandedIds.includes(conn.id) ? <ChevronUp /> : <ChevronDown />}
              </IconButton>
            </Box>
          </Box>
          
          <Collapse in={expandedIds.includes(conn.id)}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Informations Techniques</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
                  <strong>User Agent:</strong> {conn.deviceInfo.userAgent}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Langue:</strong> {conn.deviceInfo.language}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Résolution:</strong> {conn.deviceInfo.screen}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Fuseau horaire:</strong> {conn.deviceInfo.timezone}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>Pages Visitées ({conn.pagesVisited?.length || 0})</Typography>
                {conn.pagesVisited && conn.pagesVisited.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflow: 'auto', pr: 1 }}>
                    {conn.pagesVisited.slice().reverse().map((visit, index) => (
                      <Box key={index} sx={{ mb: 1.5, p: 1, borderRadius: 1, border: '1px solid #eee' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', fontWeight: 500 }}>
                          {visit.page}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📅 {new Date(visit.timestamp).toLocaleString('fr-FR')}
                        </Typography>
                        {visit.referrer && (
                           <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                             🔗 Depuis: {visit.referrer}
                           </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Aucune page visitée enregistrée
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Collapse>
        </Paper>
      ))}
    </Stack>
  );

  // Rendu de la vue en tableau
  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead >
          <TableRow>
            <TableCell align="center">
              <Tooltip title="IP / Appareil">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <Devices fontSize="small" />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Localisation">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <LocationOn fontSize="small" />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Première Connexion">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <AccessTime fontSize="small" />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Durée Session">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <SignalCellularAlt fontSize="small" />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Statut">
                <Box display="flex" alignItems="center" justifyContent="center">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                </Box>
              </Tooltip>
            </TableCell>
            <TableCell align="center">
              <Tooltip title="Actions">
                <Box display="flex" alignItems="center" justifyContent="center">
                  Détails
                </Box>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredConnections.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((conn) => (
            <TableRow key={conn.id} hover>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {getDeviceIcon(conn.deviceInfo.deviceType)}
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {conn.deviceInfo.userIp}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {conn.deviceInfo.platform}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {conn.deviceInfo.location?.country || 'Inconnu'}
                  {conn.deviceInfo.location?.city && `, ${conn.deviceInfo.location.city}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(conn.timestamp).toLocaleDateString('fr-FR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(conn.timestamp).toLocaleTimeString('fr-FR')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {conn.sessionDuration ? formatDuration(conn.sessionDuration) : '-'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip 
                  label={conn.isActive ? 'Actif' : 'Inactif'} 
                  color={conn.isActive ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Voir détails">
                  <IconButton size="small" onClick={() => openConnectionDetails(conn)}>
                    <Eye size={16} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box 
      sx={{ 
        p: 4, 
        maxWidth: '1200px',
        width: '100%',
        mx: 'auto',
        '@media (max-width: 840px)': {
          width: '100%',
          maxWidth: '100%',
          px: 2
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Connexions et Analytics
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Actualiser">
            <IconButton onClick={fetchConnections}>
              <RefreshCw size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Exporter les données">
            <IconButton onClick={exportData}>
              <Download size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Vider les données">
            <IconButton onClick={clearConnections} color="error">
              <Trash2 size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Paper 
        elevation={0}
        sx={{
          width: '100%',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '@media (max-width: 750px)': {
            minWidth: '100%',
            maxWidth: '100%'
          }
        }}
      >
        <Tabs value={selectedTab} onChange={(_, value) => setSelectedTab(value)} >
          <Tab label="Vue d'ensemble" />
          <Tab label="Connexions" />
          <Tab label="Statistiques" />
        </Tabs>
      </Paper>

      {selectedTab === 0 && (
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            p: 3,
            mt: 2
          }}
        >
          {renderStats()}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Pages les plus visitées</Typography>
                  {stats.topPages.map((page, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>
                        {page.page}
                      </Typography>
                      <Chip label={page.visits} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Navigateurs populaires</Typography>
                  {stats.browsers.map((browser, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2">{browser.browser}</Typography>
                      <Chip label={browser.count} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            p: 3,
            mt: 2
          }}
        >
            <Box display="flex" gap={1} mb={3} flexWrap="wrap" sx={{
            mt: 2,
            '& > *': { flex: '1 1 auto', minWidth: '120px' },
            '& .MuiTextField-root': { minWidth: '200px' }
            }}>
            <TextField
              placeholder="Rechercher par IP, navigateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search size={20} /></InputAdornment>
              }}
              sx={{ flex: '2 1 200px' }}
            />
            
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Filtre</InputLabel>
              <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filtre"
              >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="active">Actifs</MenuItem>
              <MenuItem value="desktop">Desktop</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="tablet">Tablette</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Trier par</InputLabel>
              <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Trier par"
              >
              <MenuItem value="timestamp">Date</MenuItem>
              <MenuItem value="ip">IP</MenuItem>
              <MenuItem value="duration">Durée</MenuItem>
              <MenuItem value="lastActivity">Dernière activité</MenuItem>
              </Select>
            </FormControl>

            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outlined"
              size="small"
              sx={{ minWidth: 40 }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            <Button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              variant="outlined"
              size="small"
              sx={{ minWidth: 40 }}
            >
              {viewMode === 'cards' ? <BarChart3 size={16} /> : <Activity size={16} />}
            </Button>
            </Box>

          {viewMode === 'cards' ? renderCardView() : renderTableView()}

          <TablePagination
            component="div"
            count={filteredConnections.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        </Box>
      )}

      {selectedTab === 2 && (
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            p: 3,
            mt: 2
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Répartition par type d'appareil</Typography>
                  {stats.deviceTypes.map((device, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getDeviceIcon(device.type)}
                        <Typography variant="body2" textTransform="capitalize">
                          {device.type}
                        </Typography>
                      </Box>
                      <Chip label={device.count} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Statistiques temporelles</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Aujourd'hui</Typography>
                    <Typography variant="h6">{stats.today}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Cette semaine</Typography>
                    <Typography variant="h6">{stats.thisWeek}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Ce mois</Typography>
                    <Typography variant="h6">{stats.thisMonth}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Dialogue moderne pour les détails de connexion */}
      <Dialog 
        open={isDialogOpen} 
        onClose={closeConnectionDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            minHeight: '500px'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(5px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.7)',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            {selectedConnection && getDeviceIcon(selectedConnection.deviceInfo.deviceType)}
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Détails de la connexion
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedConnection?.deviceInfo.userIp}
              </Typography>
            </Box>
          </Box>
          {selectedConnection?.isActive && (
            <Chip 
              label="En ligne" 
              color="success" 
              size="small"
              sx={{ ml: 'auto' }}
            />
          )}
        </DialogTitle>
        
        <DialogContent 
          sx={{ 
            p: 4,
            background: 'transparent',
          }}
        >
          {selectedConnection && (
            <Grid container spacing={3} sx={{
              mt: 1,
            }}>
              {/* Informations principales */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card 
                  sx={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <Devices fontSize="small" />
                      Informations techniques
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Adresse IP</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedConnection.deviceInfo.userIp}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Plateforme</Typography>
                      <Typography variant="body1">
                        {selectedConnection.deviceInfo.platform || 'Inconnu'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Navigateur</Typography>
                      <Typography variant="body1">
                        {selectedConnection.deviceInfo.browser || 'Inconnu'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Type d'appareil</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getDeviceIcon(selectedConnection.deviceInfo.deviceType)}
                        <Typography variant="body1" textTransform="capitalize">
                          {selectedConnection.deviceInfo.deviceType || 'Desktop'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Langue</Typography>
                      <Typography variant="body1">
                        {selectedConnection.deviceInfo.language}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Résolution écran</Typography>
                      <Typography variant="body1">
                        {selectedConnection.deviceInfo.screen}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Informations de session */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <AccessTime fontSize="small" />
                      Session & localisation
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Première connexion</Typography>
                      <Typography variant="body1">
                        {new Date(selectedConnection.timestamp).toLocaleString('fr-FR')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Durée de session</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedConnection.sessionDuration ? formatDuration(selectedConnection.sessionDuration) : 'Pas de données'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Dernière activité</Typography>
                      <Typography variant="body1">
                        {selectedConnection.lastActivity ? 
                          new Date(selectedConnection.lastActivity).toLocaleString('fr-FR') : 
                          'Pas de données'
                        }
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Localisation</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn fontSize="small" />
                        <Typography variant="body1">
                          {selectedConnection.deviceInfo.location?.country || 'Inconnu'}
                          {selectedConnection.deviceInfo.location?.city && 
                            `, ${selectedConnection.deviceInfo.location.city}`}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fuseau horaire</Typography>
                      <Typography variant="body1">
                        {selectedConnection.deviceInfo.timezone}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Pages visitées */}
              <Grid size={{ xs: 12 }}>
                <Card 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                      <Visibility fontSize="small" />
                      Pages visitées ({selectedConnection.pagesVisited?.length || 0})
                    </Typography>
                    
                    {selectedConnection.pagesVisited && selectedConnection.pagesVisited.length > 0 ? (
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {selectedConnection.pagesVisited.map((visit, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              p: 2, 
                              mb: 1, 
                              background: '#f8fafc',
                              borderRadius: 1,
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <Typography variant="body1" fontWeight={600} sx={{wordBreak: 'break-all'}}>
                              {visit.page}
                            </Typography>
                            <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                              <Typography variant="caption" color="text.secondary">
                                📅 {new Date(visit.timestamp).toLocaleString('fr-FR')}
                              </Typography>
                              {visit.referrer && (
                                <Typography variant="caption" color="text.secondary" sx={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '300px'
                                }}>
                                  🔗 Depuis: {visit.referrer}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                        Aucune page visitée enregistrée
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              {/* User Agent complet */}
              <Grid size={{ xs: 12 }}>
                <Card 
                  sx={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User Agent Complet
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        background: '#f1f5f9',
                        p: 2,
                        borderRadius: 1,
                        wordBreak: 'break-all',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {selectedConnection.deviceInfo.userAgent}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions 
          sx={{ 
            background: 'rgba(255, 255, 255, 0.7)',
            borderTop: '1px solid #e5e7eb',
            p: 3
          }}
        >
          <Button 
            onClick={closeConnectionDetails} 
            variant="contained"
            sx={{
              background: '#3b82f6',
              color: 'white',
              '&:hover': {
                background: '#2563eb'
              }
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}