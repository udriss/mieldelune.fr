'use client'

import { useState, useEffect } from 'react';
import { type SiteData } from '@/lib/dataSite';
import { myFetch } from '@/lib/fetch-wrapper';
import { Box, Typography } from '@mui/material';


interface PageHeaderProps {
  title?: string;
  description?: string[];
}

export function PageHeaderV2({ title, description }: PageHeaderProps) {
  const [siteData, setSiteData] = useState<SiteData>({
    titleSite: '',
    descriptionSite: ''
  });

  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const loadSiteData = async () => {
      try {
        const response = await myFetch('/api/siteSettings');
        const data = await response.json();
        if (data.success) {
          setSiteData(data.site);
        }
      } catch (error) {
        console.error('Error loading site data:', error);
      }
    };
    loadSiteData();
  }, []);

  useEffect(() => {
    if (description && description.length > 0) {
      const timer = setInterval(() => {
        setOpacity(0);
        setTimeout(() => {
          setCurrentDescriptionIndex((prevIndex) => (prevIndex + 1) % description.length);
          setOpacity(1);
        }, 500); // Change text after fade out
      }, 3000); // Change text every 3 seconds

      return () => clearInterval(timer);
    }
  }, [description]);

  const displayDescription = description && description.length > 0 ? description[currentDescriptionIndex] : siteData.descriptionSite;

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2, // Corresponds to space-y-4
        mb: 4, // Corresponds to mb-8
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 'bold',
          letterSpacing: '-0.025em', // Corresponds to tracking-tight
          fontSize: siteData.fontSizePx ? `${1.5 * siteData.fontSizePx}px` : '2.25rem',
        }}
      >
        {title || siteData.titleSite}
      </Typography>
      {displayDescription && (
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary', // Corresponds to text-gray-500
            maxWidth: '800px',
            width: '100%',
            mx: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            textAlign: 'center',
            opacity: opacity,
            transition: 'opacity 0.5s',
            minHeight: '2.5em',
            height: '2.5em',
            lineHeight: 1.25,
        backdropFilter: 'blur(6px)', // Ajoute l'effet de flou
        WebkitBackdropFilter: 'blur(6px)', // Pour compatibilité Safari
        background: "rgba(255, 255, 255, 0.35)",
        borderRadius: "10px",
        padding: "10px",
          }}
        >
          {displayDescription}
        </Typography>
      )}
    </Box>
  );
}