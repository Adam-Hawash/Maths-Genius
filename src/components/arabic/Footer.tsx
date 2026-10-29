"use client";

import { Emblem, OrnamentDivider } from "./Ornaments";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-gold-500/20 bg-night-900/90">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-9 text-center sm:px-6">
        <Emblem size={48} className="glow-gold" />
        <p className="font-ruqaa text-2xl font-bold text-gold-gradient">
          مستر محمد صبري
        </p>
        <p className="font-kufi text-xs tracking-wider text-cream/60">
          مادة اللغة العربية
        </p>
        <OrnamentDivider width={240} className="max-w-full" />
        <p className="text-xs text-cream/50">
          © {year} منصّة مستر محمد صبري للغة العربية — جميع الحقوق محفوظة
        </p>
        <p className="font-amiri text-sm text-gold-500/70">
          صُنع بحُبٍّ للغة الضاد ✦
        </p>
      </div>
    </footer>
  );
}
