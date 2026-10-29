import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

function slugify(base: string) {
  const clean = base.trim().replace(/\s+/g, '-').slice(0, 40)
  return `${clean || 'p'}-${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const products = await db.product.findMany({
    include: { brand: true, category: true },
    orderBy: { id: 'desc' },
  })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const b = await req.json()
    if (!b.name || typeof b.price !== 'number') {
      return NextResponse.json({ error: 'الاسم والسعر مطلوبين' }, { status: 400 })
    }
    const product = await db.product.create({
      data: {
        slug: b.slug ? String(b.slug).trim() : slugify(b.name),
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
    return NextResponse.json({ error: 'حصل خطأ في الإضافة' }, { status: 500 })
  }
}
