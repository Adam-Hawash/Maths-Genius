import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import { ORDER_STATUSES } from '@/lib/types'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const { id } = await ctx.params
    const body = (await req.json()) as { status?: string }
    const status = body.status || ''

    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      return NextResponse.json({ error: 'حالة غير صحيحة' }, { status: 400 })
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    })

    return NextResponse.json({ ok: true, status: updated.status })
  } catch (error) {
    console.error('PATCH /api/pharmacy/admin/orders/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث حالة الطلب' }, { status: 500 })
  }
}
