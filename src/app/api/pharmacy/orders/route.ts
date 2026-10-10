import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  computeCartPricing,
  generateOrderNumber,
  type CartLine,
  type PromoInfo,
} from '@/lib/pricing'
import { getSettingsMap } from '@/lib/pharmacy-queries'

export const dynamic = 'force-dynamic'

type IncomingItem = { productId?: string; qty?: number }

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      customerName?: string
      phone?: string
      city?: string
      area?: string
      address?: string
      notes?: string
      shippingMethod?: string
      paymentMethod?: string
      promoCode?: string
      items?: IncomingItem[]
    }

    const customerName = (body.customerName || '').trim()
    const phone = (body.phone || '').trim()
    const city = (body.city || '').trim()
    const area = (body.area || '').trim()
    const address = (body.address || '').trim()
    const notes = (body.notes || '').trim()
    const shippingMethod = body.shippingMethod || 'same-day'
    const paymentMethod = body.paymentMethod || 'cod'
    const rawItems = Array.isArray(body.items) ? body.items : []

    const errors: string[] = []
    if (customerName.length < 3) errors.push('الاسم مطلوب (3 أحرف على الأقل)')
    if (!/^0?1\d{8,9}$/.test(phone.replace(/\s/g, ''))) errors.push('رقم الموبايل غير صحيح')
    if (!city) errors.push('المدينة مطلوبة')
    if (!address || address.length < 5) errors.push('العنوان مطلوب')
    if (rawItems.length === 0) errors.push('السلة فارغة')
    if (!['same-day', 'super-saver', 'governorates'].includes(shippingMethod))
      errors.push('طريقة الشحن غير صحيحة')
    if (!['cod', 'vodafone'].includes(paymentMethod)) errors.push('طريقة الدفع غير صحيحة')

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 })
    }

    // Merge duplicate lines & validate qty
    const qtyById = new Map<string, number>()
    for (const item of rawItems) {
      const id = (item.productId || '').trim()
      const qty = Math.max(1, Math.floor(Number(item.qty) || 0))
      if (!id || qty <= 0) continue
      qtyById.set(id, (qtyById.get(id) || 0) + qty)
    }
    const lines: CartLine[] = [...qtyById.entries()].map(([productId, qty]) => ({ productId, qty }))

    const productIds = lines.map((l) => l.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
    })

    if (products.length !== qtyById.size) {
      return NextResponse.json({ error: 'بعض المنتجات في السلة غير متاحة حاليًا' }, { status: 400 })
    }

    // Stock validation
    for (const p of products) {
      const qty = qtyById.get(p.id) || 0
      if (qty > p.stock) {
        return NextResponse.json(
          { error: `الكمية المتاحة من «${p.name}» هي ${p.stock} فقط` },
          { status: 400 }
        )
      }
    }

    const productsById = new Map(
      products.map((p) => [
        p.id,
        { id: p.id, name: p.name, price: p.price, bundleOffer: p.bundleOffer },
      ])
    )

    // Promo code (if any)
    let promo: PromoInfo | null = null
    const promoCode = (body.promoCode || '').trim().toUpperCase()
    if (promoCode) {
      const promoRow = await db.promoCode.findUnique({ where: { code: promoCode } })
      if (promoRow) promo = promoRow
    }

    const settings = await getSettingsMap()

    // Bundle: allow up to double floor(qty/2)+1 extra units to be covered by bundle math
    // (validated against stock above; offer math is applied only, no extra fulfillment)
    const pricing = computeCartPricing({
      lines,
      productsById,
      promo,
      settings,
      shippingMethod,
    })

    if (promoCode && pricing.promoError) {
      return NextResponse.json({ error: pricing.promoError }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          phone,
          city,
          area: area || null,
          address,
          notes: notes || null,
          shippingMethod,
          paymentMethod,
          subtotal: pricing.subtotal,
          offerDiscount: pricing.offerDiscount,
          promoDiscount: pricing.promoDiscount,
          shippingFee: pricing.shippingFee,
          total: pricing.total,
          status: 'pending',
          promoCode: promo ? promo.code : null,
          items: {
            create: lines.map((l) => {
              const p = productsById.get(l.productId)!
              const row = products.find((x) => x.id === l.productId)!
              return {
                productId: p.id,
                name: p.name,
                emoji: row.emoji,
                price: p.price,
                qty: l.qty,
              }
            }),
          },
        },
        include: { items: true },
      })

      // Decrement stock
      for (const l of lines) {
        await tx.product.update({
          where: { id: l.productId },
          data: { stock: { decrement: l.qty } },
        })
      }

      return created
    })

    return NextResponse.json(
      {
        ok: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          subtotal: order.subtotal,
          offerDiscount: order.offerDiscount,
          promoDiscount: order.promoDiscount,
          shippingFee: order.shippingFee,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/pharmacy/orders failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الطلب، حاول مرة أخرى' }, { status: 500 })
  }
}
