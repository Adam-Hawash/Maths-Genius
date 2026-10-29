import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const brands = await db.brand.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ brands })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const b = await req.json()
    if (!b.name) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    const slug = b.slug ? String(b.slug).trim() : `b-${Date.now().toString(36)}`
    const brand = await db.brand.create({
      data: {
        slug,
        name: String(b.name).trim(),
        color: String(b.color || '#0e7490'),
        featured: !!b.featured,
      },
    })
    return NextResponse.json({ ok: true, brand })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في الإضافة' }, { status: 500 })
  }
}
