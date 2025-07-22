import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "mieldelune.fr";
  
  // Structure de navigation pour les sitelinks Google
  const navigationStructure = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MielDeLune",
    "alternateName": "MielDeLune Photographie",
    "url": `https://${domain}`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `https://${domain}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "mainEntity": [
      {
        "@type": "WebPage",
        "@id": `https://${domain}/`,
        "name": "Accueil",
        "description": "Galeries photos de mariage authentiques et naturelles",
        "url": `https://${domain}/`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Accueil",
              "item": `https://${domain}/`
            }
          ]
        }
      },
      {
        "@type": "WebPage",
        "@id": `https://${domain}/artiste/`,
        "name": "Photographe",
        "description": "Découvrez le parcours et la vision de votre photographe",
        "url": `https://${domain}/artiste/`
      },
      {
        "@type": "WebPage",
        "@id": `https://${domain}/contact/`,
        "name": "Contact",
        "description": "Contactez-nous pour réserver votre séance photo",
        "url": `https://${domain}/contact/`
      },
      {
        "@type": "WebPage",
        "@id": `https://${domain}/reserver/`,
        "name": "Réserver",
        "description": "Réservez directement votre séance photo de mariage",
        "url": `https://${domain}/reserver/`
      }
    ]
  };

  return NextResponse.json(navigationStructure, {
    headers: {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'public, max-age=86400' // Cache 24h
    }
  });
}
