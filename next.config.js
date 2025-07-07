/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: [process.env.NEXT_PUBLIC_DEPLOYMENT_DOMAIN || 'mieldelune.fr'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Origin, Content-Type, Accept' },
        ],
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Ajustez cette valeur selon vos besoins
    },
  },
  typescript: {
    // Ensure TypeScript compilation
    ignoreBuildErrors: false
  },
  // Configuration pour les origines autorisées en développement
  allowedDevOrigins: [
    'mieldelune.fr',
    'www.mieldelune.fr',
    'localhost:8005',
    '127.0.0.1:8005'
  ],
  // Add trailing slash to URLs
  trailingSlash: true
};

module.exports = nextConfig;