import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: "standalone",
  poweredByHeader: false,

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

  // ✅ هنا برا experimental
  outputFileTracingExcludes: {
    '*': ['./.tmp/**', './public/uploads/**'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },

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
};

export default nextConfig;
