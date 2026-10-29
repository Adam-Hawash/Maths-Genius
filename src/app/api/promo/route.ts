import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()
    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ valid: false, message: 'بيانات ناقصة' }, { status: 400 })
    }
    const promo = await db.promoCode.findUnique({
      where: { code: String(code).trim().toUpperCase() },
    })
    if (!promo || !promo.active) {
      return NextResponse.json({ valid: false, message: 'الكود ده غير صحيح أو منتهي' })
    }
    if (subtotal < promo.minTotal) {
      return NextResponse.json({
        valid: false,
        message: `الكود ده للطلبات من ${promo.minTotal} جنيه وما فوق`,
      })
    }
    const discount = Math.round(
      (promo.type === 'percent' ? (subtotal * promo.value) / 100 : promo.value) * 100
    ) / 100
    return NextResponse.json({
      valid: true,
      code: promo.code,
      discount,
      message: `مبروك! تم تطبيق خصم ${promo.type === 'percent' ? promo.value + '%' : promo.value + ' جنيه'}`,
    })
  } catch {
    return NextResponse.json({ valid: false, message: 'حصل خطأ، جرب تاني' }, { status: 500 })
  }
}
