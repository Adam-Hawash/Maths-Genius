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
    const brand = await db.brand.update({
      where: { id: Number(id) },
      data: {
        name: String(b.name).trim(),
        color: String(b.color || '#0e7490'),
        featured: !!b.featured,
      },
    })
    return NextResponse.json({ ok: true, brand })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في التعديل' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const used = await db.product.count({ where: { brandId: Number(id) } })
    if (used > 0) {
      return NextResponse.json({ error: `فيه ${used} منتج مربوطين بالماركة دي — انقلهم الأول` }, { status: 400 })
    }
    await db.brand.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مش قادر أحذف الماركة' }, { status: 500 })
  }
}
