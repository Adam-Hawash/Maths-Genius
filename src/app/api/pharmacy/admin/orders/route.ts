import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import type { OrderDTO } from '@/lib/types'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const status = req.nextUrl.searchParams.get('status')?.trim()
    const where: Prisma.OrderWhereInput =
      status && status !== 'all' ? { status } : {}

    const orders = await db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
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
    console.error('GET /api/pharmacy/admin/orders failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
