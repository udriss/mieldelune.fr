'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface BreadcrumbItem {
  name: string;
  item: string;
}

export function StructuredDataBreadcrumbs() {
  const pathname = usePathname();

  useEffect(() => {
    // Générer les breadcrumbs selon la page
    const generateBreadcrumbs = (): BreadcrumbItem[] => {
      const breadcrumbs: BreadcrumbItem[] = [
        {
          name: "Accueil",
          item: "https://mieldelune.fr/"
        }
      ];

      if (pathname === '/artiste') {
        breadcrumbs.push({
          name: "Photographe",
          item: "https://mieldelune.fr/artiste"
        });
      } else if (pathname === '/contact') {
        breadcrumbs.push({
          name: "Contact",
          item: "https://mieldelune.fr/contact"
        });
      } else if (pathname === '/reserver') {
        breadcrumbs.push({
          name: "Réserver",
          item: "https://mieldelune.fr/reserver"
        });
      } else if (pathname?.startsWith('/mariage/')) {
        breadcrumbs.push({
          name: "Galerie Mariage",
          item: `https://mieldelune.fr${pathname}`
        });
      }

      return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();
    
    if (breadcrumbs.length > 1) {
      // Supprimer le script existant s'il y en a un
      const existingScript = document.getElementById('breadcrumb-structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      // Créer le nouveau script avec les données structurées
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": crumb.item
        }))
      };

      const script = document.createElement('script');
      script.id = 'breadcrumb-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [pathname]);

  return null; // Ce composant n'affiche rien visuellement
}
