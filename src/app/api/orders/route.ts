import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calcOfferDiscount, shippingFeeFor, PHONE_RE, CAIRO_GIZA } from '@/lib/pharmacy/pricing'

export const dynamic = 'force-dynamic'

type Incoming = {
  customerName?: string; phone?: string; city?: string; area?: string; address?: string
  notes?: string; shippingMethod?: string; promoCode?: string
  items?: { productId: number; qty: number }[]
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Incoming
    const name = (b.customerName || '').trim()
    const phone = (b.phone || '').replace(/\s/g, '')
    const city = (b.city || '').trim()
    const address = (b.address || '').trim()

    if (name.length < 3) return NextResponse.json({ error: 'اكتب اسمك بالكامل من فضلك' }, { status: 400 })
    if (!PHONE_RE.test(phone)) return NextResponse.json({ error: 'رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01' }, { status: 400 })
    if (!city) return NextResponse.json({ error: 'اختار المحافظة' }, { status: 400 })
    if (address.length < 8) return NextResponse.json({ error: 'اكتب العنوان بالتفصيل' }, { status: 400 })
    if (!b.items?.length) return NextResponse.json({ error: 'السلة فاضية' }, { status: 400 })

    const ids = b.items.map(i => Number(i.productId)).filter(Boolean)
    const products = await db.product.findMany({ where: { id: { in: ids } } })
    if (!products.length) return NextResponse.json({ error: 'المنتجات غير متاحة' }, { status: 400 })

    const items = b.items
      .map(i => {
        const p = products.find(x => x.id === Number(i.productId))
        if (!p) return null
        const qty = Math.max(1, Math.min(50, Number(i.qty) || 1))
        return { productId: p.id, name: p.name, price: p.price, qty, emoji: p.emoji, tags: p.tags }
      })
      .filter(Boolean) as { productId: number; name: string; price: number; qty: number; emoji: string; tags: string }[]

    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100
    const offerDiscount = calcOfferDiscount(items)

    // promo
    let discount = 0
    let promoCodeUsed = ''
    const code = (b.promoCode || '').trim().toUpperCase()
    if (code) {
      const promo = await db.promoCode.findUnique({ where: { code } })
      const base = Math.max(0, subtotal - offerDiscount)
      if (promo && promo.active && base >= promo.minTotal) {
        discount = Math.round((promo.type === 'percent' ? (base * promo.value) / 100 : promo.value) * 100) / 100
        promoCodeUsed = promo.code
      }
    }

    // shipping — provinces outside Cairo/Giza regardless of what was sent
    let method = b.shippingMethod || 'provinces'
    if (!CAIRO_GIZA.includes(city)) method = 'provinces'
    if (!['sameday', 'supersaver', 'provinces'].includes(method)) method = 'provinces'
    const netForShip = Math.max(0, subtotal - offerDiscount - discount)
    const shippingFee = shippingFeeFor(method, netForShip)
    const total = Math.round((netForShip + shippingFee) * 100) / 100

    const orderNumber = `ET-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`

    const order = await db.order.create({
      data: {
        orderNumber, customerName: name, phone, city,
        area: (b.area || '').trim(), address, notes: (b.notes || '').trim(),
        shippingMethod: method, shippingFee, paymentMethod: 'cod',
        subtotal, discount, offerDiscount, promoCode: promoCodeUsed, total, status: 'pending',
        items: { create: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })) },
      },
    })

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber, total })
  } catch (e) {
    console.error('order error', e)
    return NextResponse.json({ error: 'حصل خطأ في إنشاء الطلب، جرب تاني' }, { status: 500 })
  }
}
