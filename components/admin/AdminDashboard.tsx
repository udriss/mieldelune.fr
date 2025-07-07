import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { ConnectionsList } from './ConnectionsList';
import { AdminTrackingSettings } from './AdminTrackingSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

export function AdminDashboard() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <LayoutDashboard size={24} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Administration - Système de Tracking
          </Typography>
          <Tooltip title="Actualiser toutes les données">
            <IconButton color="inherit" onClick={refreshPage}>
              <RefreshCw size={20} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="admin dashboard tabs"
          sx={{ px: 2 }}
        >
          <Tab 
            icon={<BarChart3 size={20} />}
            label="Analytics & Connexions" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<Settings size={20} />}
            label="Paramètres de Tracking" 
            {...a11yProps(1)} 
          />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <ConnectionsList />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <AdminTrackingSettings />
      </TabPanel>
    </Box>
  );
}
