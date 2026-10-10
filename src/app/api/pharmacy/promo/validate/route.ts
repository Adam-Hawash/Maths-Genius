import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computePromoDiscount, round2 } from '@/lib/pricing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { code?: string; subtotal?: number }
    const code = (body.code || '').trim().toUpperCase()
    const subtotal = Math.max(0, Number(body.subtotal) || 0)

    if (!code) {
      return NextResponse.json({ valid: false, message: 'اكتب كود الخصم أولًا' }, { status: 400 })
    }

    const promo = await db.promoCode.findUnique({ where: { code } })
    if (!promo) {
      return NextResponse.json({ valid: false, message: 'كود الخصم غير صحيح' }, { status: 200 })
    }

    const { discount, error } = computePromoDiscount(promo, subtotal)
    if (error) {
      return NextResponse.json({ valid: false, message: error }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      minTotal: promo.minTotal,
      discount: round2(discount),
      message:
        promo.type === 'fixed'
          ? `تم تطبيق خصم ${promo.value} ج.م`
          : `تم تطبيق خصم ${promo.value}%`,
    })
  } catch (error) {
    console.error('POST /api/pharmacy/promo/validate failed:', error)
    return NextResponse.json({ valid: false, message: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 })
  }
}
