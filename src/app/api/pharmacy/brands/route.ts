import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const brands = await db.brand.findMany({
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    })
    return NextResponse.json({ brands })
  } catch (error) {
    console.error('GET /api/pharmacy/brands failed:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحميل الماركات' }, { status: 500 })
  }
}
