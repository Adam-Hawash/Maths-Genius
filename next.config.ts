import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  poweredByHeader: false,
  allowedDevOrigins: ['localhost', '127.0.0.1'],
  serverExternalPackages: [
    '@libsql/client',
    '@prisma/adapter-libsql',
    '@libsql/isomorphic-fetch',
    '@libsql/isomorphic-ws',
    /* (و49) القص السيرفري للرسومات — pdf.js legacy + napi canvas لازم يفضلوا خارجية */
    'pdfjs-dist',
    '@napi-rs/canvas',
  ],
  /* (و49) خطوط pdf.js القياسية لازم توصل مع الدالة على Vercel (نصوص الرسمة تترسم صح) */
  outputFileTracingIncludes: {
    '/api/ai-extract': ['./node_modules/pdfjs-dist/standard_fonts/**'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '500mb' },
    optimizePackageImports: ['lucide-react', 'framer-motion', 'embla-carousel-react', 'react-day-picker', 'date-fns'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async headers() {
    // Production-only: immutable caching for static assets.
    // In dev these headers make the browser stick to stale chunks forever.
    if (process.env.NODE_ENV !== 'production') return [];
    return [
      { source: '/uploads/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
  turbopack: {},
};

export default nextConfig;
