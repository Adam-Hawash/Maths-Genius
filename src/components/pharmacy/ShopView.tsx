"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, PackageSearch, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore, type PhProduct } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CategoryIcon } from "./ProductVisual";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

export function ShopView() {
  const lang = useStore((s) => s.lang);
  const t = useT(lang);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const resetFilters = useStore((s) => s.resetFilters);
  const catalog = useStore((s) => s.catalog);

  const [products, setProducts] = useState<PhProduct[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minInput, setMinInput] = useState(filters.min?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(filters.max?.toString() ?? "");

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.category) sp.set("category", filters.category);
    if (filters.brands.length) sp.set("brand", filters.brands.join(","));
    if (filters.skinTypes.length) sp.set("skinType", filters.skinTypes.join(","));
    if (filters.sale) sp.set("sale", "1");
    if (filters.min != null && !Number.isNaN(filters.min)) sp.set("min", String(filters.min));
    if (filters.max != null && !Number.isNaN(filters.max)) sp.set("max", String(filters.max));
    sp.set("sort", filters.sort);
    sp.set("limit", "60");
    return sp.toString();
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/products?${queryString}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [queryString]);

  useEffect(() => {
    setMinInput(filters.min?.toString() ?? "");
    setMaxInput(filters.max?.toString() ?? "");
  }, [filters.min, filters.max]);

  const applyPrice = useCallback(() => {
    const min = parseFloat(minInput);
    const max = parseFloat(maxInput);
    setFilters({
      min: !Number.isNaN(min) ? min : null,
      max: !Number.isNaN(max) ? max : null,
    });
  }, [minInput, maxInput, setFilters]);

  const toggleIn = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const activeCategory = catalog.categories.find((c) => c.slug === filters.category);
  const hasFilters =
    !!filters.q || !!filters.category || filters.brands.length > 0 || filters.skinTypes.length > 0 || filters.sale || filters.min != null || filters.max != null;

  const FilterPanel = (
    <div className="flex flex-col gap-5">
      {/* Category */}
      <div>
        <Label className="mb-2.5 text-[13px] font-black text-foreground">{t.filterCategory}</Label>
        <div className="max-h-64 space-y-0.5 overflow-y-auto pe-1">
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] font-bold transition-colors hover:bg-accent ${!filters.category ? "bg-accent text-primary" : "text-foreground/80"}`}
            onClick={() => setFilters({ category: "" })}
          >
            <PackageSearch className="h-4 w-4" aria-hidden />
            {t.shopTitle}
          </button>
          {catalog.categories.map((c) => {
            return (
              <button
                key={c.slug}
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] font-bold transition-colors hover:bg-accent ${filters.category === c.slug ? "bg-accent text-primary" : "text-foreground/80"}`}
                onClick={() => setFilters({ category: c.slug })}
              >
                <CategoryIcon name={c.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="line-clamp-1">{lang === "ar" ? c.nameAr : c.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <Label className="mb-2.5 text-[13px] font-black text-foreground">{t.filterBrand}</Label>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pe-1">
          {catalog.brands.map((b) => (
            <div key={b.slug} className="flex items-center gap-2.5 px-1">
              <Checkbox
                id={`br-${b.slug}`}
                checked={filters.brands.includes(b.slug)}
                onCheckedChange={() => setFilters({ brands: toggleIn(filters.brands, b.slug) })}
              />
              <label htmlFor={`br-${b.slug}`} className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-foreground/80">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} aria-hidden />
                {b.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Skin type */}
      <div>
        <Label className="mb-2.5 text-[13px] font-black text-foreground">{t.filterSkin}</Label>
        <div className="flex flex-wrap gap-1.5">
          {["دهنية", "جافة", "مختلطة", "حساسة", "عادية"].map((st) => {
            const active = filters.skinTypes.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilters({ skinTypes: toggleIn(filters.skinTypes, st) })}
                className={`rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground/70 hover:border-primary/40"}`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Price */}
      <div>
        <Label className="mb-2.5 text-[13px] font-black text-foreground">{t.filterPrice}</Label>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric" placeholder={t.from} value={minInput}
            onChange={(e) => setMinInput(e.target.value.replace(/[^\d]/g, ""))}
            className="h-9 rounded-lg text-[13px] font-bold" dir="ltr" aria-label={t.from}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            inputMode="numeric" placeholder={t.to} value={maxInput}
            onChange={(e) => setMaxInput(e.target.value.replace(/[^\d]/g, ""))}
            className="h-9 rounded-lg text-[13px] font-bold" dir="ltr" aria-label={t.to}
          />
        </div>
        <Button size="sm" className="mt-2.5 h-9 w-full rounded-lg text-xs font-black" onClick={applyPrice}>
          {t.applyFilters}
        </Button>
      </div>

      <Separator />

      {/* Sale only */}
      <div className="flex items-center justify-between">
        <Label className="cursor-pointer text-[13px] font-black text-foreground" htmlFor="sale-only">{t.onSaleOnly}</Label>
        <Switch id="sale-only" checked={filters.sale} onCheckedChange={(v) => setFilters({ sale: v })} />
      </div>

      {hasFilters && (
        <Button variant="outline" className="h-9 gap-2 rounded-lg text-xs font-black text-rose-600 hover:bg-rose-50" onClick={resetFilters}>
          <X className="h-3.5 w-3.5" aria-hidden />
          {t.clearFilters}
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Head */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-foreground sm:text-2xl">
            {activeCategory ? (lang === "ar" ? activeCategory.nameAr : activeCategory.nameEn) : t.shopTitle}
          </h1>
          <p className="mt-0.5 text-[13px] font-bold text-muted-foreground" aria-live="polite">
            {loading ? "..." : `${total} ${t.resultsCount}`}
            {filters.q ? ` — «${filters.q}»` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* mobile filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 rounded-xl text-xs font-black lg:hidden">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                {t.filters}
                {hasFilters && <span className="h-2 w-2 rounded-full bg-rose-600" aria-hidden />}
              </Button>
            </SheetTrigger>
            <SheetContent side={lang === "ar" ? "right" : "left"} className="w-80 overflow-y-auto">
              <SheetHeader className="p-4 text-start">
                <SheetTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4 text-primary" aria-hidden />{t.filters}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">{FilterPanel}</div>
            </SheetContent>
          </Sheet>
          {/* sort */}
          <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v as typeof filters.sort })}>
            <SelectTrigger className="h-10 w-[190px] rounded-xl text-xs font-black" aria-label={t.sortBy}>
              <SelectValue placeholder={t.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-[13px] font-bold">{t.sortNewest}</SelectItem>
              <SelectItem value="price-asc" className="text-[13px] font-bold">{t.sortPriceAsc}</SelectItem>
              <SelectItem value="price-desc" className="text-[13px] font-bold">{t.sortPriceDesc}</SelectItem>
              <SelectItem value="rating" className="text-[13px] font-bold">{t.sortRating}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block" aria-label={t.filters}>
          <div className="sticky top-32 rounded-2xl border bg-card p-5">{FilterPanel}</div>
        </aside>

        {/* grid */}
        <div className="min-w-0 flex-1">
          {!loading && products?.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
              <PackageSearch className="h-12 w-12 text-muted-foreground/40" aria-hidden />
              <p className="text-base font-black text-foreground">{t.noResults}</p>
              <p className="text-sm font-semibold text-muted-foreground">{t.noResultsSub}</p>
              {hasFilters && (
                <Button variant="outline" size="sm" className="mt-1 rounded-xl text-xs font-black" onClick={resetFilters}>
                  {t.clearFilters}
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {(loading || products === null)
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
