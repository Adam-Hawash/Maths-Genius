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

export const metadata: Metadata = {
  title: "Maths Genius - Mr Wael Khodier",
  description:
    "منصة عبقري الرياضيات - أ. وائل خضير. تبسيط الرياضيات، واجبات أسبوعية، امتحانات منتظمة، ومتابعة مستمرة للتقدم.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  var initialConfig: Record<string, string> = {}
  try {
    var dbModule = await import('@/lib/db')
    var db = dbModule.db
    var configs = await db.siteConfig.findMany()
    for (var i = 0; i < configs.length; i++) {
      initialConfig[configs[i].key] = configs[i].value
    }
  } catch(e) {}

  var faviconUrl = initialConfig.favicon_url || 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'
  var heroBg = initialConfig.hero_bg_image || ''
  var instructorPhoto = initialConfig.instructor_photo || ''

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Cairo font from Google Fonts CDN — avoids Turbopack build error */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Preload images from config */}
        {heroBg && <link rel="preload" href={heroBg} as="image" />}
        {instructorPhoto && <link rel="preload" href={instructorPhoto} as="image" />}
        {/* Favicon from config */}
        <link rel="icon" href={faviconUrl} />
        {/* Inject config for instant client-side access */}
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.style.backgroundColor="#09090b";window.__INITIAL_CONFIG__=' + JSON.stringify(initialConfig) }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'Cairo, sans-serif' }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
