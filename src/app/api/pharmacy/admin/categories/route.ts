import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import { slugify } from '@/lib/pharmacy-queries'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const categories = await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        group: c.group,
        emoji: c.emoji,
        sortOrder: c.sortOrder,
        productCount: c._count.products,
      })),
    })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/categories failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = (await req.json()) as {
      name?: string
      group?: string
      emoji?: string
      sortOrder?: number
    }
    const name = (body.name || '').trim()
    if (name.length < 2) return NextResponse.json({ error: 'اسم الفئة مطلوب' }, { status: 400 })

    let slug = slugify(name)
    const exists = await db.category.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`

    const maxSort = await db.category.aggregate({ _max: { sortOrder: true } })
    const created = await db.category.create({
      data: {
        name,
        slug,
        group: body.group?.trim() || 'health',
        emoji: body.emoji?.trim() || '💊',
        sortOrder:
          Number.isFinite(Number(body.sortOrder)) && Number(body.sortOrder) > 0
            ? Math.floor(Number(body.sortOrder))
            : (maxSort._max.sortOrder ?? 0) + 1,
      },
    })
    return NextResponse.json({ category: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pharmacy/admin/categories failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الفئة' }, { status: 500 })
  }
}
