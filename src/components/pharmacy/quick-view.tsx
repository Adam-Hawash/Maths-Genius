'use client'

import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, ShoppingCart, PackageCheck, Gift, ChevronRight, ChevronLeft, ZoomIn } from 'lucide-react'
import { formatEGP, discountPercent } from '@/lib/format'
import type { ProductDTO } from '@/lib/types'
import { SKIN_TYPE_AR } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductImage } from './product-image'

type Props = {
  product: ProductDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (p: ProductDTO, qty: number) => void
}

export function QuickViewModal({ product: p, open, onOpenChange, onAddToCart }: Props) {
  const [qty, setQty] = useState(1)
  const [slide, setSlide] = useState(0)

  const images = useMemo(
    () => (p?.images || []).filter((v) => typeof v === 'string' && v.trim()),
    [p]
  )
  const hasGallery = images.length > 0

  // ملاحظة: المكون بيعمل remount لما المنتج يتغير (key في Storefront) — فالحالات بترجع لقيمها الابتدائية تلقائيًا

  if (!p) return null
  const off = discountPercent(p.price, p.oldPrice)
  const outOfStock = p.stock <= 0

  const next = () => hasGallery && setSlide((s) => (s + 1) % images.length)
  const prev = () => hasGallery && setSlide((s) => (s - 1 + images.length) % images.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ph-scroll max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-start">
          <DialogTitle className="text-lg font-black leading-snug">{p.name}</DialogTitle>
          <DialogDescription>
            {p.brandName ? `الماركة: ${p.brandName}` : p.categoryName || 'منتج صيدلي'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_1.2fr]">
          {/* الجاليري / الفيجوال */}
          <div className="flex flex-col gap-2">
            <div
              className="group relative overflow-hidden rounded-xl"
              role="region"
              aria-label={`صور ${p.name}`}
              onKeyDown={(e) => {
                if (!hasGallery) return
                if (e.key === 'ArrowLeft') prev()
                if (e.key === 'ArrowRight') next()
              }}
              tabIndex={hasGallery ? 0 : -1}
            >
              <ProductImage
                key={images[slide] || 'fallback'}
                src={images[slide]}
                alt={`${p.name} — صورة ${hasGallery ? slide + 1 : 1}`}
                emoji={p.emoji}
                className="h-52 w-full sm:h-60"
                emojiClassName="text-8xl"
                eager
              />

              {off !== null && (
                <Badge className="absolute start-3 top-3 z-10 bg-destructive text-white">
                  خصم {off}%
                </Badge>
              )}
              {p.bundleOffer && (
                <Badge className="absolute bottom-3 start-3 z-10 gap-1 bg-amber-500 text-white">
                  <Gift className="h-3 w-3" />
                  اشترِ 2 والثاني -40%
                </Badge>
              )}

              {hasGallery && images.length > 1 && (
                <>
                  {/* عداد الصور */}
                  <span className="absolute end-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur" dir="ltr">
                    {slide + 1} / {images.length}
                  </span>
                  {/* أسهم التنقل — في RTL السهم اليمين يرجع للخلف */}
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="الصورة السابقة"
                    className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md backdrop-blur transition hover:bg-white hover:scale-105 active:scale-95"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="الصورة التالية"
                    className="absolute start-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-md backdrop-blur transition hover:bg-white hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* الثامبنيلز */}
            {hasGallery && images.length > 1 && (
              <div className="ph-scroll-x flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="صور المنتج">
                {images.map((img, i) => (
                  <button
                    key={`${i}-${img.slice(-24)}`}
                    type="button"
                    role="tab"
                    aria-selected={i === slide}
                    aria-label={`الصورة ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={cn(
                      'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition',
                      i === slide
                        ? 'border-primary ring-2 ring-primary/25'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {!hasGallery && (
              <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ZoomIn className="h-3.5 w-3.5" />
                لا توجد صور لهذا المنتج بعد — تُضاف من لوحة التحكم
              </p>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {p.size && <Detail label="الحجم" value={p.size} />}
              {p.skinType && <Detail label="نوع البشرة" value={SKIN_TYPE_AR[p.skinType] || p.skinType} />}
              <Detail
                label="التوفر"
                value={
                  outOfStock ? 'غير متوفر' : p.stock < 10 ? `باقي ${p.stock} فقط` : 'متوفر ✓'
                }
                danger={outOfStock}
              />
              <Detail label="الفئة" value={p.categoryName || '—'} />
            </div>

            {p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px]">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-primary">{formatEGP(p.price)}</span>
              {p.oldPrice && p.oldPrice > p.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatEGP(p.oldPrice)}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 items-center rounded-lg border">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="إنقاص الكمية"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(Math.max(p.stock, 1), q + 1))}
                  className="flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAddToCart(p, qty)
                  onOpenChange(false)
                }}
                className="h-11 flex-1 gap-2 rounded-lg text-sm font-extrabold"
              >
                {outOfStock ? (
                  'غير متوفر'
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    أضف للسلة — {formatEGP(p.price * qty)}
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
              منتج أصلي 100% مع ضمان الاسترجاع خلال 14 يوم
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <span className="block text-muted-foreground">{label}</span>
      <span className={danger ? 'block font-bold text-destructive' : 'block font-bold'}>
        {value}
      </span>
    </div>
  )
}
