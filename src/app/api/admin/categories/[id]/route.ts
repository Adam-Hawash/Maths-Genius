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
    const category = await db.category.update({
      where: { id: Number(id) },
      data: {
        name: String(b.name).trim(),
        emoji: String(b.emoji || '🧴'),
        group: String(b.group || 'health'),
        description: String(b.description || ''),
        sortOrder: Number(b.sortOrder) || 99,
      },
    })
    return NextResponse.json({ ok: true, category })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في التعديل' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    const used = await db.product.count({ where: { categoryId: Number(id) } })
    if (used > 0) {
      return NextResponse.json({ error: `فيه ${used} منتج مربوطين بالفئة دي — انقلهم الأول` }, { status: 400 })
    }
    await db.category.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مش قادر أحذف الفئة' }, { status: 500 })
  }
}
