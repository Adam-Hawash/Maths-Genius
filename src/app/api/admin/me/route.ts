import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/pharmacy/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const email = await requireAdmin()
  if (!email) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, email })
}
