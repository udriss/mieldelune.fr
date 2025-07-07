import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Globe,
  Activity,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

interface LiveMetrics {
  currentVisitors: number;
  averageSessionTime: number;
  bounceRate: number;
  topPages: { page: string; visitors: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  recentActivities: { action: string; timestamp: number; ip: string }[];
}

export function AdminMetricsWidget() {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    currentVisitors: 0,
    averageSessionTime: 0,
    bounceRate: 0,
    topPages: [],
    deviceBreakdown: [],
    recentActivities: []
  });

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const calculateMetrics = () => {
      try {
        const connections = JSON.parse(localStorage.getItem('connections') || '[]');
        const pageVisits = JSON.parse(localStorage.getItem('pageVisits') || '{}');
        const now = Date.now();
        const activeThreshold = 30 * 60 * 1000; // 30 minutes

        // Visiteurs actuels (actifs dans les 30 dernières minutes)
        const currentVisitors = connections.filter((conn: any) => {
          const lastActivity = getLastActivity(conn.id, pageVisits);
          return now - lastActivity < activeThreshold;
        }).length;

        // Temps de session moyen
        let totalSessionTime = 0;
        let sessionCount = 0;
        Object.keys(pageVisits).forEach(connectionId => {
          const visits = pageVisits[connectionId];
          if (visits && visits.length > 0) {
            const firstVisit = Math.min(...visits.map((v: any) => v.timestamp));
            const lastVisit = Math.max(...visits.map((v: any) => v.timestamp));
            totalSessionTime += lastVisit - firstVisit;
            sessionCount++;
          }
        });
        const averageSessionTime = sessionCount > 0 ? totalSessionTime / sessionCount : 0;

        // Taux de rebond (sessions avec une seule page)
        const singlePageSessions = Object.values(pageVisits).filter(
          (visits: any) => visits && visits.length === 1
        ).length;
        const bounceRate = sessionCount > 0 ? (singlePageSessions / sessionCount) * 100 : 0;

        // Top pages
        const pageMap = new Map();
        Object.values(pageVisits).flat().forEach((visit: any) => {
          pageMap.set(visit.page, (pageMap.get(visit.page) || 0) + 1);
        });
        const topPages = Array.from(pageMap.entries())
          .map(([page, visitors]) => ({ page, visitors }))
          .sort((a, b) => b.visitors - a.visitors)
          .slice(0, 5);

        // Répartition des appareils
        const deviceMap = new Map();
        connections.forEach((conn: any) => {
          const deviceType = getDeviceType(conn.deviceInfo.userAgent);
          deviceMap.set(deviceType, (deviceMap.get(deviceType) || 0) + 1);
        });
        const totalDevices = connections.length;
        const deviceBreakdown = Array.from(deviceMap.entries()).map(([device, count]) => ({
          device,
          count,
          percentage: totalDevices > 0 ? (count / totalDevices) * 100 : 0
        }));

        // Activités récentes
        const recentActivities = Object.entries(pageVisits)
          .flatMap(([connectionId, visits]: [string, any]) => 
            visits.map((visit: any) => ({
              action: `Visite de ${visit.page}`,
              timestamp: visit.timestamp,
              ip: connections.find((c: any) => c.id === connectionId)?.deviceInfo.userIp || 'Inconnu'
            }))
          )
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);

        setMetrics({
          currentVisitors,
          averageSessionTime,
          bounceRate,
          topPages,
          deviceBreakdown,
          recentActivities
        });

      } catch (error) {
        console.error('Erreur lors du calcul des métriques:', error);
      }
    };

    // Fonction utilitaire pour obtenir la dernière activité
    const getLastActivity = (connectionId: string, pageVisits: any) => {
      if (!pageVisits[connectionId] || pageVisits[connectionId].length === 0) return 0;
      return Math.max(...pageVisits[connectionId].map((v: any) => v.timestamp));
    };

    // Fonction utilitaire pour déterminer le type d'appareil
    const getDeviceType = (userAgent: string) => {
      if (/Mobile|Android|iPhone/.test(userAgent)) return 'Mobile';
      if (/iPad|Tablet/.test(userAgent)) return 'Tablet';
      return 'Desktop';
    };

    calculateMetrics();
    const interval = setInterval(calculateMetrics, 30000); // Mise à jour toutes les 30 secondes

    // Vérifier la connexion
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes}m`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>
          Métriques en Temps Réel
        </Typography>
        <Chip 
          label={isOnline ? 'En ligne' : 'Hors ligne'} 
          color={isOnline ? 'success' : 'error'}
          size="small"
          icon={<Activity size={14} />}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Métriques principales */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Users size={32} color="#1976d2" />
              <Typography variant="h3" sx={{ mt: 1, mb: 0.5 }}>
                {metrics.currentVisitors}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visiteurs actuels
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Clock size={32} color="#2e7d32" />
              <Typography variant="h3" sx={{ mt: 1, mb: 0.5 }}>
                {formatDuration(metrics.averageSessionTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Session moyenne
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDown size={32} color="#d32f2f" />
              <Typography variant="h3" sx={{ mt: 1, mb: 0.5 }}>
                {metrics.bounceRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taux de rebond
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pages populaires */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Globe size={20} />
                Pages Populaires
              </Typography>
              <List dense>
                {metrics.topPages.map((page, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={page.page} 
                      secondary={`${page.visitors} visiteurs`}
                    />
                    <Chip label={index + 1} size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition des appareils */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Monitor size={20} />
                Types d'Appareils
              </Typography>
              <List dense>
                {metrics.deviceBreakdown.map((device, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {getDeviceIcon(device.device)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={device.device}
                      secondary={
                        <Box>
                          <Typography component="span" variant="body2">
                            {device.count} appareils ({device.percentage.toFixed(1)}%)
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={device.percentage} 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Activités récentes */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Activity size={20} />
                Activités Récentes
              </Typography>
              <List dense>
                {metrics.recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText 
                        primary={activity.action}
                        secondary={`${activity.ip} - ${new Date(activity.timestamp).toLocaleTimeString('fr-FR')}`}
                      />
                    </ListItem>
                    {index < metrics.recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
