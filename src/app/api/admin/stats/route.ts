import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const [orders, products, pending, revenueAgg, recent, lowStock] = await Promise.all([
    db.order.count(),
    db.product.count(),
    db.order.count({ where: { status: 'pending' } }),
    db.order.aggregate({ _sum: { total: true }, where: { status: { not: 'cancelled' } } }),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { items: true } }),
    db.product.findMany({ where: { stock: { lte: 10 } }, take: 6, orderBy: { stock: 'asc' } }),
  ])
  return NextResponse.json({
    totalOrders: orders,
    totalProducts: products,
    pendingOrders: pending,
    revenue: revenueAgg._sum.total ?? 0,
    recent,
    lowStock,
  })
}
