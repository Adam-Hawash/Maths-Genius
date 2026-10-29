'use client'

import { useState } from 'react'
import { usePharmacy, fmtEGP, hasTag } from './store'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ShoppingBag, Minus, Plus, Truck, ShieldCheck, Package } from 'lucide-react'
import { toast } from 'sonner'

export default function QuickView() {
  const { quickView: p, openQuickView, addToCart, setCartOpen } = usePharmacy()
  const [qty, setQty] = useState(1)

  if (!p) return null
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const skinTypes = p.skinType ? p.skinType.split(',').filter(Boolean) : []
  const brandColor = p.brand?.color || '#0e7490'

  const close = () => { openQuickView(null); setQty(1) }

  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) close() }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{p.name}</DialogTitle>
        <div className="grid sm:grid-cols-2">
          {/* Tile */}
          <div className="relative h-56 sm:h-full grid place-items-center"
            style={{ background: `linear-gradient(135deg, ${brandColor}14, ${brandColor}30)` }}>
            <span className="text-7xl sm:text-8xl">{p.emoji}</span>
            {discount > 0 && (
              <Badge className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-500 text-white text-sm px-3">
                خصم {discount}%
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 space-y-3">
            {p.brand && (
              <Badge variant="outline" className="border-cyan-200 font-bold" style={{ color: brandColor }}>
                {p.brand.name}
              </Badge>
            )}
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">{p.name}</h2>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-cyan-800">{fmtEGP(p.price)}</span>
              {p.oldPrice && p.oldPrice > p.price && (
                <span className="text-sm text-gray-400 line-through">{fmtEGP(p.oldPrice)}</span>
              )}
            </div>

            {hasTag(p, 'offer40') && (
              <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-bold rounded-lg px-3 py-2">
                🎁 عرض خاص: اشترِ قطعة واحصل على خصم 40% على القطعة التانية!
              </div>
            )}

            <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {skinTypes.map(s => (
                <Badge key={s} variant="secondary" className="bg-teal-50 text-teal-700 text-[11px]">
                  بشرة {s}
                </Badge>
              ))}
              {p.size && <Badge variant="secondary" className="text-[11px]">{p.size}</Badge>}
              <Badge variant="secondary" className={`text-[11px] ${p.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                {p.stock > 0 ? `متاح (${p.stock} قطعة)` : 'غير متاح حاليًا'}
              </Badge>
            </div>

            <Separator />

            {/* Qty + Add */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button className="p-2 hover:bg-gray-50" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="نقص">
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button className="p-2 hover:bg-gray-50" onClick={() => setQty(q => Math.min(50, q + 1))} aria-label="زود">
                  <Plus className="size-4" />
                </button>
              </div>
              <Button
                className="flex-1 bg-cyan-700 hover:bg-cyan-800 gap-2 h-11"
                onClick={() => { addToCart(p, qty); toast.success('اتضاف للسلة 🛒'); close(); setCartOpen(true) }}
              >
                <ShoppingBag className="size-4" />
                أضف للسلة — {fmtEGP(p.price * qty)}
              </Button>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="space-y-1">
                <Truck className="size-4 mx-auto text-cyan-600" />
                <p className="text-[10px] text-gray-500 font-medium">توصيل نفس اليوم<br />القاهرة والجيزة</p>
              </div>
              <div className="space-y-1">
                <ShieldCheck className="size-4 mx-auto text-cyan-600" />
                <p className="text-[10px] text-gray-500 font-medium">منتج أصلي<br />مضمون 100%</p>
              </div>
              <div className="space-y-1">
                <Package className="size-4 mx-auto text-cyan-600" />
                <p className="text-[10px] text-gray-500 font-medium">تغليف آمن<br />وصلة بحالة ممتازة</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
