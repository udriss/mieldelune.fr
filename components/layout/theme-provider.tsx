"use client";

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import siteData from '@/data/siteData.json';
import { usePathname } from 'next/navigation';

// Thème par défaut pour les pages d'administration
const adminTheme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'transparent',
        },
      },
    },
  },
});

// Thème personnalisé pour le site public
const publicTheme = createTheme({
  palette: {
    primary: {
      main: siteData.primaryColor || '#db42f0',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'transparent',
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') ?? false;

  const theme = isAdminPage ? adminTheme : publicTheme;

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
