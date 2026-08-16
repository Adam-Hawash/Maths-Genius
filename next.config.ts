import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // Disable powered-by header for security
  poweredByHeader: false,

  // Vercel Build Command: npx next build --webpack
  // Do NOT use output: "standalone" — causes Turso/libsql webpack errors

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // Fix libsql webpack bundling: don't bundle these packages
    serverComponentsExternalPackages: [
      '@libsql/client',
      '@prisma/adapter-libsql',
      '@libsql/isomorphic-fetch',
      '@libsql/isomorphic-ws',
    ],
    // Optimize package imports for smaller chunks
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

  // Fix @libsql/client webpack error: ignore non-JS files (README.md, LICENSE)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.md$/i,
        type: 'asset/source',
      });
      config.module.rules.push({
        test: /\/(LICENSE|README)$/i,
        type: 'asset/source',
      });
    }
    return config;
  },
};

export default nextConfig;
