import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toProductDTO, PRODUCT_INCLUDE } from '@/lib/pharmacy-queries'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = sp.get('search')?.trim()
    const category = sp.get('category')?.trim()
    const group = sp.get('group')?.trim()
    const brand = sp.get('brand')?.trim()
    const skinType = sp.get('skinType')?.trim()
    const minPrice = sp.get('minPrice')
    const maxPrice = sp.get('maxPrice')
    const offers = sp.get('offers')
    const sort = sp.get('sort') || 'newest'
    const ids = sp.get('ids')?.trim()

    const where: Prisma.ProductWhereInput = { active: true }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
        { brand: { is: { name: { contains: search } } } },
      ]
    }
    if (category) where.category = { slug: category }
    if (group) where.category = { ...(where.category as object), group }
    if (brand) where.brand = { slug: brand }
    if (skinType) where.skinType = skinType
    if (offers === '1' || offers === 'true') where.oldPrice = { gt: 0 }
    if (minPrice && !Number.isNaN(Number(minPrice))) {
      where.price = { ...(where.price as object), gte: Number(minPrice) }
    }
    if (maxPrice && !Number.isNaN(Number(maxPrice))) {
      where.price = { ...(where.price as object), lte: Number(maxPrice) }
    }
    if (ids) {
      where.id = { in: ids.split(',').filter(Boolean) }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = []
    if (sort === 'price-asc') orderBy.push({ price: 'asc' })
    else if (sort === 'price-desc') orderBy.push({ price: 'desc' })
    else if (sort === 'discount') orderBy.push({ oldPrice: 'desc' })
    else orderBy.push({ createdAt: 'desc' })

    const products = await db.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      take: 300,
    })

    let dtos = products.map(toProductDTO)
    if (sort === 'discount') {
      dtos = dtos.filter((p) => p.oldPrice && p.oldPrice > p.price)
      dtos.sort(
        (a, b) =>
          (b.oldPrice! - b.price) / b.oldPrice! - (a.oldPrice! - a.price) / a.oldPrice!
      )
    }

    return NextResponse.json({ products: dtos })
  } catch (error) {
    console.error('GET /api/pharmacy/products failed:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحميل المنتجات' }, { status: 500 })
  }
}
