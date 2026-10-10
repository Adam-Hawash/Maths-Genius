import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const b = await req.json()
    if (!STATUSES.includes(b.status)) {
      return NextResponse.json({ error: 'حالة غير معروفة' }, { status: 400 })
    }
    const order = await db.order.update({
      where: { id: Number(id) },
      data: { status: b.status },
    })
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في التحديث' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    await db.order.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مش قادر أحذف الطلب' }, { status: 500 })
  }
}
