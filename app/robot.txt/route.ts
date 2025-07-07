import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "mieldelune.fr";
  const robots = `User-agent: *
Allow: /

Host: https://${domain}

Sitemap: https://${domain}/mySitemap.xml`;

  return new NextResponse(robots, {
    headers: { "Content-Type": "text/plain" },
  });
}