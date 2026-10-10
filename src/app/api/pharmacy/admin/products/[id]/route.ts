import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'
import { toProductDTO, PRODUCT_INCLUDE } from '@/lib/pharmacy-queries'
import { parseProductImages, MAX_PRODUCT_IMAGES } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** أقصى حجم مقبول لأي صورة مفردة (data URL أو مسار) ≈ 1.5 ميجابايت بعد الضغط */
const MAX_IMAGE_LENGTH = 1_500_000

/** تنظيف مصفوفة الصور (نفس منطق POST) */
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

type RouteCtx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const { id } = await ctx.params
    const body = (await req.json()) as Record<string, unknown>

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })

    const data: Record<string, unknown> = {}

    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.description === 'string') data.description = body.description
    if (body.price !== undefined) {
      const price = Number(body.price)
      if (!Number.isFinite(price) || price <= 0)
        return NextResponse.json({ error: 'سعر غير صحيح' }, { status: 400 })
      data.price = price
    }
    if (body.oldPrice !== undefined) {
      const op = body.oldPrice === null ? null : Number(body.oldPrice)
      data.oldPrice = op && Number.isFinite(op) && op > 0 ? op : null
    }
    if (typeof body.emoji === 'string' && body.emoji.trim()) data.emoji = body.emoji.trim()
    if (body.skinType !== undefined)
      data.skinType = typeof body.skinType === 'string' && body.skinType ? body.skinType : null
    if (body.size !== undefined)
      data.size = typeof body.size === 'string' && body.size ? body.size : null
    if (body.stock !== undefined) data.stock = Math.max(0, Math.floor(Number(body.stock) || 0))
    if (body.tags !== undefined) {
      if (Array.isArray(body.tags)) {
        data.tags = JSON.stringify(body.tags.filter((t) => typeof t === 'string' && t.trim()))
      } else if (typeof body.tags === 'string') {
        data.tags = JSON.stringify(
          body.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        )
      }
    }
    if (body.bundleOffer !== undefined) data.bundleOffer = Boolean(body.bundleOffer)
    if (body.active !== undefined) data.active = Boolean(body.active)
    if (typeof body.categoryId === 'string' && body.categoryId) data.categoryId = body.categoryId
    if (body.brandId !== undefined) data.brandId = body.brandId ? String(body.brandId) : null
    if (body.images !== undefined) {
      const images = sanitizeImages(body.images)
      if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 })
      data.images = images.value
    }

    const updated = await db.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    })

    return NextResponse.json({ product: toProductDTO(updated) })
  } catch (error) {
    console.error(`PATCH /api/pharmacy/admin/products/[id] failed:`, error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تعديل المنتج' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  try {
    const { id } = await ctx.params
    const existing = await db.product.findUnique({ where: { id }, include: { orderItems: true } })
    if (!existing) return NextResponse.json({ error: 'المنتج غير موجود' }, { status: 404 })

    if (existing.orderItems.length > 0) {
      // Soft-delete: keep order history references intact
      await db.product.update({ where: { id }, data: { active: false } })
      return NextResponse.json({ ok: true, softDeleted: true })
    }

    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true, softDeleted: false })
  } catch (error) {
    console.error(`DELETE /api/pharmacy/admin/products/[id] failed:`, error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المنتج' }, { status: 500 })
  }
}
