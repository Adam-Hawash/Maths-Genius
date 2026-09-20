// @ts-nocheck
// ============================================================
// FILE: src/app/api/arena/challenges/route.ts
// PURPOSE: (2026-و66) تحدي المستر — سؤال صعب أسبوعي الطلاب يتسابقوا فيه
//   GET  → التحدي النشط (بدون الإجابة الصح!) + لوحة الترتيب + التاريخ
//          + myEntry لو الطالب جاوب بالفعل
//   POST {action: create|close|reopen|delete|teacherJoin|deleteEntry}
//        → الأدمن بس (نفس نمط باقي APIs الأدمن في المنصة)
//   لوحة الترتيب: الصح الأول = الأسرع — المستر ظاهر بعلامة خاصة
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { ensureArenaTables } from '@/lib/arena'

export const runtime = 'nodejs'

function mapChallenge(c: any, includeAnswer: boolean) {
  var options: any[] = []
  try { options = JSON.parse(String(c.options || '[]')) } catch (e) {}
  var closesAt = c.closesAt ? String(c.closesAt) : null
  var closedByTime = closesAt ? (new Date(closesAt).getTime() <= Date.now()) : false
  var out: any = {
    id: c.id,
    title: String(c.title || ''),
    question: String(c.question || ''),
    options: options,
    points: Number(c.points || 30),
    durationMin: Number(c.durationMin || 0),
    active: !!Number(c.active || 0) && !closedByTime,
    closesAt: closesAt,
    createdAt: String(c.createdAt || ''),
  }
  if (includeAnswer) out.correctIndex = Number(c.correctIndex || 0)
  return out
}

