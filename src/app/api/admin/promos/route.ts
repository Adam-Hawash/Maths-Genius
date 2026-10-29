import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const promos = await db.promoCode.findMany({ orderBy: { id: 'desc' } })
  return NextResponse.json({ promos })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const b = await req.json()
    if (!b.code) return NextResponse.json({ error: 'الكود مطلوب' }, { status: 400 })
    const promo = await db.promoCode.create({
      data: {
        code: String(b.code).trim().toUpperCase(),
        type: b.type === 'fixed' ? 'fixed' : 'percent',
        value: Number(b.value) || 0,
        minTotal: Number(b.minTotal) || 0,
        active: b.active !== false,
      },
    })
    return NextResponse.json({ ok: true, promo })
  } catch {
    return NextResponse.json({ error: 'الكود ده موجود بالفعل غالبًا' }, { status: 500 })
  }
}
