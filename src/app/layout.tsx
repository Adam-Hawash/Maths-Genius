import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { DynamicFavicon } from "@/components/DynamicFavicon";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
  // === Fetch config from DB on the SERVER (instant, no client JS needed) ===
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
        {/* Preload images from config — browser starts downloading BEFORE any JS runs */}
        {heroBg && <link rel="preload" href={heroBg} as="image" />}
        {instructorPhoto && <link rel="preload" href={instructorPhoto} as="image" />}
        {/* Favicon from config — instant, no flash */}
        <link rel="icon" href={faviconUrl} />
        {/* Inject config into page so client reads it instantly without API call */}
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.style.backgroundColor="#09090b";window.__INITIAL_CONFIG__=' + JSON.stringify(initialConfig) }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
