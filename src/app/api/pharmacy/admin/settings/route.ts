import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminEmailFromRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const settings = await db.siteSetting.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('GET /api/pharmacy/admin/settings failed:', error)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const adminEmail = getAdminEmailFromRequest(req)
  if (!adminEmail) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const body = (await req.json()) as { settings?: Record<string, string> }
    const incoming = body.settings || {}

    for (const [key, value] of Object.entries(incoming)) {
      if (typeof key !== 'string' || key.length > 100) continue
      await db.siteSetting.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      })
    }

    const settings = await db.siteSetting.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    console.error('PUT /api/pharmacy/admin/settings failed:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ الإعدادات' }, { status: 500 })
  }
}
