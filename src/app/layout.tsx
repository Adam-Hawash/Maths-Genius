import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mr. Islam Mohamed | English Made Easy",
  description:
    "The official platform of Mr. Islam Mohamed — learn English with clear grammar, rich vocabulary, and focused practice in reading, writing, listening, and speaking. English Made Easy.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#12101F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: fonts declared in the root layout apply to every page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* (2026-Z32) PWA — manifest + أيقونات iOS + تسجيل Service Worker من أول تحميل
            (من غير كده كروم مش بيعتبر المنصة قابلة للتثبيت وزرار «التطبيق» بيطلع
            تعليمات يدوية بدل نافذة التثبيت الرسمية) */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}}catch(e){}",
          }}
        />
      </body>
    </html>
  );
}
