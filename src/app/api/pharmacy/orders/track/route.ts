import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { OrderDTO } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() || ''
    if (q.length < 5) {
      return NextResponse.json(
        { error: 'اكتب رقم الطلب أو رقم الموبايل للبحث' },
        { status: 400 }
      )
    }

    const digits = q.replace(/\s/g, '')
    const isPhoneLike = /^\+?0?1\d{8,9}$/.test(digits)

    const orders = await db.order.findMany({
      where: isPhoneLike
        ? { phone: { contains: digits } }
        : { OR: [{ orderNumber: { equals: q.toUpperCase() } }, { orderNumber: { contains: q } }] },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const dtos: OrderDTO[] = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone,
      city: o.city,
      area: o.area,
      address: o.address,
      notes: o.notes,
      shippingMethod: o.shippingMethod,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      offerDiscount: o.offerDiscount,
      promoDiscount: o.promoDiscount,
      shippingFee: o.shippingFee,
      total: o.total,
      status: o.status,
      promoCode: o.promoCode,
      items: o.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        emoji: i.emoji,
        price: i.price,
        qty: i.qty,
      })),
      createdAt: o.createdAt.toISOString(),
    }))

    return NextResponse.json({ orders: dtos })
  } catch (error) {
    console.error('GET /api/pharmacy/orders/track failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء البحث عن الطلب' }, { status: 500 })
  }
}