export async function GET(request: NextRequest) {
  try {
    await ensureArenaTables()
    var url = new URL(request.url)
    var studentId = String(url.searchParams.get('studentId') || '')

    var rows = await db.$queryRawUnsafe('SELECT * FROM TeacherChallenge ORDER BY createdAt DESC LIMIT 30')
    var active: any = null
    var history: any[] = []
    for (var i = 0; i < (rows || []).length; i++) {
      var mapped = mapChallenge(rows[i], false)
      if (!active && mapped.active) active = mapped
      if (mapped.id !== (active && active.id)) history.push({
        id: mapped.id, title: mapped.title, active: mapped.active,
        points: mapped.points, createdAt: mapped.createdAt,
      })
    }

    var leaderboard: any[] = []
    var myEntry: any = null
    if (active) {
      var entries = await db.$queryRawUnsafe(
        'SELECT * FROM ChallengeEntry WHERE challengeId = ? ORDER BY correct DESC, timeMs ASC, createdAt ASC LIMIT 50',
        active.id
      )
      var rank = 0
      for (var e = 0; e < (entries || []).length; e++) {
        var en = entries[e]
        rank++
        leaderboard.push({
          rank: rank,
          name: String(en.name || 'طالب'),
          isTeacher: !!Number(en.isTeacher || 0),
          correct: !!Number(en.correct || 0),
          timeMs: Number(en.timeMs || 0),
          choice: Number(en.choice),
          createdAt: String(en.createdAt || ''),
        })
        if (studentId && String(en.studentId || '') === studentId) {
          myEntry = { choice: Number(en.choice), correct: !!Number(en.correct || 0), timeMs: Number(en.timeMs || 0) }
        }
      }
    }

    return NextResponse.json({ ok: true, active: active, leaderboard: leaderboard, history: history, myEntry: myEntry })
  } catch (e: any) {
    console.error('[arena/challenges GET] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في تحميل تحدي المستر' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureArenaTables()
    var body = await request.json().catch(function () { return ({} as any) })
    var action = String(body.action || '')

    /* ===== create — تحدي جديد (بيقفل القديم تلقائي) ===== */
    if (action === 'create') {
      var title = String(body.title || '').trim().slice(0, 120)
      var question = String(body.question || '').trim().slice(0, 1200)
      var options = Array.isArray(body.options) ? body.options.map(function (o: any) { return String(o || '').trim() }).slice(0, 4) : []
      var correctIndex = Number(body.correctIndex)
      if (!title || !question || options.length < 2 || options.some(function (o: string) { return !o })) {
        return NextResponse.json({ ok: false, error: 'كمّل بيانات التحدي: عنوان + سؤال + اختيارين على الأقل' }, { status: 400 })
      }
      if (!(correctIndex >= 0 && correctIndex < options.length)) correctIndex = 0
      var points = Math.max(10, Math.min(Number(body.points) || 30, 200))
      var durationMin = Math.max(0, Math.min(Number(body.durationMin) || 0, 10080))
      // قفل أي تحدي شغال
      try { await safeWrite(function () { return db.$executeRawUnsafe('UPDATE TeacherChallenge SET active = 0, updatedAt = CURRENT_TIMESTAMP WHERE active = 1') }) } catch (e) {}
      var id = 'tch_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      var closesAt = durationMin > 0 ? new Date(Date.now() + durationMin * 60 * 1000).toISOString() : null
      await safeWrite(function () {
        return db.$executeRawUnsafe(
          'INSERT INTO TeacherChallenge (id, title, question, options, correctIndex, points, durationMin, active, closesAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          id, title, question, JSON.stringify(options), correctIndex, points, durationMin, closesAt
        )
      })
      return NextResponse.json({ ok: true, id: id })
    }

    /* ===== أفعال على تحدي موجود ===== */
    var id2 = String(body.id || '')
    if (action === 'close' || action === 'reopen' || action === 'delete') {
      if (!id2) return NextResponse.json({ ok: false, error: 'محددش التحدي' }, { status: 400 })
      if (action === 'delete') {
        await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM ChallengeEntry WHERE challengeId = ?', id2) })
        await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM TeacherChallenge WHERE id = ?', id2) })
        return NextResponse.json({ ok: true })
      }
      var act = action === 'open' ? 1 : 0
      if (action === 'reopen') {
        try { await safeWrite(function () { return db.$executeRawUnsafe('UPDATE TeacherChallenge SET active = 0 WHERE active = 1') }) } catch (e) {}
        act = 1
      } else {
        act = 0
      }
      await safeWrite(function () { return db.$executeRawUnsafe('UPDATE TeacherChallenge SET active = ?, closesAt = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', act, id2) })
      return NextResponse.json({ ok: true })
    }

    /* ===== teacherJoin — المستر ينزل يلعب بنفسه (بس اسمه) ===== */
    if (action === 'teacherJoin') {
      if (!id2) return NextResponse.json({ ok: false, error: 'محددش التحدي' }, { status: 400 })
      var rows2 = await db.$queryRawUnsafe('SELECT * FROM TeacherChallenge WHERE id = ? LIMIT 1', id2)
      if (!rows2 || rows2.length === 0) return NextResponse.json({ ok: false, error: 'التحدي مش موجود' }, { status: 404 })
      var ch = rows2[0]
      var already = await db.$queryRawUnsafe("SELECT id FROM ChallengeEntry WHERE challengeId = ? AND isTeacher = 1 LIMIT 1", id2)
      if (already && already.length > 0) {
        return NextResponse.json({ ok: false, error: 'انت نازل في التحدي ده بالفعل' }, { status: 409 })
      }
      var eid = 'ent_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      await safeWrite(function () {
        return db.$executeRawUnsafe(
          "INSERT INTO ChallengeEntry (id, challengeId, studentId, name, isTeacher, choice, correct, timeMs, createdAt) VALUES (?, ?, '', 'المستر وائل 👨‍🏫', 1, ?, 1, ?, CURRENT_TIMESTAMP)",
          eid, id2, Number(ch.correctIndex || 0), Math.floor(Math.random() * 4000) + 2000
        )
      })
      return NextResponse.json({ ok: true })
    }

    /* ===== deleteEntry — الأدمن يشيل دخول غلط ===== */
    if (action === 'deleteEntry') {
      await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM ChallengeEntry WHERE id = ?', String(body.entryId || '')) })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'أكشن غير معروف' }, { status: 400 })
  } catch (e: any) {
    console.error('[arena/challenges POST] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في تنفيذ الطلب' }, { status: 500 })
  }
}
