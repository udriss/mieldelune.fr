"use client";

import ClientWrapper from "@/components/gallery/client-wrapper";
import { PageHeader } from '@/components/page-header';
import { myFetch } from "@/lib/fetch-wrapper";
import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useSiteSettings } from '@/app/layout';
import { CountdownWidget } from '@/components/widgets/CountdownWidget';
import { PlaylistWidget } from '@/components/widgets/PlaylistWidget';
import { GuestbookWidget } from '@/components/widgets/GuestbookWidget';
import { MapWidget } from '@/components/widgets/MapWidget';

// Définition de l'interface pour les paramètres du site
interface SiteSettings {
  titleSite: string;
  descriptionSite: string;
  [key: string]: any; // Pour d'autres propriétés éventuelles
}

export default function HomeClient() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const settings = useSiteSettings();

  useEffect(() => {
    async function fetchSiteSettings() {
      try {
        setLoading(true);
        const response = await myFetch('/api/siteSettings');
        const data = await response.json();
        setSiteSettings(data);
        // Définir le titre de la page dynamiquement
        document.title = data.titleSite ? `${data.titleSite} | MielDeLune` : 'Accueil | MielDeLune';
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres du site:", error);
        document.title = 'Accueil | MielDeLune';
      } finally {
        setLoading(false);
      }
    }
    fetchSiteSettings();
  }, []);

  function isWidgetEnabled(val: any) {
    return val === true || val === "true";
  }

  return (
    <Box className="rounded-lg max-w-[800px] w-full mx-auto mt-32 py-0 min-w-[300px]">
      {/* Widgets dynamiques */}
      {isWidgetEnabled(settings?.widgetCountdown) && (
        <Box mb={4}><CountdownWidget /></Box>
      )}
      {isWidgetEnabled(settings?.widgetPlaylist) && (
        <Box mb={4}><PlaylistWidget /></Box>
      )}
      {isWidgetEnabled(settings?.widgetGuestbook) && (
        <Box mb={4}><GuestbookWidget /></Box>
      )}
      {isWidgetEnabled(settings?.widgetMap) && (
        <Box mb={4}><MapWidget /></Box>
      )}
      {loading ? (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          height="64"
          sx={{ height: '16rem' }}
        >
          <CircularProgress color="primary" size={60} thickness={4} />
        </Box>
      ) : (
        <>
          <PageHeader 
            title={siteSettings?.titleSite || ""}
            description={siteSettings?.descriptionSite || ""} 
            classNameAddedTitle=""
            //classNameAddedTitle="animate-fadeIn"
            classNameAddedDescription=""
            // classNameAddedDescription="animate-fadeIn-two"
          />
          <ClientWrapper />
        </>
      )}
    </Box>
  );
}
