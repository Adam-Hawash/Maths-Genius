import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import { slugify } from '@/lib/pharmacy-queries'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const brands = await db.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json({
      brands: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        color: b.color,
        featured: b.featured,
        productCount: b._count.products,
      })),
    })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/brands failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = (await req.json()) as {
      name?: string
      color?: string
      featured?: boolean
    }
    const name = (body.name || '').trim()
    if (name.length < 2) return NextResponse.json({ error: 'اسم الماركة مطلوب' }, { status: 400 })

    let slug = slugify(name)
    const exists = await db.brand.findUnique({ where: { slug } })
    if (exists) return NextResponse.json({ error: 'الماركة موجودة بالفعل' }, { status: 400 })

    const created = await db.brand.create({
      data: {
        name,
        slug,
        color: body.color?.trim() || '#0E7490',
        featured: Boolean(body.featured),
      },
    })
    return NextResponse.json({ brand: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pharmacy/admin/brands failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الماركة' }, { status: 500 })
  }
}
