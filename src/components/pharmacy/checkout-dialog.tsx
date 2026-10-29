'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle2, MapPin, Truck, Wallet } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { formatEGP } from '@/lib/format'
import {
  BUNDLE_DISCOUNT_RATE,
  shippingFeeFor,
  round2,
  type PromoInfo,
} from '@/lib/pricing'
import { SHIPPING_METHODS, PAYMENT_METHODS } from '@/lib/types'

const CITIES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'بورسعيد',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
  'الوادي الجديد',
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Record<string, string>
  promo: PromoInfo | null
  onSuccess: (orderNumber: string) => void
}

type FormState = {
  customerName: string
  phone: string
  city: string
  area: string
  address: string
  notes: string
}

const EMPTY_FORM: FormState = {
  customerName: '',
  phone: '',
  city: '',
  area: '',
  address: '',
  notes: '',
}

export function CheckoutDialog({ open, onOpenChange, settings, promo, onSuccess }: Props) {
  const { items } = useCart()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [shippingMethod, setShippingMethod] = useState('same-day')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

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
    const shipping = shippingFeeFor(shippingMethod, settings, payable)
    return {
      subtotal,
      offerDiscount,
      promoDiscount,
      shippingFee: shipping.fee,
      freeShipping: shipping.free,
      total: round2(payable + shipping.fee),
    }
  }, [items, promo, settings, shippingMethod])

  const methodInfo = SHIPPING_METHODS.find((m) => m.id === shippingMethod)
  const paymentInfo = PAYMENT_METHODS.find((m) => m.id === paymentMethod)

  function validate(): string | null {
    if (form.customerName.trim().length < 3) return 'اكتب الاسم بالكامل (3 أحرف على الأقل)'
    const phone = form.phone.replace(/\s/g, '')
    if (!/^0?1\d{8,9}$/.test(phone)) return 'رقم الموبايل غير صحيح (مثال: 01012345678)'
    if (!form.city) return 'اختر المدينة'
    if (form.address.trim().length < 5) return 'اكتب العنوان بالتفصيل'
    return null
  }

  async function placeOrder() {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    setPlacing(true)
    try {
      const res = await fetch('/api/pharmacy/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          shippingMethod,
          paymentMethod,
          promoCode: promo?.code,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        order?: { orderNumber: string }
        error?: string
      }
      if (!res.ok || !data.ok || !data.order) {
        toast.error(data.error || 'تعذر إنشاء الطلب، حاول مرة أخرى')
        return
      }
      onSuccess(data.order.orderNumber)
      setForm(EMPTY_FORM)
      setShippingMethod('same-day')
      setPaymentMethod('cod')
      onOpenChange(false)
    } catch {
      toast.error('حدث خطأ في الشبكة، حاول مرة أخرى')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ph-scroll max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="text-start">
          <DialogTitle className="text-lg font-black">إتمام الطلب</DialogTitle>
          <DialogDescription>
            املأ بياناتك واختر طريقة الشحن والدفع المناسبة — الدفع عند الاستلام متاح
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
          {/* Form */}
          <div className="space-y-4">
            <section className="space-y-3 rounded-xl border p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">
                <MapPin className="h-4 w-4 text-primary" />
                بيانات التوصيل
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="الاسم بالكامل *">
                  <Input
                    value={form.customerName}
                    onChange={(e) => set({ customerName: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    className="h-11"
                    autoComplete="name"
                  />
                </Field>
                <Field label="رقم الموبايل *">
                  <Input
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                    inputMode="tel"
                    dir="ltr"
                    className="h-11 text-start"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="المدينة *">
                  <Select value={form.city} onValueChange={(v) => set({ city: v })}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="اختر المدينة…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="المنطقة / الحي">
                  <Input
                    value={form.area}
                    onChange={(e) => set({ area: e.target.value })}
                    placeholder="مثال: مدينة نصر"
                    className="h-11"
                  />
                </Field>
              </div>
              <Field label="العنوان بالتفصيل *">
                <Textarea
                  value={form.address}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="اسم الشارع، رقم العقار، الدور، علامة مميزة…"
                  rows={2}
                  className="resize-none"
                />
              </Field>
              <Field label="ملاحظات للطلب (اختياري)">
                <Input
                  value={form.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                  placeholder="أي تعليمات إضافية للتوصيل"
                  className="h-11"
                />
              </Field>
            </section>

            <section className="space-y-3 rounded-xl border p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">
                <Truck className="h-4 w-4 text-primary" />
                طريقة الشحن
              </h3>
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="gap-2">
                {SHIPPING_METHODS.map((m) => {
                  const fee = shippingFeeFor(m.id, settings, pricing.subtotal - pricing.offerDiscount - pricing.promoDiscount)
                  return (
                    <Label
                      key={m.id}
                      htmlFor={`ship-${m.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        shippingMethod === m.id ? 'border-primary bg-accent' : 'hover:bg-muted/50'
                      }`}
                    >
                      <RadioGroupItem id={`ship-${m.id}`} value={m.id} className="mt-0" />
                      <span className="flex-1">
                        <span className="block text-sm font-bold">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.note}</span>
                      </span>
                      <span className="text-sm font-black text-primary">
                        {fee.free ? 'مجاني' : formatEGP(fee.fee)}
                      </span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </section>

            <section className="space-y-3 rounded-xl border p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold">
                <Wallet className="h-4 w-4 text-primary" />
                طريقة الدفع
              </h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <Label
                    key={m.id}
                    htmlFor={`pay-${m.id}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      paymentMethod === m.id ? 'border-primary bg-accent' : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem id={`pay-${m.id}`} value={m.id} className="mt-0" />
                    <span className="text-sm font-bold">
                      {m.emoji} {m.label}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              {paymentMethod === 'vodafone' && (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  بعد تأكيد الطلب سيصلك رقم محفظة فودافون كاش لإرسال المبلغ وتأكيد الدفع.
                </p>
              )}
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-3 rounded-xl border bg-muted/40 p-4 md:sticky md:top-4">
            <h3 className="text-sm font-extrabold">ملخص الطلب ({items.length} منتج)</h3>
            <div className="ph-scroll max-h-52 space-y-2 overflow-y-auto">
              {items.map((i) => (
                <div key={i.productId} className="flex items-center gap-2 text-xs">
                  <span className="text-lg">{i.emoji}</span>
                  <span className="line-clamp-1 flex-1 font-semibold">{i.name}</span>
                  <span className="text-muted-foreground">×{i.qty}</span>
                  <span className="font-bold">{formatEGP(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <Row label="المجموع الفرعي" value={formatEGP(pricing.subtotal)} />
              {pricing.offerDiscount > 0 && (
                <Row label="خصم العروض" value={`− ${formatEGP(pricing.offerDiscount)}`} green />
              )}
              {pricing.promoDiscount > 0 && (
                <Row label={`كود ${promo?.code}`} value={`− ${formatEGP(pricing.promoDiscount)}`} green />
              )}
              <Row
                label={`الشحن — ${methodInfo?.label || ''}`}
                value={pricing.freeShipping ? 'مجاني 🎉' : formatEGP(pricing.shippingFee)}
              />
              <Separator />
              <div className="flex items-center justify-between text-base font-black">
                <span>الإجمالي</span>
                <span className="text-primary">{formatEGP(pricing.total)}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={placeOrder}
              disabled={placing || items.length === 0}
              className="h-12 w-full rounded-xl text-base font-extrabold"
            >
              {placing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري تأكيد الطلب…
                </>
              ) : (
                `تأكيد الطلب — ${formatEGP(pricing.total)}`
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              بالضغط على تأكيد الطلب أنت توافق على الشروط والأحكام
            </p>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{label}</Label>
      {children}
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

// Re-export success screen for reuse
export function OrderSuccessContent({
  orderNumber,
  onTrack,
  onClose,
}: {
  orderNumber: string
  onTrack: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
      <h2 className="text-xl font-black">تم استلام طلبك بنجاح! 🎉</h2>
      <p className="text-sm text-muted-foreground">
        سنتواصل معك على رقم الموبايل لتأكيد الطلب — الدعم متاح من 10 صباحًا حتى 6 مساءً
      </p>
      <div className="rounded-xl border-2 border-dashed border-primary/40 bg-accent px-6 py-3">
        <span className="block text-xs text-muted-foreground">رقم الطلب</span>
        <span className="text-lg font-black tracking-wider text-primary" dir="ltr">
          {orderNumber}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">احفظ رقم الطلب لتتبع حالته في أي وقت</p>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={onTrack}>
          📦 تتبع الطلب
        </Button>
        <Button type="button" className="h-11 font-bold" onClick={onClose}>
          متابعة التسوق
        </Button>
      </div>
    </div>
  )
}
