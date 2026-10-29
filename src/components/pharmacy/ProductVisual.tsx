"use client";

import { createElement } from "react";
import { Droplets, Scissors, Bath, Smile, Eye, Sparkles, Pill, Stethoscope, Flower2, Palette, Heart, Brush, Baby, Milk, Car, Package, Star, FlaskConical, Flame, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhProduct } from "@/lib/store";

/** Icon registry — category.icon names map to Lucide icons */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Droplets, Scissors, Bath, Smile, Eye, Sparkles, Pill, Stethoscope,
  Flower2, Palette, Heart, Brush, Baby, Milk, Car, Package, Star, FlaskConical, Flame,
};

export function categoryIcon(name: string, fallback: LucideIcon = Pill): LucideIcon {
  return CATEGORY_ICONS[name] ?? fallback;
}

/**
 * Dynamically resolved category icon — rendered via createElement so no
 * component is created during render (React Compiler-safe).
 */
export function CategoryIcon({
  name,
  className,
  fallback = Pill,
}: {
  name: string;
  className?: string;
  fallback?: LucideIcon;
}) {
  return createElement(CATEGORY_ICONS[name] ?? fallback, { className, "aria-hidden": true });
}

const GROUP_STYLE: Record<string, { gradient: string; icon: LucideIcon; iconColor: string }> = {
  health: { gradient: "from-teal-50 via-sky-50 to-cyan-100", icon: Droplets, iconColor: "text-teal-600" },
  beauty: { gradient: "from-rose-50 via-pink-50 to-fuchsia-100", icon: Sparkles, iconColor: "text-rose-500" },
  baby: { gradient: "from-amber-50 via-orange-50 to-amber-100", icon: Baby, iconColor: "text-amber-600" },
  special: { gradient: "from-violet-50 via-purple-50 to-indigo-100", icon: Star, iconColor: "text-violet-600" },
};

/** Elegant CSS product visual — no external images needed, always loads fast */
export function ProductVisual({ product, className }: { product: PhProduct; className?: string }) {
  const style = GROUP_STYLE[product.category.group] ?? GROUP_STYLE.health;
  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden bg-gradient-to-br", style.gradient, className)}>
      {/* soft circles decoration */}
      <div aria-hidden className="absolute -top-8 -start-8 h-32 w-32 rounded-full bg-white/50 blur-2xl" />
      <div aria-hidden className="absolute -bottom-10 -end-6 h-36 w-36 rounded-full bg-white/40 blur-2xl" />
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <span aria-hidden className="select-none text-[5.5rem] font-black leading-none text-white/60">{product.brand.name.charAt(0)}</span>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
          <CategoryIcon name={product.category.icon} className={cn("h-8 w-8", style.iconColor)} fallback={style.icon} />
        </div>
        {product.size && (
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-foreground/70">{product.size}</span>
        )}
      </div>
      {/* brand chip */}
      <div className="absolute bottom-2 start-2 z-10 flex items-center gap-1.5 rounded-full bg-white/85 px-2 py-1 shadow-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: product.brand.color }} aria-hidden />
        <span className="text-[10px] font-bold text-foreground/75">{product.brand.name}</span>
      </div>
    </div>
  );
}

export function Stars({ rating, reviews, className }: { rating: number; reviews?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)} dir="ltr">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30")} aria-hidden />
        ))}
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">
        {rating.toFixed(1)}{reviews !== undefined ? ` (${reviews})` : ""}
      </span>
    </div>
  );
}
