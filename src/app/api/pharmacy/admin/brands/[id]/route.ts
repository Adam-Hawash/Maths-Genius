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
      name?: string
      color?: string
      featured?: boolean
    }
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.color === 'string' && body.color.trim()) data.color = body.color.trim()
    if (body.featured !== undefined) data.featured = Boolean(body.featured)

    const updated = await db.brand.update({ where: { id }, data })
    return NextResponse.json({ brand: updated })
  } catch (error) {
    console.error('PATCH /api/pharmacy/admin/brands/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الماركة' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const count = await db.product.count({ where: { brandId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الماركة — مربوطة بـ ${count} منتج` },
        { status: 400 }
      )
    }
    await db.brand.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/pharmacy/admin/brands/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الماركة' }, { status: 500 })
  }
}
