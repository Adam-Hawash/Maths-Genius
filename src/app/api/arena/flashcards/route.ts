// @ts-nocheck
// ============================================================
// FILE: src/app/api/arena/flashcards/route.ts
// PURPOSE: (2026-و66) تحدي الفلاش كاردز السريعة:
//   GET ?mode=round  → 10 بطاقات سريعة — (2026-و68) المدة بيتحددها
//                      الأدمن (SiteConfig: flashcard_seconds — الافتراضي 15 ث)
//   GET ?mode=board  → لوحة شرف الفلاش كاردز (أعلى 30)
//   GET ?mode=settings → (أدمن) المدة الحالية
//   POST {action:'submit', ...} → حفظ نتيجة الجولة
//   POST {action:'setTime', seconds} → (أدمن) تحديد المدة (5-90 ث)
//   الدرجة = دقة + سرعة (بتتحسب على العميل من الوقت المتبقي —
//   نفس صيغة ساحة التحدي: 60 قاعدة + 40 سرعة + 15 ستريك كل 3 صح)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { ensureArenaTables } from '@/lib/arena'
import { generateFlashcards, FLASHCARD_DEFAULT_SEC } from '@/lib/question-gen'

export const runtime = 'nodejs'

/* قراءة المدة المحفوظة من الأدمن (بثواني) — 15 افتراضي */
async function readFlashcardSeconds(): Promise<number> {
  try {
    var rows = await db.$queryRawUnsafe("SELECT value FROM SiteConfig WHERE key = 'flashcard_seconds' LIMIT 1")
    var v = Number((rows && rows[0] && rows[0].value) || 0)
    if (v >= 5 && v <= 90) return Math.round(v)
  } catch (e) {}
  return FLASHCARD_DEFAULT_SEC
}

export async function GET(request: NextRequest) {
  try {
    await ensureArenaTables()
    var url = new URL(request.url)
    var mode = String(url.searchParams.get('mode') || 'round')

    if (mode === 'board') {
      var rows = await db.$queryRawUnsafe('SELECT * FROM FlashcardScore ORDER BY score DESC, createdAt ASC LIMIT 30')
      var board = (rows || []).map(function (r: any, i: number) {
        return {
          rank: i + 1,
          name: String(r.name || 'طالب'),
          score: Number(r.score || 0),
          correctCount: Number(r.correctCount || 0),
          totalCards: Number(r.totalCards || 10),
          createdAt: String(r.createdAt || ''),
        }
      })
      return NextResponse.json({ ok: true, board: board })
    }

    /* (2026-و68) إعدادات المدة — للأدمن */
    if (mode === 'settings') {
      var secs = await readFlashcardSeconds()
      return NextResponse.json({ ok: true, seconds: secs })
    }

    // جولة جديدة — بالمدة اللي حددها الأدمن (15 افتراضي)
    var seconds = await readFlashcardSeconds()
    var cards = generateFlashcards(10, seconds)
    return NextResponse.json({
      ok: true,
      seconds: seconds,
      cards: cards.map(function (c: any) {
        return {
          id: c.id,
          text: c.text,
          options: c.options,
          correctIndex: c.correctIndex,
          timeLimitSec: Number(c.timeLimitSec || seconds),
        }
      }),
    })
  } catch (e: any) {
    console.error('[arena/flashcards GET] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في تجهيز الجولة' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureArenaTables()
    var body = await request.json().catch(function () { return ({} as any) })
    var action = String(body.action || 'submit')

    /* (2026-و68) setTime — الأدمن بيحدد مدة البطاقة (5-90 ثانية) */
    if (action === 'setTime') {
      var secs = Math.max(5, Math.min(Math.round(Number(body.seconds) || FLASHCARD_DEFAULT_SEC), 90))
      var upd = await safeWrite(function () {
        return db.$executeRawUnsafe("UPDATE SiteConfig SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = 'flashcard_seconds'", String(secs))
      })
      if (!upd || upd.count === 0) {
        await safeWrite(function () {
          return db.$executeRawUnsafe(
            "INSERT INTO SiteConfig (id, key, value, updatedAt) VALUES ('cfg_flashcard_seconds', 'flashcard_seconds', ?, CURRENT_TIMESTAMP)",
            String(secs)
          )
        })
      }
      return NextResponse.json({ ok: true, seconds: secs })
    }

    var name = String(body.name || '').trim().slice(0, 40)
    var studentId = String(body.studentId || '')
    var score = Math.max(0, Math.min(Number(body.score) || 0, 100000))
    var correctCount = Math.max(0, Math.min(Number(body.correctCount) || 0, 100))
    var totalCards = Math.max(1, Math.min(Number(body.totalCards) || 10, 50))
    if (!name) return NextResponse.json({ ok: false, error: 'اكتب اسمك الأول' }, { status: 400 })

    var id = 'fc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    await safeWrite(function () {
      return db.$executeRawUnsafe(
        'INSERT INTO FlashcardScore (id, studentId, name, score, correctCount, totalCards, createdAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        id, studentId, name, score, correctCount, totalCards
      )
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[arena/flashcards POST] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في حفظ النتيجة' }, { status: 500 })
  }
}
