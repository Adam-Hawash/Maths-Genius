import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Standalone output for Vercel — smaller cold starts
  output: "standalone",

  // Disable powered-by header for security
  poweredByHeader: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // Optimize package imports for smaller chunks
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'embla-carousel-react',
      'react-day-picker',
      'date-fns',
    ],
    // ✅ Exclude dynamic upload paths from file tracing (fixes warning)
    outputFileTracingExcludes: {
      '*': ['./.tmp/**', './public/uploads/**'],
    },
  },

  // ✅ Image optimization — remotePatterns for external images
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
};

export default nextConfig;
