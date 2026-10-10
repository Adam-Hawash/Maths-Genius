'use client'

import { usePharmacy, fmtEGP, hasTag, type Product } from './store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Eye } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, openQuickView } = usePharmacy()
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : 0
  const brandColor = p.brand?.color || '#0e7490'

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Tile */}
      <button
        className="relative h-36 sm:h-44 grid place-items-center cursor-pointer overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${brandColor}14, ${brandColor}30)` }}
        onClick={() => openQuickView(p)}
        aria-label={`عرض سريع: ${p.name}`}
      >
        <span className="text-5xl sm:text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
          {p.emoji}
        </span>
        <span className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {discount > 0 && <Badge className="bg-rose-500 hover:bg-rose-500 text-white">خصم {discount}%</Badge>}
          {hasTag(p, 'bundle') && <Badge className="bg-amber-500 hover:bg-amber-500 text-white">باكند عرض</Badge>}
          {hasTag(p, 'new') && <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">جديد</Badge>}
        </span>
        {hasTag(p, 'offer40') && (
          <span className="absolute bottom-2 inset-x-2 bg-cyan-800/90 text-white text-[10px] sm:text-[11px] font-bold rounded-full py-1 text-center">
            اشترِ 1 واحصل على 40% خصم على التانية
          </span>
        )}
      </button>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5">
        {p.brand && (
          <span className="text-[11px] font-bold" style={{ color: brandColor }}>{p.brand.name}</span>
        )}
        <button
          className="text-right text-[13px] sm:text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-cyan-700 transition"
          onClick={() => openQuickView(p)}
        >
          {p.name}
        </button>
        {p.size && <span className="text-[11px] text-gray-400">{p.size}</span>}

        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div>
            <div className="font-extrabold text-cyan-800 text-sm sm:text-base">{fmtEGP(p.price)}</div>
            {p.oldPrice && p.oldPrice > p.price && (
              <div className="text-[11px] text-gray-400 line-through">{fmtEGP(p.oldPrice)}</div>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className="size-8 sm:size-9 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
              onClick={() => openQuickView(p)}
              aria-label="عرض سريع"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              size="sm"
              className="h-8 sm:h-9 bg-cyan-700 hover:bg-cyan-800 gap-1.5 text-xs"
              onClick={() => { addToCart(p); toast.success('اتضاف للسلة 🛒', { description: p.name }) }}
            >
              <ShoppingBag className="size-3.5" />
              أضف
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
