import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [totalOrders, salesAgg, todayOrders, lowStockProducts, productCount] =
      await Promise.all([
        db.order.count(),
        db.order.aggregate({
          where: { status: { not: 'cancelled' } },
          _sum: { total: true },
        }),
        db.order.count({ where: { createdAt: { gte: startOfToday } } }),
        db.product.findMany({
          where: { stock: { lt: 10 }, active: true },
          include: { category: true },
          orderBy: { stock: 'asc' },
          take: 20,
        }),
        db.product.count(),
      ])

    return NextResponse.json({
      stats: {
        totalOrders,
        totalSales: salesAgg._sum.total ?? 0,
        todayOrders,
        productCount,
      },
      lowStock: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        stock: p.stock,
        categoryName: p.category?.name,
      })),
    })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/stats failed:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحميل الإحصائيات' }, { status: 500 })
  }
}
