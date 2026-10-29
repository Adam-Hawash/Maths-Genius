"use client";

import { useEffect, useState } from "react";
import { Menu, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Emblem } from "./Ornaments";

const LINKS = [
  { href: "#home", label: "الرئيسية" },
  { href: "#features", label: "مميزات المنصة" },
  { href: "#news", label: "الأخبار" },
  { href: "#lessons", label: "الدروس" },
  { href: "#about", label: "عن المستر" },
];

export function Navbar({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-gold-500/20 bg-night-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* الشعار */}
        <a href="#home" className="group flex items-center gap-3" aria-label="الرئيسية">
          <Emblem size={46} className="glow-gold transition-transform duration-500 group-hover:rotate-12" />
          <span className="flex flex-col leading-tight">
            <span className="font-ruqaa text-xl font-bold text-gold-gradient sm:text-2xl">
              مستر محمد صبري
            </span>
            <span className="font-kufi text-[11px] tracking-wide text-cream/70">
              مادة اللغة العربية
            </span>
          </span>
        </a>

        {/* روابط سطح المكتب */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative font-kufi text-sm text-cream/80 transition-colors hover:text-gold-300 after:absolute after:-bottom-1.5 after:start-0 after:h-px after:w-0 after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={onLogin}
            variant="outline"
            className="border-gold-500/50 bg-gold-500/10 font-kufi text-gold-300 hover:bg-gold-500 hover:text-night-900"
          >
            <LogIn className="size-4" />
            دخول
          </Button>

          {/* قائمة الموبايل */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-gold-500/40 text-gold-300 lg:hidden"
                aria-label="فتح القائمة"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-gold-500/25 bg-night-700"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-start">
                  <Emblem size={38} />
                  <span className="font-ruqaa text-lg text-gold-gradient">مستر محمد صبري</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-2 flex flex-col gap-1 px-2" aria-label="قائمة الموبايل">
                {LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 font-kufi text-cream/85 transition-colors hover:bg-gold-500/10 hover:text-gold-300"
                  >
                    {l.label}
                  </a>
                ))}
                <Button
                  onClick={() => {
                    setOpen(false);
                    onLogin();
                  }}
                  className="mt-3 bg-gold-500 font-kufi text-night-900 hover:bg-gold-400"
                >
                  <LogIn className="size-4" />
                  تسجيل الدخول
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
