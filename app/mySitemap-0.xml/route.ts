import { NextResponse } from "next/server";

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "mieldelune.fr";
  const lastmod = new Date().toISOString();

  // Liste de toutes vos routes avec descriptions détaillées
  const urls = [
    { 
      loc: `https://${domain}/`, 
      lastmod, 
      changefreq: "weekly", 
      priority: "1.0",
      title: "Accueil - Galeries Photos de Mariage",
      description: "Découvrez nos galeries de photos de mariage authentiques et naturelles"
    },
    { 
      loc: `https://${domain}/artiste/`, 
      lastmod, 
      changefreq: "monthly", 
      priority: "0.8",
      title: "Photographe - Profil & Parcours",
      description: "Découvrez le parcours, la vision et les inspirations de votre photographe"
    },
    { 
      loc: `https://${domain}/contact/`, 
      lastmod, 
      changefreq: "monthly", 
      priority: "0.9",
      title: "Contact - Réservation",
      description: "Contactez-nous pour réserver votre séance photo de mariage"
    },
    { 
      loc: `https://${domain}/mentions-legales/`, 
      lastmod, 
      changefreq: "yearly", 
      priority: "0.3",
      title: "Mentions légales",
      description: "Mentions légales, informations sur l'éditeur du site et conditions d'utilisation"
    },
    { 
      loc: `https://${domain}/cookies/`, 
      lastmod, 
      changefreq: "yearly", 
      priority: "0.3",
      title: "Politique de Cookies",
      description: "Politique de cookies et protection des données personnelles"
    }
  ];

  const urlEntries = urls
    .map(({ loc, lastmod, changefreq, priority, title, description }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <news:news>
      <news:publication>
        <news:name>MielDeLune</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${lastmod}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
    </news:news>
  </url>`)
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" 
  xmlns:xhtml="http://www.w3.org/1999/xhtml" 
  xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" 
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${urlEntries}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: { "Content-Type": "application/xml" }
  });
}