import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const body = (await req.json()) as {
      type?: string
      value?: number
      minTotal?: number
      active?: boolean
    }
    const data: Record<string, unknown> = {}
    if (body.type === 'percent' || body.type === 'fixed') data.type = body.type
    if (body.value !== undefined) {
      const value = Number(body.value)
      if (!Number.isFinite(value) || value <= 0)
        return NextResponse.json({ error: 'قيمة غير صحيحة' }, { status: 400 })
      data.value = value
    }
    if (body.minTotal !== undefined) data.minTotal = Math.max(0, Number(body.minTotal) || 0)
    if (body.active !== undefined) data.active = Boolean(body.active)

    const updated = await db.promoCode.update({ where: { id }, data })
    return NextResponse.json({ promo: updated })
  } catch (error) {
    console.error('PATCH /api/pharmacy/admin/promos/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الكود' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    await db.promoCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/pharmacy/admin/promos/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الكود' }, { status: 500 })
  }
}
