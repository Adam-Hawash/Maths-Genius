import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Disable powered-by header for security
  poweredByHeader: false,

  // Fix libsql: don't bundle these server-only packages
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql',
    '@libsql/isomorphic-fetch',
    '@libsql/isomorphic-ws',
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'embla-carousel-react',
      'react-day-picker',
      'date-fns',
    ],
  },

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

  // Aggressive static caching
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // Silence Turbopack webpack-config warning (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
