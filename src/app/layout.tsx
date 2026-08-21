import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export var metadata: Metadata = {
  title: "Maths Genius - Mr Wael Khodier",
  description:
    "منصة عبقري الرياضيات - أ. وائل خضير. تبسيط الرياضيات، واجبات أسبوعية، امتحانات منتظمة، ومتابعة مستمرة للتقدم.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  var initialConfig: Record<string, string> = {};
  try {
    var dbModule = await import("@/lib/db");
    var db = dbModule.db;
    var configs = await db.siteConfig.findMany();
    for (var i = 0; i < configs.length; i++) {
      initialConfig[configs[i].key] = configs[i].value;
    }
  } catch (e) {
    /* DB not available yet — initialConfig stays as empty object, frontend will fetch via /api/config */
  }

  // Favicon: use user's custom image or empty (no Z logo)
  var faviconUrl = initialConfig.favicon_url || "https://imgh.in/host/4pdrhw";

  // Collect all image URLs for preloading — safely access each key
  var heroBg = (initialConfig.hero_bg_image || "");
  var instructorPhoto = (initialConfig.instructor_photo || "");
  var tipsBg = (initialConfig.tips_bg_image || "");
  var siteLogo = (initialConfig.site_logo || "");
  var tip1 = (initialConfig.tip1_image || "");
  var tip2 = (initialConfig.tip2_image || "");
  var tip3 = (initialConfig.tip3_image || "");
  var tipsSectionImg = (initialConfig.tips_section_image || "");

  var allImages = [heroBg, instructorPhoto, tipsBg, siteLogo, tip1, tip2, tip3, tipsSectionImg].filter(function (url) {
    return url && url.length > 0;
  });

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Cairo via Google Fonts CDN (avoids Turbopack build error) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Favicon — user's custom image, NO Z logo */}
        <link rel="icon" href={faviconUrl} />

        {/* Preload all config images for instant display */}
        {allImages.map(function (url, idx) {
          return (
            <link
              key={"preload-" + idx}
              rel="preload"
              href={url}
              as="image"
            />
          );
        })}

        {/* Inject config server-side for instant client access */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.style.backgroundColor='#09090b';window.__INITIAL_CONFIG__=" +
              JSON.stringify(initialConfig),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "Cairo, sans-serif" }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
