'use client'

import { ShoppingCart, Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatEGP, discountPercent } from '@/lib/format'
import type { ProductDTO } from '@/lib/types'
import { SKIN_TYPE_AR, productMainImage } from '@/lib/types'
import { ProductImage } from './product-image'

type Props = {
  product: ProductDTO
  onQuickView: (p: ProductDTO) => void
  onAddToCart: (p: ProductDTO, qty?: number) => void
}

export function ProductCard({ product: p, onQuickView, onAddToCart }: Props) {
  const off = discountPercent(p.price, p.oldPrice)
  const outOfStock = p.stock <= 0
  const mainImage = productMainImage(p.images)
  const imagesCount = (p.images || []).filter(Boolean).length

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        outOfStock && 'opacity-60'
      )}
    >
      {/* Badges */}
      <div className="absolute start-2 top-2 z-10 flex flex-col items-start gap-1">
        {off !== null && (
          <Badge className="bg-destructive px-2 text-[11px] font-bold text-white">
            خصم {off}%
          </Badge>
        )}
        {p.bundleOffer && (
          <Badge className="bg-amber-500 px-2 text-[10px] font-bold text-white">
            🎁 اشترِ 2 والثاني -40%
          </Badge>
        )}
      </div>

      {/* Quick view */}
      <button
        type="button"
        onClick={() => onQuickView(p)}
        aria-label={`عرض تفاصيل ${p.name}`}
        className="absolute end-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-card/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Visual — صورة حقيقية أو fallback إيموجي */}
      <button
        type="button"
        onClick={() => onQuickView(p)}
        className="group/img relative block w-full"
        aria-label={`عرض ${p.name}`}
      >
        <ProductImage
          src={mainImage}
          alt={p.name}
          emoji={p.emoji}
          className="h-36 w-full sm:h-40"
          zoomOnHover
          emojiClassName="text-6xl transition-transform duration-300 group-hover:scale-110"
        />
        {imagesCount > 1 && (
          <span className="absolute bottom-2 end-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            📷 {imagesCount}
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm font-extrabold text-destructive">
            نفدت الكمية
          </span>
        )}
        {p.brandName && (
          <span
            className="absolute bottom-2 start-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
            style={{
              color: p.brandColor || '#0E7490',
              backgroundColor: `${p.brandColor || '#0E7490'}22`,
            }}
            dir="ltr"
          >
            {p.brandName}
          </span>
        )}
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug">{p.name}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {p.categoryName && <span>{p.categoryName}</span>}
          {p.size && <span>• {p.size}</span>}
          {p.skinType && <span>• {SKIN_TYPE_AR[p.skinType] || p.skinType}</span>}
        </div>

        <div className="mt-auto">
          <div className="flex items-end gap-2">
            <span className="text-base font-black text-primary">{formatEGP(p.price)}</span>
            {p.oldPrice && p.oldPrice > p.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatEGP(p.oldPrice)}
              </span>
            )}
          </div>

          <Button
            type="button"
            onClick={() => onAddToCart(p, 1)}
            disabled={outOfStock}
            className="mt-2 h-10 w-full gap-1.5 rounded-lg text-xs font-extrabold"
            aria-label={`أضف ${p.name} للسلة`}
          >
            <Plus className="h-4 w-4" />
            أضف للسلة
          </Button>
        </div>
      </div>
    </article>
  )
}
