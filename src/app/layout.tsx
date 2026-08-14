import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
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
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/uploads/photos/mr-wael-official.webp" as="image" type="image/webp" />
        <link rel="preload" href="/uploads/photos/hero-banner-math-genius.webp" as="image" type="image/webp" />
        <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.style.backgroundColor="#09090b"' }} />
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
