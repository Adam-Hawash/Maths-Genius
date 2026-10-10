import { NextResponse } from 'next/server'
import { getSettingsMap } from '@/lib/pharmacy-queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await getSettingsMap()
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('GET /api/pharmacy/settings failed:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحميل الإعدادات' }, { status: 500 })
  }
}
