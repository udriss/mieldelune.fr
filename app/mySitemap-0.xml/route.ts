import { NextResponse } from "next/server";

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "mieldelune.fr";
  const lastmod = new Date().toISOString();

  // Liste de toutes vos routes
  const urls = [
    { loc: `https://${domain}/cookies/`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `https://${domain}/contact/`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `https://${domain}/mentions-legales/`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `https://${domain}/reserver/`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `https://${domain}/`, lastmod, changefreq: "monthly", priority: "0.7" },
    { loc: `https://${domain}/admin/`, lastmod, changefreq: "monthly", priority: "0.7" },
  ];

  const urlEntries = urls
    .map(({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
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