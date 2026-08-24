// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 120

const TABLES = [
  'Admin', 'Student', 'StudentActivity', 'Video', 'Homework', 'Exam', 'ExamResult',
  'Announcement', 'Discussion', 'SiteConfig', 'Media', 'VideoProgress', 'GalleryImage',
  'Payment', 'VideoAccess',
]

function maskUrl(url: string) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    return parsed.protocol + '//' + parsed.host
  } catch {
    return url.slice(0, 24) + '...'
  }
}

function resolveEnv() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''
  const token = process.env.TURSO_AUTH_TOKEN || ''
  return { url, token }
}

// GET - current connection status + row counts per table
export async function GET() {
  const env = resolveEnv()
  const isTurso = env.url.startsWith('libsql://') || env.url.startsWith('https://')

  const status = {
    hasUrl: Boolean(env.url),
    hasToken: Boolean(env.token),
    urlVarName: process.env.TURSO_DATABASE_URL ? 'TURSO_DATABASE_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : ''),
    maskedUrl: maskUrl(env.url),
    driver: isTurso ? 'Turso (libSQL)' : 'SQLite محلي',
    connected: false,
    tables: [] as Array<{ name: string; rows: number | null; missing?: boolean }>,
    error: '',
  }

  if (!env.url) {
    status.error = 'لا يوجد رابط قاعدة بيانات في متغيرات البيئة'
    return NextResponse.json(status)
  }

  try {
    const client = createClient({ url: env.url, authToken: env.token || undefined })
    for (const table of TABLES) {
      try {
        const res = await client.execute('SELECT COUNT(*) AS c FROM ' + table)
        status.tables.push({ name: table, rows: Number(res.rows?.[0]?.c ?? 0) })
      } catch {
        status.tables.push({ name: table, rows: null, missing: true })
      }
    }
    await client.close()
    status.connected = true
  } catch (error: any) {
    status.error = error?.message || String(error)
  }

  return NextResponse.json(status)
}

// POST - test a connection (optionally a new one) and/or run the migration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = body.action || 'test'
    const env = resolveEnv()
    const url = String(body.url || '').trim() || env.url
    const token = String(body.token || '').trim() || env.token

    if (!url) {
      return NextResponse.json({ ok: false, error: 'أدخل رابط قاعدة البيانات' }, { status: 400 })
    }
    if (!/^(libsql:\/\/|https:\/\/|file:)/.test(url)) {
      return NextResponse.json({ ok: false, error: 'الرابط يجب أن يبدأ بـ libsql:// أو https://' }, { status: 400 })
    }

    let client
    try {
      client = createClient({ url, authToken: token || undefined })
      await client.execute('SELECT 1')
    } catch (error: any) {
      return NextResponse.json(
        { ok: false, error: 'فشل الاتصال: ' + (error?.message || String(error)) },
        { status: 400 },
      )
    }

    if (action === 'test') {
      const found: string[] = []
      const missing: string[] = []
      for (const table of TABLES) {
        try {
          await client.execute('SELECT 1 FROM ' + table + ' LIMIT 1')
          found.push(table)
        } catch {
          missing.push(table)
        }
      }
      await client.close()
      return NextResponse.json({
        ok: true,
        message: 'الاتصال ناجح',
        maskedUrl: maskUrl(url),
        found,
        missing,
        isCurrent: url === env.url,
      })
    }

    if (action === 'migrate') {
      await client.close()
      const origin = new URL(request.url).origin
      const res = await fetch(origin + '/api/setup-db', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) {
        return NextResponse.json(
          { ok: false, error: data.error || 'فشل إنشاء الجداول' },
          { status: 500 },
        )
      }
      const failed = (data.results || []).filter((r: any) => r && r.ok === false)
      return NextResponse.json({
        ok: true,
        message: failed.length
          ? 'تم التنفيذ مع ' + failed.length + ' تحذير'
          : 'تم إنشاء/تحديث كل الجداول بنجاح',
        failed,
      })
    }

    if (action === 'seed-admin') {
      await client.close()
      let admin = await db.admin.findFirst()
      if (!admin) {
        admin = await db.admin.create({
          data: { email: 'math genius', password: 'wael2026#', name: 'Mr Wael Khodier' },
        })
      }
      return NextResponse.json({ ok: true, message: 'حساب الأدمن جاهز: ' + admin.email })
    }

    await client.close()
    return NextResponse.json({ ok: false, error: 'إجراء غير معروف' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Database panel error:', error)
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 })
  }
}
