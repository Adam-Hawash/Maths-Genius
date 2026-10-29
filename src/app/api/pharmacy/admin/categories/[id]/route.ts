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
      group?: string
      emoji?: string
      sortOrder?: number
    }
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.group === 'string' && body.group.trim()) data.group = body.group.trim()
    if (typeof body.emoji === 'string' && body.emoji.trim()) data.emoji = body.emoji.trim()
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder)))
      data.sortOrder = Math.floor(Number(body.sortOrder))

    const updated = await db.category.update({ where: { id }, data })
    return NextResponse.json({ category: updated })
  } catch (error) {
    console.error('PATCH /api/pharmacy/admin/categories/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل الفئة' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const count = await db.product.count({ where: { categoryId: id } })
    if (count > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الفئة — فيها ${count} منتج. انقل المنتجات أولًا.` },
        { status: 400 }
      )
    }
    await db.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/pharmacy/admin/categories/[id] failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الفئة' }, { status: 500 })
  }
}
