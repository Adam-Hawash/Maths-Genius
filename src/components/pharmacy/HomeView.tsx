"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft, BadgePercent, Headset, ShieldCheck, Sparkles, Star, Truck, Lock, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore, type PhProduct, DEFAULT_FILTERS } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { CategoryIcon } from "./ProductVisual";

export function HomeView() {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const navigate = useStore((s) => s.navigate);
  const setFilters = useStore((s) => s.setFilters);
  const catalog = useStore((s) => s.catalog);

  const [featured, setFeatured] = useState<PhProduct[] | null>(null);
  const [sale, setSale] = useState<PhProduct[] | null>(null);
  const [fresh, setFresh] = useState<PhProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r1, r2, r3] = await Promise.all([
          fetch("/api/products?featured=1&limit=8"),
          fetch("/api/products?sale=1&sort=rating&limit=8"),
          fetch("/api/products?isNew=1&limit=8"),
        ]);
        const d1 = await r1.json(), d2 = await r2.json(), d3 = await r3.json();
        if (!cancelled) {
          setFeatured(d1.products ?? []);
          setSale(d2.products ?? []);
          setFresh(d3.products ?? []);
        }
      } catch {
        if (!cancelled) { setFeatured([]); setSale([]); setFresh([]); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goShop = (f: Partial<typeof DEFAULT_FILTERS> = {}) => {
    setFilters({ ...DEFAULT_FILTERS, ...f });
    navigate({ name: "shop" });
  };

  return (
    <div className="flex flex-col">
      {/* ============================ HERO ============================ */}
      <section className="hero-mesh border-b">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:py-14 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
            className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-start"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1.5 text-xs font-black text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t.heroBadge}
            </span>
            <h1 className="text-3xl font-black leading-[1.25] text-foreground sm:text-4xl lg:text-[2.9rem]">
              {t.heroTitle1}
              <span className="block bg-gradient-to-l from-primary to-teal-500 bg-clip-text text-transparent">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button size="lg" className="h-12 gap-2 rounded-xl px-7 text-sm font-black shadow-lg shadow-primary/25" onClick={() => goShop()}>
                {t.heroCtaShop}
                <ArrowLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" aria-hidden />
              </Button>
              <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl border-primary/30 px-7 text-sm font-black text-primary hover:bg-accent" onClick={() => goShop({ sale: true })}>
                <Flame className="h-4 w-4" aria-hidden />
                {t.heroCtaDeals}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-muted-foreground lg:justify-start">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />{t.heroChip1}</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" aria-hidden />{t.heroChip2}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="relative"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border shadow-2xl shadow-primary/10">
              <Image src="/images/hero.png" alt={lang === "ar" ? "منتجات الصيدلية المميزة" : "Pharmacy featured products"} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
              className="absolute -bottom-4 start-4 flex items-center gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:start-8"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck className="h-5 w-5" aria-hidden /></span>
              <div className="leading-tight">
                <p className="text-[13px] font-black text-foreground">{t.heroFloat1}</p>
                <p className="text-[11px] font-bold text-muted-foreground">{t.heroFloat1Sub}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
              className="absolute -top-4 end-4 flex items-center gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:end-8"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><BadgePercent className="h-5 w-5" aria-hidden /></span>
              <div className="leading-tight">
                <p className="text-[13px] font-black text-foreground">{t.heroFloat2}</p>
                <p className="text-[11px] font-bold text-muted-foreground">{t.heroFloat2Sub}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ======================== TRUST STRIP ========================= */}
      <section className="border-b bg-white" aria-label="trust">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { icon: Truck, title: t.trustShip, sub: t.trustShipSub },
            { icon: ShieldCheck, title: t.trustOriginal, sub: t.trustOriginalSub },
            { icon: Lock, title: t.trustSecure, sub: t.trustSecureSub },
            { icon: Headset, title: t.trustSupport, sub: t.trustSupportSub },
          ].map((it, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3.5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <it.icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-black">{it.title}</p>
                <p className="text-[11px] font-semibold text-muted-foreground">{it.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ====================== SHOP BY CATEGORY ====================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <SectionHead title={t.shopByCategory} sub={t.shopByCategorySub} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
          {catalog.categories.length === 0
            ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
            : catalog.categories.slice(0, 14).map((c, i) => {
                return (
                  <motion.button
                    key={c.slug}
                    type="button"
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    onClick={() => goShop({ category: c.slug })}
                    className="cat-circle flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-center"
                    aria-label={lang === "ar" ? c.nameAr : c.nameEn}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                      <CategoryIcon name={c.icon} className="h-5.5 w-5.5" />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-black leading-tight text-foreground/85">
                      {lang === "ar" ? c.nameAr : c.nameEn}
                    </span>
                  </motion.button>
                );
              })}
        </div>
      </section>

      {/* ========================== BRANDS ============================ */}
      <section className="border-y bg-muted/40 py-10">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHead title={t.topBrands} sub={t.topBrandsSub} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {catalog.brands.slice(0, 16).map((b, i) => (
              <motion.button
                key={b.slug}
                type="button"
                initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
                onClick={() => goShop({ brands: [b.slug] })}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-white p-3.5 transition-shadow hover:shadow-md"
                aria-label={b.name}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-black text-white shadow-sm"
                  style={{ backgroundColor: b.color }}
                  aria-hidden
                >
                  {b.name.charAt(0)}
                </span>
                <span className="text-[11px] font-black text-foreground/80">{b.name}</span>
                {b.country && <span className="text-[9px] font-bold text-muted-foreground">{b.country}</span>}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== BEST SELLERS ======================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <SectionHead title={`⭐ ${t.bestSellers}`} sub={t.bestSellersSub} onAll={() => goShop({ sort: "rating" })} allLabel={t.viewAll} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ======================== PROMO BANNER ======================== */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary via-teal-600 to-teal-500 text-white shadow-xl"
        >
          <div className="grid items-center gap-6 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col items-start gap-3">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-black backdrop-blur">
                🎁 {t.promoCodeLabel}: SECOND40
              </span>
              <h3 className="text-2xl font-black leading-snug sm:text-3xl">{t.promoBannerTitle}</h3>
              <p className="max-w-lg text-sm leading-relaxed text-white/85">{t.promoBannerSub}</p>
              <Button size="lg" className="mt-2 h-11 gap-2 rounded-xl bg-white px-6 text-sm font-black text-primary hover:bg-white/90" onClick={() => goShop({ sale: true })}>
                {t.promoBannerCta}
                <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
              </Button>
            </div>
            <div className="relative mx-auto hidden aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl lg:block">
              <Image src="/images/banner-sale.png" alt={t.promoBannerTitle} fill sizes="400px" className="object-cover" />
            </div>
          </div>
          <div aria-hidden className="absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </motion.div>
      </section>

      {/* ========================== ON SALE =========================== */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10">
        <SectionHead title={`🔥 ${t.dealsTitle}`} sub={t.dealsSub} onAll={() => goShop({ sale: true })} allLabel={t.viewAll} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {sale === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : sale.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ======================== BABY BANNER ========================= */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border bg-gradient-to-l from-amber-50 to-orange-50 shadow-sm"
        >
          <div className="grid items-center gap-6 p-7 sm:p-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-3">
              <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black text-amber-700">👶 {t.groupBaby}</span>
              <h3 className="max-w-md text-2xl font-black leading-snug text-foreground sm:text-3xl">{t.babyBannerTitle}</h3>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{t.babyBannerSub}</p>
              <Button size="lg" className="mt-2 h-11 rounded-xl bg-amber-500 px-6 text-sm font-black text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600" onClick={() => goShop({ category: "diapering" })}>
                {t.babyBannerCta}
                <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
              </Button>
            </div>
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
              <Image src="/images/banner-baby.png" alt={t.babyBannerTitle} fill sizes="(max-width: 1024px) 100vw, 450px" className="object-cover" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ======================== NEW ARRIVALS ======================== */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12">
        <SectionHead title={t.newArrivals} sub={t.newArrivalsSub} onAll={() => goShop({})} allLabel={t.viewAll} />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
          {fresh === null
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : fresh.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, sub, onAll, allLabel }: { title: string; sub?: string; onAll?: () => void; allLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black text-foreground sm:text-2xl">
          <Star className="h-5 w-5 text-primary" aria-hidden />
          {title}
        </h2>
        {sub && <p className="mt-1 text-[13px] font-semibold text-muted-foreground">{sub}</p>}
      </div>
      {onAll && allLabel && (
        <Button variant="outline" size="sm" className="h-9 shrink-0 rounded-xl border-primary/30 px-4 text-xs font-black text-primary hover:bg-accent" onClick={onAll}>
          {allLabel}
          <ArrowLeft className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden />
        </Button>
      )}
    </div>
  );
}
