import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const b = await req.json()
    const promo = await db.promoCode.update({
      where: { id: Number(id) },
      data: {
        code: String(b.code).trim().toUpperCase(),
        type: b.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(b.value) || 0,
        minTotal: Number(b.minTotal) || 0,
        active: !!b.active,
      },
    })
    return NextResponse.json({ ok: true, promo })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في التعديل' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    await db.promoCode.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مش قادر أحذف الكود' }, { status: 500 })
  }
}
