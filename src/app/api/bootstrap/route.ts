import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Public bootstrap endpoint — everything the storefront needs in one call */
export async function GET() {
  const [products, categories, brands, settings] = await Promise.all([
    db.product.findMany({
      include: { brand: true, category: true },
      orderBy: { id: 'asc' },
    }),
    db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    db.brand.findMany({ orderBy: { name: 'asc' } }),
    db.siteSetting.findMany(),
  ])
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return NextResponse.json({ products, categories, brands, settings: settingsMap })
}
