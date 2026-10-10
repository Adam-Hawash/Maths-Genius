'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ShoppingCart, SlidersHorizontal, Loader2, PackageOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePharmacyData } from '@/hooks/use-pharmacy-data'
import { useCart } from '@/lib/cart-store'
import { GROUP_LABELS } from '@/lib/types'
import type { ProductDTO } from '@/lib/types'
import type { PromoInfo } from '@/lib/pricing'
import { Header } from './header'
import { CategoryNav } from './category-nav'
import { Hero, type HeroTarget } from './hero'
import { BrandStrip } from './brand-strip'
import { ProductCard } from './product-card'
import { QuickViewModal } from './quick-view'
import { FiltersSheet, DEFAULT_FILTERS, type ProductFilters } from './filters-sheet'
import { CartDrawer } from './cart-drawer'
import { CheckoutDialog, OrderSuccessContent } from './checkout-dialog'
import { TrackOrderDialog } from './track-order'
import { TrustBadges } from './trust-badges'
import { Footer } from './footer'
import { Dialog, DialogContent } from '@/components/ui/dialog'

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'discount'

export function Storefront({ onOpenAdmin }: { onOpenAdmin: () => void }) {
  const { products, categories, brands, settings, loading, error, reload } = usePharmacyData()
  const { addItem, clear } = useCart()

  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [quickView, setQuickView] = useState<ProductDTO | null>(null)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [promo, setPromo] = useState<PromoInfo | null>(null)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [trackOpen, setTrackOpen] = useState(false)
  const [trackQuery, setTrackQuery] = useState('')

  const cartCount = useCart((s) => s.items.reduce((acc, i) => acc + i.qty, 0))

  const hasFilters =
    activeGroup !== null ||
    filters.categorySlug !== null ||
    filters.brandId !== null ||
    filters.skinType !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.offersOnly

  const filtered = useMemo(() => {
    let list = products
    if (activeGroup) list = list.filter((p) => p.categoryGroup === activeGroup)
    if (filters.categorySlug) list = list.filter((p) => p.categorySlug === filters.categorySlug)
    if (filters.brandId) list = list.filter((p) => p.brandId === filters.brandId)
    if (filters.skinType) list = list.filter((p) => p.skinType === filters.skinType)
    if (filters.minPrice != null) list = list.filter((p) => p.price >= filters.minPrice!)
    if (filters.maxPrice != null) list = list.filter((p) => p.price <= filters.maxPrice!)
    if (filters.offersOnly) list = list.filter((p) => p.oldPrice && p.oldPrice > p.price)

    const sorted = [...list]
    switch (filters.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'discount':
        sorted.sort((a, b) => {
          const da = a.oldPrice && a.oldPrice > a.price ? (a.oldPrice - a.price) / a.oldPrice : -1
          const db = b.oldPrice && b.oldPrice > b.price ? (b.oldPrice - b.price) / b.oldPrice : -1
          return db - da
        })
        break
      default:
        break
    }
    return sorted
  }, [products, activeGroup, filters])

  const groupedSections = useMemo(() => {
    const groups: { group: string; label: string; products: ProductDTO[] }[] = []
    const seen = new Set<string>()
    for (const p of products) {
      const g = p.categoryGroup || 'health'
      if (!seen.has(g)) {
        seen.add(g)
        groups.push({
          group: g,
          label: GROUP_LABELS[g] || g,
          products: products.filter((x) => (x.categoryGroup || 'health') === g),
        })
      }
    }
    return groups
  }, [products])

  function handleAddToCart(p: ProductDTO, qty = 1) {
    const result = addItem(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        emoji: p.emoji,
        image: (p.images || []).find((v) => typeof v === 'string' && v.trim()) || null,
        price: p.price,
        bundleOffer: p.bundleOffer,
        stock: p.stock,
      },
      qty
    )
    if (!result.ok) {
      toast.error(result.message || 'تعذر إضافة المنتج')
      return
    }
    toast.success(`تمت إضافة «${p.name}» للسلة`, {
      action: {
        label: 'فتح السلة',
        onClick: () => setCartOpen(true),
      },
    })
  }

  function handleQuickView(p: ProductDTO) {
    setQuickView(p)
    setQuickViewOpen(true)
  }

  function scrollToCatalog() {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /** ربط الهيرو بالفئات — تفتح الفئة المطلوبة وتعمل سكرول للكتالوج */
  function handleHeroTarget(t: HeroTarget) {
    if (t.kind === 'group') {
      setActiveGroup(t.slug)
      setFilters(DEFAULT_FILTERS)
    } else if (t.kind === 'category') {
      setActiveGroup(null)
      setFilters({ ...DEFAULT_FILTERS, categorySlug: t.slug })
    }
    // مهلة صغيرة عشان الفلتر تتطبق قبل السكرول
    setTimeout(scrollToCatalog, 60)
  }

  const activeFilterCount = [
    filters.categorySlug,
    filters.brandId,
    filters.skinType,
    filters.minPrice,
    filters.maxPrice,
    filters.offersOnly ? true : null,
  ].filter((v) => v !== null && v !== false && v !== '').length

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onSelectProduct={handleQuickView}
      />
      <CategoryNav
        categories={categories}
        activeGroup={activeGroup}
        onSelectGroup={(g) => {
          setActiveGroup(g)
          setFilters(DEFAULT_FILTERS)
          scrollToCatalog()
        }}
      />

      <main className="flex-1">
        <Hero
          heroTitle={settings.hero_title || ''}
          heroSubtitle={settings.hero_subtitle || ''}
          onShopNow={scrollToCatalog}
          onSelectTarget={handleHeroTarget}
          onShowOffers={() => {
            setActiveGroup(null)
            setFilters({ ...DEFAULT_FILTERS, offersOnly: true })
            scrollToCatalog()
          }}
        />
        <BrandStrip
          brands={brands.filter((b) => b.featured)}
          activeBrandId={filters.brandId}
          onSelectBrand={(id) => {
            setFilters((f) => ({ ...f, brandId: id }))
            scrollToCatalog()
          }}
        />

        {/* Catalog */}
        <section id="catalog" className="mx-auto max-w-7xl px-4 py-8" aria-label="المنتجات">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
              <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-bold">{error}</p>
              <Button type="button" variant="outline" onClick={reload} className="gap-2">
                <Loader2 className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
          ) : hasFilters ? (
            <>
              {/* Toolbar */}
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <h2 className="text-lg font-black">
                    {activeGroup
                      ? GROUP_LABELS[activeGroup] || activeGroup
                      : filters.offersOnly
                        ? '🔥 العروض والخصومات'
                        : 'نتائج الفلترة'}
                  </h2>
                  <p className="text-xs text-muted-foreground">{filtered.length} منتج متاح</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={filters.sort}
                    onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as SortKey }))}
                  >
                    <SelectTrigger className="h-10 w-44" aria-label="ترتيب المنتجات">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="price-asc">السعر: تصاعدي</SelectItem>
                      <SelectItem value="price-desc">السعر: تنازلي</SelectItem>
                      <SelectItem value="discount">أعلى خصم</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2"
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    فلترة
                    {activeFilterCount > 0 && (
                      <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 text-xs"
                    onClick={() => {
                      setActiveGroup(null)
                      setFilters(DEFAULT_FILTERS)
                    }}
                  >
                    مسح الكل
                  </Button>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
                  <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-bold">مفيش منتجات مطابقة للفلترة دي</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveGroup(null)
                      setFilters(DEFAULT_FILTERS)
                    }}
                  >
                    إعادة ضبط الفلاتر
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onQuickView={handleQuickView}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {groupedSections.map((section) => (
                <div key={section.group} className="mb-10 last:mb-0">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
                    <h2 className="flex min-w-0 items-center gap-2 text-lg font-black">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-lg">
                        {groupEmoji(section.group)}
                      </span>
                      <span className="min-w-0">{section.label}</span>
                      <Badge variant="secondary">{section.products.length}</Badge>
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-primary"
                      onClick={() => {
                        setActiveGroup(section.group)
                        setFilters(DEFAULT_FILTERS)
                      }}
                    >
                      عرض القسم كامل ←
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {section.products.slice(0, 10).map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        onQuickView={handleQuickView}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Track order CTA */}
              <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/50 p-8 text-center">
                <span className="text-4xl">📦</span>
                <h3 className="text-lg font-black">طلبت قبل كده؟</h3>
                <p className="text-sm text-muted-foreground">
                  تتبع حالة طلبك برقم الطلب أو رقم الموبايل في ثوانٍ
                </p>
                <Button
                  type="button"
                  className="h-11 gap-2 rounded-full px-6 font-extrabold"
                  onClick={() => {
                    setTrackQuery('')
                    setTrackOpen(true)
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  تتبع طلبك
                </Button>
              </div>
            </>
          )}
        </section>

        <TrustBadges
          supportPhone={settings.support_phone || ''}
          supportHours={settings.support_hours || ''}
        />
      </main>

      <Footer
        onOpenAdmin={onOpenAdmin}
        supportPhone={settings.support_phone || ''}
      />

      {/* Overlays */}
      <QuickViewModal
        key={`${quickView?.id || 'none'}-${quickViewOpen}`}
        product={quickView}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onAddToCart={handleAddToCart}
      />
      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        brands={brands}
        activeCount={activeFilterCount}
      />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        settings={settings}
        promo={promo}
        onPromoChange={setPromo}
        onCheckout={() => {
          if (cartCount === 0) {
            toast.error('السلة فارغة — أضف منتجات أولًا')
            return
          }
          setCheckoutOpen(true)
        }}
      />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        settings={settings}
        promo={promo}
        onSuccess={(orderNumber) => {
          clear()
          setPromo(null)
          setSuccessOrder(orderNumber)
        }}
      />
      <TrackOrderDialog
        open={trackOpen}
        onOpenChange={setTrackOpen}
        initialQuery={trackQuery}
      />

      {/* Success dialog */}
      <Dialog open={successOrder !== null} onOpenChange={(o) => !o && setSuccessOrder(null)}>
        <DialogContent className="sm:max-w-md">
          {successOrder && (
            <OrderSuccessContent
              orderNumber={successOrder}
              onTrack={() => {
                setTrackQuery(successOrder)
                setTrackOpen(true)
                setSuccessOrder(null)
              }}
              onClose={() => setSuccessOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      {[0, 1].map((s) => (
        <div key={s}>
          <Skeleton className="mb-4 h-9 w-56" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <Skeleton className="h-28 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupEmoji(group: string): string {
  switch (group) {
    case 'health':
      return '🩺'
    case 'beauty':
      return '✨'
    case 'mother-baby':
      return '🍼'
    case 'devices':
      return '🩻'
    case 'personal-care':
      return '🧼'
    case 'nutrition':
      return '🥗'
    default:
      return '🏷️'
  }
}
