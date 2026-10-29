import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    const b = await req.json()
    if (!b.name) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 })
    const slug = b.slug ? String(b.slug).trim() : `c-${Date.now().toString(36)}`
    const category = await db.category.create({
      data: {
        slug, name: String(b.name).trim(),
        emoji: String(b.emoji || '🧴'),
        group: String(b.group || 'health'),
        description: String(b.description || ''),
        sortOrder: Number(b.sortOrder) || 99,
      },
    })
    return NextResponse.json({ ok: true, category })
  } catch {
    return NextResponse.json({ error: 'حصل خطأ في الإضافة' }, { status: 500 })
  }
}
