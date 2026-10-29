'use client'

import { useMemo } from 'react'
import { usePharmacy, fmtEGP, hasTag } from './store'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, Trash2, ShoppingBag, Truck, ArrowLeft } from 'lucide-react'
import { calcOfferDiscount, FREE_SHIP_THRESHOLD } from '@/lib/pharmacy/pricing'

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cart, setQty, removeFromCart, setView } = usePharmacy()

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart])
  const offerDiscount = useMemo(() => calcOfferDiscount(cart), [cart])
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100)

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-gray-100">
          <SheetTitle className="flex items-center gap-2 text-cyan-900">
            <ShoppingBag className="size-5" /> سلة التسوق ({cart.length})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 grid place-items-center p-6 text-center">
            <div className="space-y-3">
              <div className="text-6xl">🛒</div>
              <p className="font-bold text-gray-700">سلتك فاضية</p>
              <p className="text-sm text-gray-400">ابدأ التسوق واختار منتجاتك المفضلة</p>
              <Button className="bg-cyan-700 hover:bg-cyan-800" onClick={() => setView({ name: 'home' })}>
                ابدأ التسوق
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            <div className="px-4 py-3 bg-cyan-50 border-b border-cyan-100">
              {remaining > 0 ? (
                <p className="text-xs text-cyan-900 font-semibold mb-2">
                  🚚 ناقصك {fmtEGP(remaining)} بس وتحصل على توصيل مجاني!
                </p>
              ) : (
                <p className="text-xs text-emerald-700 font-bold mb-2">🎉 مبروك! التوصيل عليك مجانًا</p>
              )}
              <Progress value={progress} className="h-2 bg-cyan-100 [&>div]:bg-cyan-600" />
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.productId} className="flex gap-3 bg-white border border-gray-100 rounded-xl p-3">
                  <span
                    className="size-14 rounded-lg grid place-items-center text-2xl shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0e749014, #0e749030)' }}
                  >
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</div>
                    <div className="text-cyan-800 font-extrabold text-sm mt-0.5">{fmtEGP(item.price)}</div>
                    {item.qty >= 2 && hasTag(item, 'offer40') && (
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        🎁 خصم 40% على القطعة التانية مطبق
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button className="p-1.5 hover:bg-gray-50" onClick={() => setQty(item.productId, item.qty - 1)} aria-label="نقص الكمية">
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                        <button className="p-1.5 hover:bg-gray-50" onClick={() => setQty(item.productId, item.qty + 1)} aria-label="زود الكمية">
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label="حذف من السلة"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="border-t border-gray-100 p-4 space-y-2 bg-white">
              <div className="flex justify-between text-sm text-gray-600">
                <span>الإجمالي الفرعي</span><span className="font-bold">{fmtEGP(subtotal)}</span>
              </div>
              {offerDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>🎁 خصم العرض التلقائي</span><span>- {fmtEGP(offerDiscount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-extrabold text-cyan-900">
                <span>الإجمالي (قبل الشحن)</span>
                <span>{fmtEGP(subtotal - offerDiscount)}</span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Truck className="size-3" /> رسوم الشحن بتتحسب في الخطوة الجاية حسب المحافظة
              </p>
              <Button
                className="w-full h-11 bg-cyan-700 hover:bg-cyan-800 font-bold gap-2"
                onClick={() => setView({ name: 'checkout' })}
              >
                إتمام الشراء <ArrowLeft className="size-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
