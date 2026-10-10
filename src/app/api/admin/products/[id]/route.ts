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
    const product = await db.product.update({
      where: { id: Number(id) },
      data: {
        name: String(b.name).trim(),
        description: String(b.description || ''),
        price: Number(b.price),
        oldPrice: b.oldPrice ? Number(b.oldPrice) : null,
        emoji: String(b.emoji || '💊'),
        skinType: String(b.skinType || ''),
        size: String(b.size || ''),
        stock: Number.isFinite(Number(b.stock)) ? Number(b.stock) : 50,
        tags: String(b.tags || ''),
        brandId: b.brandId ? Number(b.brandId) : null,
        categoryId: b.categoryId ? Number(b.categoryId) : null,
      },
    })
    return NextResponse.json({ ok: true, product })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في التعديل' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const { id } = await ctx.params
    await db.product.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'مش قادر أحذف المنتج ده' }, { status: 500 })
  }
}
