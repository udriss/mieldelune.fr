"use client";

import { useState, useEffect } from "react";
import type { Wedding } from '@/lib/dataTemplate';
import { Loader2 } from "lucide-react";
import { TimelineGallery } from "@/components/gallery/timeline";
import { GridView } from "@/components/gallery/gridview";
import { MasonryGallery } from "@/components/gallery/masonry";
import { useSiteSettings } from '@/app/layout';

interface WeddingGalleryProps {
  wedding: Wedding;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full w-full">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
  </div>
);

export function WeddingGallery({ wedding }: WeddingGalleryProps) {
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const siteSettings = useSiteSettings();
  // Détermine le template de galerie à utiliser : priorité mariage > admin > fallback
  const templateType = currentWedding?.templateType || siteSettings?.layout || 'timeline';

  useEffect(() => {
    const initGallery = async () => {
      try {
        const resolvedWedding = wedding instanceof Promise ? await wedding : wedding;
        setCurrentWedding(resolvedWedding);
      } catch (error) {
        console.error('Gallery initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initGallery();
  }, [wedding]);

  if (isLoading || !currentWedding) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      {templateType === 'timeline' ? (
        <TimelineGallery wedding={currentWedding} />
      ) : templateType === 'masonry' ? (
        <MasonryGallery wedding={currentWedding} />
      ) : (
        <GridView wedding={currentWedding} />
      )}
    </div>
  );
} 