import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "mieldelune.fr";

  // Ce sitemap.xml sert d'index et référence le sitemap détaillé dynamique (sitemap-0.xml)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://${domain}/mySitemap-0.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(sitemapIndex, {
    headers: { "Content-Type": "application/xml" }
  });
}