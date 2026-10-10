import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('GET /api/pharmacy/categories failed:', error)
    return NextResponse.json({ error: 'حدث خطأ في تحميل الفئات' }, { status: 500 })
  }
}
