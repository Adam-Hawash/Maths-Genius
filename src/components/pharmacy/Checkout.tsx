'use client'

import { useMemo, useState } from 'react'
import { usePharmacy, fmtEGP } from './store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Lock, Truck, Tag, ArrowRight, BadgeCheck } from 'lucide-react'
import { GOVERNORATES, shippingOptionsFor, calcOfferDiscount, PHONE_RE } from '@/lib/pharmacy/pricing'
import { toast } from 'sonner'

export default function Checkout() {
  const { cart, setView, clearCart } = usePharmacy()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState('')
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null)
  const [promoMsg, setPromoMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.qty, 0), [cart])
  const offerDiscount = useMemo(() => calcOfferDiscount(cart), [cart])
  const options = useMemo(() => shippingOptionsFor(city || 'xx'), [city])
  const activeMethod = method && options.some(o => o.id === method) ? method : options[0]?.id || ''
  const netForShip = Math.max(0, subtotal - offerDiscount - (promo?.discount || 0))
  const shippingFee = city ? (netForShip >= 1500 ? 0 : (options.find(o => o.id === activeMethod)?.fee ?? 0)) : 0
  const total = netForShip + shippingFee

  const applyPromo = async () => {
    if (!promoInput.trim()) return
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput, subtotal: Math.max(0, subtotal - offerDiscount) }),
      })
      const data = await res.json()
      if (data.valid) {
        setPromo({ code: data.code, discount: data.discount })
        setPromoMsg(data.message)
        toast.success(data.message)
      } else {
        setPromo(null)
        setPromoMsg(data.message || 'الكود غير صحيح')
        toast.error(data.message || 'الكود غير صحيح')
      }
    } catch {
      toast.error('حصل خطأ، جرب تاني')
    }
  }

  const placeOrder = async () => {
    if (busy) return
    if (name.trim().length < 3) return toast.error('اكتب اسمك بالكامل')
    if (!PHONE_RE.test(phone.replace(/\s/g, ''))) return toast.error('رقم الموبايل لازم 11 رقم ويبدأ بـ 01')
    if (!city) return toast.error('اختار المحافظة')
    if (address.trim().length < 8) return toast.error('اكتب العنوان بالتفصيل')
    setBusy(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name, phone, city, area, address, notes,
          shippingMethod: activeMethod,
          promoCode: promo?.code || '',
          items: cart.map(c => ({ productId: c.productId, qty: c.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { toast.error(data.error || 'حصل خطأ'); setBusy(false); return }
      clearCart()
      setView({ name: 'success', order: data.orderNumber })
    } catch {
      toast.error('حصل خطأ في الاتصال، جرب تاني')
    } finally {
      setBusy(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-extrabold text-gray-800 mb-2">سلتك فاضية</h2>
        <Button className="bg-cyan-700 hover:bg-cyan-800 mt-2" onClick={() => setView({ name: 'home' })}>
          ابدأ التسوق
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6">
      <button className="flex items-center gap-1 text-sm text-cyan-700 font-semibold mb-4 hover:underline" onClick={() => setView({ name: 'home' })}>
        <ArrowRight className="size-4" /> رجوع للتسوق
      </button>
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">إتمام الطلب 🧾</h1>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 space-y-4">
            <h2 className="font-bold text-gray-800">بيانات التوصيل</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم بالكامل *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أحمد محمد" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الموبايل *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" placeholder="01xxxxxxxxx" dir="ltr" className="h-10 text-right" />
              </div>
              <div className="space-y-1.5">
                <Label>المحافظة *</Label>
                <Select value={city} onValueChange={v => { setCity(v); setMethod('') }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="اختار المحافظة" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>المنطقة / الحي</Label>
                <Input value={area} onChange={e => setArea(e.target.value)} placeholder="مثال: مدينة نصر" className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>العنوان بالتفصيل *</Label>
              <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="اسم الشارع، رقم العمارة، الدور، رقم الشقة، علامة مميزة..." rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات للطلب (اختياري)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." className="h-10" />
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 space-y-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><Truck className="size-5 text-cyan-600" /> طريقة الشحن</h2>
            {!city ? (
              <p className="text-sm text-gray-400">اختار المحافظة الأول عشان نشوفلك طرق الشحن المتاحة</p>
            ) : (
              <RadioGroup value={activeMethod} onValueChange={setMethod} className="gap-2">
                {options.map(o => (
                  <Label
                    key={o.id}
                    className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition ${activeMethod === o.id ? 'border-cyan-500 bg-cyan-50/60' : 'border-gray-200 hover:border-cyan-200'}`}
                  >
                    <RadioGroupItem value={o.id} />
                    <span className="flex-1">
                      <span className="block font-bold text-sm text-gray-800">{o.name}</span>
                      <span className="block text-xs text-gray-400">{o.note}</span>
                    </span>
                    <span className="font-extrabold text-cyan-800 text-sm">
                      {netForShip >= 1500 ? 'مجاني 🎉' : fmtEGP(o.fee)}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 space-y-3 lg:sticky lg:top-32">
            <h2 className="font-bold text-gray-800">ملخص الطلب</h2>
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 pharmacy-scroll">
              {cart.map(c => (
                <div key={c.productId} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{c.emoji}</span>
                  <span className="flex-1 line-clamp-1 text-gray-600">{c.name}</span>
                  <span className="text-gray-400 text-xs">×{c.qty}</span>
                  <span className="font-bold text-gray-800 text-xs whitespace-nowrap">{fmtEGP(c.price * c.qty)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Promo */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    placeholder="كود الخصم (مثال: WELCOME10)"
                    className="pr-9 h-10 text-sm"
                  />
                </div>
                <Button variant="outline" className="h-10 border-cyan-200 text-cyan-700 hover:bg-cyan-50" onClick={applyPromo}>
                  تطبيق
                </Button>
              </div>
              {promoMsg && (
                <p className={`text-xs font-semibold ${promo ? 'text-emerald-600' : 'text-rose-500'}`}>{promoMsg}</p>
              )}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>الإجمالي الفرعي</span><span>{fmtEGP(subtotal)}</span></div>
              {offerDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold"><span>🎁 خصم العرض التلقائي</span><span>- {fmtEGP(offerDiscount)}</span></div>
              )}
              {promo && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>كود {promo.code}</span><span>- {fmtEGP(promo.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>الشحن</span>
                <span>{city ? (shippingFee === 0 ? 'مجاني 🎉' : fmtEGP(shippingFee)) : '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-extrabold text-cyan-900">
                <span>الإجمالي النهائي</span><span>{fmtEGP(total)}</span>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-cyan-700 hover:bg-cyan-800 font-extrabold text-base"
              onClick={placeOrder}
              disabled={busy}
            >
              {busy ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب — الدفع عند الاستلام'}
            </Button>

            {/* Security badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="space-y-1">
                <ShieldCheck className="size-5 mx-auto text-emerald-600" />
                <p className="text-[10px] text-gray-500 font-medium">بياناتك مشفرة<br />وآمنة تمامًا</p>
              </div>
              <div className="space-y-1">
                <Lock className="size-5 mx-auto text-emerald-600" />
                <p className="text-[10px] text-gray-500 font-medium">دفع آمن<br />عند الاستلام</p>
              </div>
              <div className="space-y-1">
                <BadgeCheck className="size-5 mx-auto text-emerald-600" />
                <p className="text-[10px] text-gray-500 font-medium">منتجات أصلية<br />مضمونة 100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
