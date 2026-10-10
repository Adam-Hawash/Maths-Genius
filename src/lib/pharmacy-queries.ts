import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import type { ProductDTO } from '@/lib/types'
import { parseProductImages } from '@/lib/types'

export const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
} satisfies Prisma.ProductInclude

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>

export function toProductDTO(p: ProductWithRelations): ProductDTO {
  let tags: string[] = []
  try {
    const parsed = JSON.parse(p.tags)
    if (Array.isArray(parsed)) tags = parsed.filter((t) => typeof t === 'string')
  } catch {
    tags = []
  }
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    emoji: p.emoji,
    images: parseProductImages(p.images),
    skinType: p.skinType,
    size: p.size,
    stock: p.stock,
    tags,
    bundleOffer: p.bundleOffer,
    active: p.active,
    categoryId: p.categoryId,
    categoryName: p.category?.name,
    categorySlug: p.category?.slug,
    categoryGroup: p.category?.group,
    brandId: p.brandId,
    brandName: p.brand?.name ?? null,
    brandColor: p.brand?.color ?? null,
    createdAt: p.createdAt?.toISOString?.() ?? undefined,
  }
}

export function slugify(input: string): string {
  const base = input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `item-${Date.now()}`
}

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany()
  const map: Record<string, string> = {}
  for (const row of rows) map[row.key] = row.value
  return map
}
