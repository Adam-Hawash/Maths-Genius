// @ts-nocheck
// ============================================================
// FILE: src/app/api/arena/flashcards/route.ts
// PURPOSE: (2026-و66) تحدي الفلاش كاردز السريعة:
//   GET ?mode=round  → 10 بطاقات سريعة (8 ثواني للبطاقة) — محسوبة
//                      برمجيًا بأرقام جديدة كل جولة
//   GET ?mode=board  → لوحة شرف الفلاش كاردز (أعلى 30)
//   POST {action:'submit', studentId, name, score, correctCount, totalCards}
//                     → حفظ نتيجة الجولة
//   الدرجة = دقة + سرعة (بتتحسب على العميل من الوقت المتبقي —
//   نفس صيغة ساحة التحدي: 60 قاعدة + 40 سرعة + 15 ستريك كل 3 صح)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { ensureArenaTables } from '@/lib/arena'
import { generateFlashcards } from '@/lib/question-gen'

export const runtime = 'nodejs'

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

    // جولة جديدة
    var cards = generateFlashcards(10)
    return NextResponse.json({
      ok: true,
      cards: cards.map(function (c: any) {
        return {
          id: c.id,
          text: c.text,
          options: c.options,
          correctIndex: c.correctIndex,
          timeLimitSec: Number(c.timeLimitSec || 8),
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
