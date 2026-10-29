import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import { toProductDTO, PRODUCT_INCLUDE, slugify } from '@/lib/pharmacy-queries'
import { parseProductImages, MAX_PRODUCT_IMAGES } from '@/lib/types'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

/** أقصى حجم مقبول لأي صورة مفردة (data URL أو مسار) ≈ 1.5 ميجابايت بعد الضغط */
const MAX_IMAGE_LENGTH = 1_500_000

/**
 * تنظيف مصفوفة الصور القادمة من الواجهة:
 * - تقبل مصفوفة نصوص أو JSON string
 * - تسمح فقط بـ data URLs للصور أو مسارات داخلية تبدأ بـ /
 * - تحذف الفرواغة وتحدد عدد أقصى
 */
function sanitizeImages(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const arr = parseProductImages(input)
  const cleaned: string[] = []
  for (const img of arr) {
    const v = img.trim()
    if (!v) continue
    const isDataUrl = /^data:image\/(png|jpe?g|webp);base64,/i.test(v)
    const isInternalPath = v.startsWith('/') && !v.startsWith('//')
    if (!isDataUrl && !isInternalPath) {
      return { ok: false, error: 'روابط الصور يجب أن تكون صور مرفوعة أو مسارات داخلية' }
    }
    if (v.length > MAX_IMAGE_LENGTH) {
      return { ok: false, error: 'أحدي الصور كبيرة جدًا — أعد رفعها مرة أخرى' }
    }
    cleaned.push(v)
    if (cleaned.length >= MAX_PRODUCT_IMAGES) break
  }
  return { ok: true, value: JSON.stringify(cleaned) }
}

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const search = req.nextUrl.searchParams.get('search')?.trim()
    const where: Prisma.ProductWhereInput = search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] }
      : {}
    const products = await db.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 300,
    })
    return NextResponse.json({ products: products.map(toProductDTO) })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/products failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const body = (await req.json()) as {
      name?: string
      description?: string
      price?: number
      oldPrice?: number | null
      emoji?: string
      skinType?: string | null
      size?: string | null
      stock?: number
      tags?: string[] | string
      bundleOffer?: boolean
      active?: boolean
      categoryId?: string
      brandId?: string | null
      slug?: string
      images?: string[] | string
    }

    const name = (body.name || '').trim()
    const price = Number(body.price)
    const categoryId = (body.categoryId || '').trim()

    if (name.length < 2) return NextResponse.json({ error: 'اسم المنتج مطلوب' }, { status: 400 })
    if (!Number.isFinite(price) || price <= 0)
      return NextResponse.json({ error: 'السعر يجب أن يكون رقمًا أكبر من صفر' }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: 'اختر الفئة' }, { status: 400 })

    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) return NextResponse.json({ error: 'الفئة غير موجودة' }, { status: 400 })

    let tagsJson = '[]'
    if (Array.isArray(body.tags)) {
      tagsJson = JSON.stringify(body.tags.filter((t) => typeof t === 'string' && t.trim()))
    } else if (typeof body.tags === 'string' && body.tags.trim()) {
      tagsJson = JSON.stringify(
        body.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      )
    }

    const images = sanitizeImages(body.images ?? [])
    if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 })

    // unique-ish slug
    let slug = slugify(body.slug?.trim() || name)
    const exists = await db.product.findUnique({ where: { slug } })
    if (exists) slug = `${slug}-${Date.now().toString(36)}`

    const created = await db.product.create({
      data: {
        name,
        slug,
        description: (body.description || '').trim(),
        price,
        oldPrice: body.oldPrice != null && Number(body.oldPrice) > 0 ? Number(body.oldPrice) : null,
        emoji: body.emoji?.trim() || '💊',
        skinType: body.skinType?.trim() || null,
        size: body.size?.trim() || null,
        stock: Number.isFinite(Number(body.stock)) ? Math.max(0, Math.floor(Number(body.stock))) : 0,
        tags: tagsJson,
        images: images.value,
        bundleOffer: Boolean(body.bundleOffer),
        active: body.active === undefined ? true : Boolean(body.active),
        categoryId,
        brandId: body.brandId || null,
      },
      include: PRODUCT_INCLUDE,
    })

    return NextResponse.json({ product: toProductDTO(created) }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pharmacy/admin/products failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة المنتج' }, { status: 500 })
  }
}
