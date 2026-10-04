import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AIAssistant } from "@/components/student/AIAssistant";
import { RecordingGuard } from "@/components/RecordingGuard";
import { FloatingInstallButton } from "@/components/InstallPwaButton";
import { DeviceMessages } from "@/components/DeviceMessages";
import { LangBoot } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export var metadata: Metadata = {
  title: "Math Genius - Mr.Wael Khodair",
  description:
    "منصة Math Genius - مستر وائل خضير. تبسيط الرياضيات، واجبات أسبوعية، امتحانات منتظمة، ومتابعة مستمرة للتقدم.",
  /* (2026-و106) PWA — المنصة تتنصّب كتطبيق من كروم على الموبايل */
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maths Genius",
  },
  icons: {
    /* (2026-و112) مفيش لوجو Z — أيقونة المنصة الرسمية (صورة المستر باسم Math Genius) —
       دي اللي بتظهر في نافذة حفظ كلمات السر في كروم (طلب المستر) */
    icon: "/pwa-icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  var initialConfig: Record<string, string> = {};
  try {
    // Use dynamic import with timeout to avoid blocking the page if DB is slow
    var dbPromise = import("@/lib/db").then(function(dbModule) {
      return dbModule.db.siteConfig.findMany();
    });
    var configs = await Promise.race([
      dbPromise,
      new Promise(function(resolve) { setTimeout(function() { resolve([]) }, 3000) })
    ]);
    for (var i = 0; i < (configs as any[]).length; i++) {
      initialConfig[(configs as any[])[i].key] = (configs as any[])[i].value;
    }
  } catch (e) {
    /* DB not available yet — client will fetch via /api/config */
  }

  // Favicon: أيقونة المنصة الرسمية (صورة المستر باسم Math Genius) —
  /* (2026-و112) أي favicon_url قديمة فيها لوجو Z = الأيقونة الرسمية
     (نفس ترميم Zicola و73) — عشان نافذة كلمات السر في كروم تعرض
     أيقونة كل منصة بتاعتها مش لوجو Z المشترك (طلب المستر) */
  var faviconUrl = initialConfig.favicon_url || "/pwa-icon-192.png";
  if (typeof faviconUrl !== "string" || faviconUrl === "" || faviconUrl.indexOf("logo.svg") !== -1) {
    faviconUrl = "/pwa-icon-192.png";
  }

  return (
    <html lang="en" dir="ltr" translate="no" suppressHydrationWarning>
      <head>
      <meta name="google" content="notranslate" />
        {/* (و64) سكريبت مبكر — الثيم (ليلي/نهاري) واللغة بيتريّكوا قبل أول رسم
            عشان مفيش وميض غلط: الثيم من مفتاح next-themes «theme» والافتراضي ليلي.
            (2026-و79) اللغة الافتراضية بقت **إنجليزي LTR** — طلب المستر الحرفي:
            «اللغة الإنجليزية تبقى هي اللغة الأساسية، الطالب يفتح يلاقيها» —
            اللي مختار عربي (mg_lang=ar) الاتجاه بيتقلب RTL قبل أول رسم */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');var c=(t==='light'?'light':'dark');var el=document.documentElement;el.classList.remove('dark','light');el.classList.add(c);el.style.colorScheme=c;if(localStorage.getItem('mg_lang')==='ar'){el.lang='ar';el.dir='rtl'}}catch(e){}",
          }}
        />
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

        {/* (2026-و106) PWA — manifest + ثيم الموبايل + أيقونة الشاشة الرئيسية */}
        <meta name="theme-color" content="#2D2D2D" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* (2026-و108) سبلاش فتح التطبيق — صورة المستر باسم المنصة على خلفية داكنة */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1284x2778.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/splash-750x1334.png" />

        {/* Inject config server-side for instant client access */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__INITIAL_CONFIG__=" +
              JSON.stringify(initialConfig),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "Cairo, sans-serif" }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        {/* (و64) قراءة اللغة المحفوظة وتطبيقها على <html> */}
        <LangBoot />
        {/* (و47) المساعد الذكي رجع زي ما كان — المستر طلب رجوعه بنفس المميزات (شيرين بس هي اللي اتشالت) */}
        <AIAssistant />
        {/* (2026-و109) طلب المستر: الزرار الثابت — زر عايم مثبت على الشاشة في كل الصفحات
            (الرئيسية + الطالب + الأدمن) بيختفي بس بعد التثبيت الفعلي */}
        <FloatingInstallButton />
        {/* (2026-و111) رسايل حل الشكاوى للجهاز — أول ما الطالب يفتح المنصة
            من الجهاز اللي بعت منه الشكوى تظهرله رسالة الأدمن بالحل */}
        <DeviceMessages />
        {/* حماية عامة من التسجيل/التصوير + أدوات المطوّر في كل الصفحات */}
        <RecordingGuard />
        <Toaster />
        {/* Toaster بتاع sonner — كل رسائل التنبيه في المنصة بتستخدمه (toast من sonner) */}
        <SonnerToaster position="top-center" richColors closeButton expand={false} />
        {/* (2026-و106) تسجيل Service Worker الخاص بالتثبيت كتطبيق (PWA) */}
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
