"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#grades", label: "Grades" },
  { href: "#about", label: "About" },
];

function MIBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] font-display text-sm font-bold text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,0.55)] ring-1 ring-[#F59E0B]/60 ${className}`}
      aria-hidden="true"
    >
      MI
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const dark = !scrolled && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-white/85 shadow-[0_8px_30px_-18px_rgba(18,16,31,0.25)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="#home" className="flex items-center gap-3" aria-label="Mr. Islam Mohamed — home">
          <MIBadge />
          <span className="flex flex-col leading-tight">
            <span className={`font-display text-base font-bold ${dark ? "text-white" : "text-foreground"}`}>
              Mr. Islam
            </span>
            <span
              className={`font-display text-[10px] font-semibold tracking-[0.28em] ${
                dark ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              ENGLISH MADE EASY
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  dark
                    ? "text-white/75 hover:bg-white/10 hover:text-white"
                    : "text-foreground/75 hover:bg-muted hover:text-primary"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
              dark
                ? "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]"
                : "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#B45309]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            English Made Easy
          </span>
          <Button
            size="sm"
            onClick={() => setToast("The student portal is coming soon.")}
            className="h-9 rounded-full bg-[#7C3AED] px-5 font-semibold text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.6)] hover:bg-[#6D28D9]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open menu"
              className={`md:hidden ${
                dark
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  : "border-border bg-white text-foreground"
              }`}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-border bg-white">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2.5 text-foreground">
                <MIBadge className="h-9 w-9" />
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-bold">Mr. Islam</span>
                  <span className="font-display text-[9px] font-semibold tracking-[0.28em] text-muted-foreground">
                    ENGLISH MADE EASY
                  </span>
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-2 flex flex-col gap-1 px-4" aria-label="Mobile navigation">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
              <Button
                onClick={() => setToast("The student portal is coming soon.")}
                className="mt-3 rounded-xl bg-[#7C3AED] font-semibold text-white hover:bg-[#6D28D9]"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Login
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Mini toast for the coming-soon portal */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#7C3AED]/25 bg-[#12101F] px-5 py-2.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast ?? ""}
      </div>
    </header>
  );
}
