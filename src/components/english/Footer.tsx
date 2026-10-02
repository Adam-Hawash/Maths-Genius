import { Sparkles } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "#home", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#grades", label: "Grades" },
  { href: "#about", label: "About" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-safe mt-auto bg-[#12101F] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Link href="#home" className="flex items-center gap-3" aria-label="Mr. Islam Mohamed — home">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] font-display text-sm font-bold text-white ring-1 ring-[#F59E0B]/60"
                aria-hidden="true"
              >
                MI
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-display text-base font-bold text-white">Mr. Islam Mohamed</span>
                <span className="inline-flex items-center gap-1 font-display text-[10px] font-semibold tracking-[0.28em] text-white/50">
                  <Sparkles className="h-3 w-3 text-[#FBBF24]" aria-hidden="true" />
                  ENGLISH MADE EASY
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-center text-sm leading-relaxed text-white/55 md:text-left">
              Clear lessons, focused practice, and a teacher who makes English
              finally make sense.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer navigation">
            <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-white/40">
              Explore
            </p>
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm font-semibold text-white/65 transition-colors hover:text-[#C4B5FD]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/45 sm:text-sm">
            © {year} Mr. Islam Mohamed. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
