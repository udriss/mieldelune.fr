// next-sitemap.config.js
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "https://mieldelune.fr",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || "https://mieldelune.fr"}/sitemap-0.xml`,
    ],
  },
  // Options supplémentaires
  changefreq: 'monthly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/admin/*'], // Exclure certaines pages
};