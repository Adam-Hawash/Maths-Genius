'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Tag,
  Truck,
  Loader2,
  Gift,
  ArrowLeft,
} from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart-store'
import { formatEGP } from '@/lib/format'
import { ProductImage } from './product-image'
import {
  BUNDLE_DISCOUNT_RATE,
  shippingFeeFor,
  round2,
  type PromoInfo,
} from '@/lib/pricing'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Record<string, string>
  promo: PromoInfo | null
  onPromoChange: (promo: PromoInfo | null) => void
  onCheckout: () => void
}

export function CartDrawer({ open, onOpenChange, settings, promo, onPromoChange, onCheckout }: Props) {
  const { items, setQty, removeItem } = useCart()
  const [promoInput, setPromoInput] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)

  const pricing = useMemo(() => {
    const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0))
    const offerDiscount = round2(
      items
        .filter((i) => i.bundleOffer && i.qty >= 2)
        .reduce((s, i) => s + Math.floor(i.qty / 2) * i.price * BUNDLE_DISCOUNT_RATE, 0)
    )
    const afterOffers = Math.max(0, round2(subtotal - offerDiscount))
    let promoDiscount = 0
    if (promo && promo.active && afterOffers >= promo.minTotal) {
      promoDiscount =
        promo.type === 'fixed'
          ? Math.min(promo.value, afterOffers)
          : round2((afterOffers * promo.value) / 100)
    }
    const payable = Math.max(0, round2(afterOffers - promoDiscount))
    const shipping = shippingFeeFor('same-day', settings, payable)
    return {
      subtotal,
      offerDiscount,
      promoDiscount,
      afterOffers,
      payable,
      shippingFee: shipping.fee,
      freeShipping: shipping.free,
      total: round2(payable + shipping.fee),
    }
  }, [items, promo, settings])

  const threshold = Number(settings.free_shipping_threshold || 600)
  const remainingForFree = Math.max(0, round2(threshold - pricing.payable))
  const progress = threshold > 0 ? Math.min(100, (pricing.payable / threshold) * 100) : 100

  async function applyPromo() {
    const code = promoInput.trim()
    if (!code) return
    setPromoBusy(true)
    try {
      const res = await fetch('/api/pharmacy/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: pricing.afterOffers }),
      })
      const data = (await res.json()) as {
        valid: boolean
        message: string
        code?: string
        type?: string
        value?: number
        minTotal?: number
      }
      if (!data.valid) {
        toast.error(data.message || 'كود الخصم غير صحيح')
        return
      }
      onPromoChange({
        code: data.code!,
        type: data.type!,
        value: data.value!,
        minTotal: data.minTotal ?? 0,
        active: true,
      })
      toast.success(data.message || 'تم تطبيق كود الخصم')
      setPromoInput('')
    } catch {
      toast.error('تعذر التحقق من الكود، حاول مرة أخرى')
    } finally {
      setPromoBusy(false)
    }
  }

  function handleCheckout() {
    onOpenChange(false)
    onCheckout()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-5 w-5 text-primary" />
            سلة التسوق
            <Badge variant="secondary">{items.reduce((s, i) => s + i.qty, 0)} منتج</Badge>
          </SheetTitle>
          <SheetDescription className="sr-only">راجع منتجاتك وأكمل الشراء</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* Free shipping banner */}
            <div className="border-b bg-secondary/60 px-4 py-3">
              {remainingForFree > 0 ? (
                <p className="text-xs font-bold text-foreground">
                  🚚 باقي {formatEGP(remainingForFree)} واحصل على <span className="text-primary">شحن مجاني</span>!
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-700">🎉 مبروك! حصلت على شحن مجاني</p>
              )}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="ph-scroll flex-1 space-y-3 overflow-y-auto p-4">
              {items.map((item) => (
                <CartLineRow
                  key={item.productId}
                  item={item}
                  onSetQty={(q) => setQty(item.productId, q)}
                  onRemove={() => removeItem(item.productId)}
                />
              ))}
            </div>

            {/* Promo + totals */}
            <div className="space-y-3 border-t p-4">
              {promo ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                    <Tag className="h-4 w-4" />
                    {promo.code} —{' '}
                    {promo.type === 'fixed' ? `${promo.value} ج.م` : `${promo.value}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPromoChange(null)}
                    aria-label="إزالة كود الخصم"
                    className="text-emerald-700 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="كود الخصم (مثل WELCOME10)"
                    className="h-11"
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 px-4 font-bold"
                    onClick={applyPromo}
                    disabled={promoBusy}
                  >
                    {promoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                  </Button>
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                <Row label="المجموع الفرعي" value={formatEGP(pricing.subtotal)} />
                {pricing.offerDiscount > 0 && (
                  <Row
                    label="خصم العروض (اشترِ 2)"
                    value={`− ${formatEGP(pricing.offerDiscount)}`}
                    green
                  />
                )}
                {pricing.promoDiscount > 0 && (
                  <Row
                    label={`خصم الكود ${promo?.code}`}
                    value={`− ${formatEGP(pricing.promoDiscount)}`}
                    green
                  />
                )}
                <Row
                  label="الشحن (نفس اليوم)"
                  value={pricing.freeShipping ? 'مجاني 🎉' : formatEGP(pricing.shippingFee)}
                />
                <Separator />
                <div className="flex items-center justify-between text-base font-black">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatEGP(pricing.total)}</span>
                </div>
                {pricing.offerDiscount > 0 && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600">
                    <Gift className="h-3 w-3" />
                    وفّرت {formatEGP(pricing.offerDiscount + pricing.promoDiscount)} من العروض
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleCheckout}
                className="h-12 w-full gap-2 rounded-xl text-base font-extrabold"
              >
                إتمام الشراء
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                الدفع كاش عند الاستلام أو فودافون كاش
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function CartLineRow({
  item,
  onSetQty,
  onRemove,
}: {
  item: CartItem
  onSetQty: (qty: number) => void
  onRemove: () => void
}) {
  const bundleActive = item.bundleOffer && item.qty >= 2
  return (
    <div className="flex gap-3 rounded-xl border p-3">
      <ProductImage
        src={item.image || undefined}
        alt={item.name}
        emoji={item.emoji}
        className="h-14 w-14 shrink-0 rounded-lg"
        emojiClassName="text-2xl"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold">{item.name}</p>
        <p className="text-xs text-muted-foreground">{formatEGP(item.price)}</p>
        {bundleActive && (
          <Badge className="mt-1 bg-amber-500 text-[10px] text-white">
            🎁 الثانية بخصم 40%
          </Badge>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex h-9 items-center rounded-lg border">
            <button
              type="button"
              onClick={() => onSetQty(item.qty - 1)}
              className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="إنقاص الكمية"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-bold">{item.qty}</span>
            <button
              type="button"
              onClick={() => onSetQty(item.qty + 1)}
              className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="زيادة الكمية"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black">{formatEGP(item.price * item.qty)}</span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`إزالة ${item.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={green ? 'font-bold text-emerald-600' : 'font-bold'}>{value}</span>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="text-6xl">🛒</span>
      <p className="text-lg font-bold">سلتك فارغة</p>
      <p className="text-sm text-muted-foreground">
        ابدأ التسوق واختر من بين آلاف المنتجات الأصلية
      </p>
    </div>
  )
}
