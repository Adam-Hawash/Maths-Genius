import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const promos = await db.promoCode.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ promos })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/promos failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = (await req.json()) as {
      code?: string
      type?: string
      value?: number
      minTotal?: number
      active?: boolean
    }
    const code = (body.code || '').trim().toUpperCase()
    const type = body.type === 'fixed' ? 'fixed' : 'percent'
    const value = Number(body.value)
    const minTotal = Number(body.minTotal) || 0

    if (code.length < 3)
      return NextResponse.json({ error: 'الكود يجب أن يكون 3 أحرف على الأقل' }, { status: 400 })
    if (!Number.isFinite(value) || value <= 0)
      return NextResponse.json({ error: 'قيمة الخصم غير صحيحة' }, { status: 400 })
    if (type === 'percent' && value > 100)
      return NextResponse.json({ error: 'نسبة الخصم لا تزيد عن 100%' }, { status: 400 })

    const exists = await db.promoCode.findUnique({ where: { code } })
    if (exists) return NextResponse.json({ error: 'هذا الكود موجود بالفعل' }, { status: 400 })

    const created = await db.promoCode.create({
      data: { code, type, value, minTotal, active: body.active === undefined ? true : Boolean(body.active) },
    })
    return NextResponse.json({ promo: created }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pharmacy/admin/promos failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة الكود' }, { status: 500 })
  }
}
