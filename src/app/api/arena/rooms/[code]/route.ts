// @ts-nocheck
// ============================================================
// FILE: src/app/api/arena/rooms/[code]/route.ts
// PURPOSE: (2026-و66) قلب تحدي الجروبات — حالة الغرفة الحية:
//   GET  ?playerId=&token= → حالة كاملة (players + question + scores)
//        مع «التحديث الكسول»: لو وقت السؤال خلص بننتقل للسؤال اللي بعده
//        أو نلعب بالغرفة — كل العيّلات بتتزامن من هنا (polling ~1s)
//   POST {action: join|start|answer|next|leave|end}
//        • join: دخول بالاسم (حد أقصى 6 لاعبين)
//        • start/next/end: للهوست بس (بتوكن سري)
//        • answer: مرة واحدة لكل سؤال — درجة = سرعة + دقة + ستريك
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { ensureArenaTables } from '@/lib/arena'

export const runtime = 'nodejs'

var ONLINE_WINDOW_MS = 12000
var MAX_PLAYERS = 6

function rowToPlayer(p: any, currentIndex: number) {
  var answers = {}
  try { answers = JSON.parse(String(p.answers || '{}')) } catch (e) {}
  var answeredCurrent = answers && answers[String(currentIndex)] !== undefined
  var online = Number(p.lastSeen || 0) > Date.now() - ONLINE_WINDOW_MS
  return {
    id: p.id,
    name: String(p.name || ''),
    isHost: !!Number(p.isHost || 0),
    score: Number(p.score || 0),
    streak: Number(p.streak || 0),
    online: online,
    answeredCurrent: !!answeredCurrent,
  }
}

/* التحديث الكسول — بيحصل مرة واحدة لكل نداء بالذات (guard بسيط) */
async function lazyTick(room: any) {
  if (!room || room.status !== 'live') return false
  var questions: any[] = []
  try { questions = JSON.parse(String(room.questions || '[]')) } catch (e) {}
  if (questions.length === 0) return false
  var started = false
  var changed = false
  while (true) {
    if (room.currentIndex >= questions.length) {
      await safeWrite(function () { return db.$executeRawUnsafe("UPDATE BattleRoom SET status = 'ended', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", room.id) })
      room.status = 'ended'
      changed = true
      break
    }
    var q = questions[room.currentIndex] || {}
    var limit = Math.max(8, Number(q.timeLimitSec || 25)) * 1000
    var elapsed = Date.now() - Number(room.questionStartAt || 0)
    if (elapsed > limit + 900) {
      room.currentIndex = Number(room.currentIndex) + 1
      room.questionStartAt = String(Date.now())
      await safeWrite(function () {
        return db.$executeRawUnsafe('UPDATE BattleRoom SET currentIndex = ?, questionStartAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', room.currentIndex, room.questionStartAt, room.id)
      })
      changed = true
      continue
    }
    break
  }
  if (started) { /* reserved */ }
  return changed
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await ensureArenaTables()
    var code = String((await params).code || '').toUpperCase().trim()
    var url = new URL(request.url)
    var playerId = String(url.searchParams.get('playerId') || '')
    var token = String(url.searchParams.get('token') || '')

    var roomRows = await db.$queryRawUnsafe('SELECT * FROM BattleRoom WHERE code = ? LIMIT 1', code)
    if (!roomRows || roomRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'الغرفة مش موجودة — راجع الكود' }, { status: 404 })
    }
    var room = roomRows[0]
    await lazyTick(room)

    var players = await db.$queryRawUnsafe('SELECT * FROM BattlePlayer WHERE roomId = ? ORDER BY score DESC, lastSeen ASC', room.id)

    var questions: any[] = []
    try { questions = JSON.parse(String(room.questions || '[]')) } catch (e) {}

    // حدّث حضور اللاعب
    var me: any = null
    var myAnswer: any = null
    var lastResult: any = null
    if (playerId) {
      for (var i = 0; i < (players || []).length; i++) {
        if (players[i].id === playerId) {
          me = players[i]
          break
        }
      }
      if (me) {
        try { await db.$executeRawUnsafe('UPDATE BattlePlayer SET lastSeen = ? WHERE id = ?', String(Date.now()), me.id) } catch (e) {}
        var answers = {}
        try { answers = JSON.parse(String(me.answers || '{}')) } catch (e) {}
        var curIdx = Number(room.currentIndex)
        if (answers[String(curIdx)]) myAnswer = answers[String(curIdx)]
        var prevIdx = curIdx - 1
        if (answers[String(prevIdx)]) lastResult = Object.assign({ questionIndex: prevIdx }, answers[String(prevIdx)])
      }
    }

    var live = room.status === 'live'
    var currentIndex = Number(room.currentIndex)
    var currentQuestion: any = null
    if (live && currentIndex >= 0 && currentIndex < questions.length) {
      var q = questions[currentIndex]
      var limit = Math.max(8, Number(q.timeLimitSec || 25)) * 1000
      var remainMs = Math.max(0, limit - (Date.now() - Number(room.questionStartAt || 0)))
      // ممنوع نبعت الإجابة الصح قبل ما السؤال يخلص
      currentQuestion = {
        index: currentIndex,
        text: String(q.text || ''),
        options: q.options || [],
        timeLimitSec: Number(q.timeLimitSec || 25),
        remainMs: remainMs,
      }
    }

    var revealed: any = null
    // لما السؤال يخلص (وقته عدى) نكشف الإجابة مع الشرح — نفس السؤال لحد ما ينقل
    if (live && currentIndex < questions.length && currentQuestion && currentQuestion.remainMs <= 0) {
      var q2 = questions[currentIndex]
      revealed = { correctIndex: Number(q2.correctIndex), explanation: String(q2.explanation || '') }
    }

    var totalRounds = questions.length
    var ended = room.status === 'ended'

    // نتايج نهائية كاملة بعد الختام
    var finalQuestions: any[] | null = null
    var finalAnswers: Record<string, any> | null = null
    if (ended) {
      finalQuestions = questions.map(function (q: any) {
        return { text: String(q.text || ''), options: q.options || [], correctIndex: Number(q.correctIndex), explanation: String(q.explanation || '') }
      })
      finalAnswers = {}
      for (var pi = 0; pi < (players || []).length; pi++) {
        try { finalAnswers[players[pi].id] = JSON.parse(String(players[pi].answers || '{}')) } catch (e) {}
      }
    }

    return NextResponse.json({
      ok: true,
      room: {
        code: room.code,
        title: room.title,
        status: room.status,
        currentIndex: currentIndex,
        totalRounds: totalRounds,
        hostPlayerId: room.hostPlayerId,
        currentQuestion: currentQuestion,
        revealed: revealed,
        players: (players || []).map(function (p: any) { return rowToPlayer(p, currentIndex) }),
        finalQuestions: finalQuestions,
        finalAnswers: finalAnswers,
      },
      me: me
        ? {
            id: me.id,
            name: String(me.name || ''),
            token: String(me.token || ''),
            isHost: !!Number(me.isHost || 0),
            score: Number(me.score || 0),
            streak: Number(me.streak || 0),
            myAnswer: myAnswer,
            lastResult: lastResult,
          }
        : null,
      now: Date.now(),
    })
  } catch (e: any) {
    console.error('[arena/room GET] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في تحديث الغرفة' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await ensureArenaTables()
    var code = String((await params).code || '').toUpperCase().trim()
    var body = await request.json().catch(function () { return ({} as any) })
    var action = String(body.action || '')

    var roomRows = await db.$queryRawUnsafe('SELECT * FROM BattleRoom WHERE code = ? LIMIT 1', code)
    if (!roomRows || roomRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'الغرفة مش موجودة' }, { status: 404 })
    }
    var room = roomRows[0]
    var questions: any[] = []
    try { questions = JSON.parse(String(room.questions || '[]')) } catch (e) {}

    /* ===== join ===== */
    if (action === 'join') {
      if (room.status === 'ended') return NextResponse.json({ ok: false, error: 'التحدي ده خلص خلاص' }, { status: 409 })
      var existingPlayers = await db.$queryRawUnsafe('SELECT * FROM BattlePlayer WHERE roomId = ?', room.id)
      if ((existingPlayers || []).length >= MAX_PLAYERS) {
        return NextResponse.json({ ok: false, error: 'الغرفة كملت (' + MAX_PLAYERS + ' لاعبين كحد أقصى)' }, { status: 409 })
      }
      var name = String(body.name || '').trim().slice(0, 40)
      if (!name) return NextResponse.json({ ok: false, error: 'اكتب اسمك الأول' }, { status: 400 })
      // لو نفس الاسم موجود → نميزه برقم
      var taken = (existingPlayers || []).some(function (p: any) { return String(p.name) === name })
      if (taken) name = name + ' ' + (existingPlayers.length + 1)
      var pid = 'bp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
      var ptoken = Math.random().toString(36).slice(2) + Date.now().toString(36)
      await safeWrite(function () {
        return db.$executeRawUnsafe(
          'INSERT INTO BattlePlayer (id, roomId, name, token, isHost, score, streak, answers, lastSeen, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          pid, room.id, name, ptoken, '{}', String(Date.now())
        )
      })
      return NextResponse.json({
        ok: true,
        me: { id: pid, name: name, token: ptoken, isHost: false, score: 0, streak: 0 },
        room: { code: room.code, status: room.status, totalRounds: questions.length },
      })
    }

    /* باقي الأفعال محتاجة لاعب + توكن */
    var playerId = String(body.playerId || '')
    var token = String(body.token || '')
    var meRows = await db.$queryRawUnsafe('SELECT * FROM BattlePlayer WHERE id = ? AND roomId = ? LIMIT 1', playerId, room.id)
    if (!meRows || meRows.length === 0) {
      return NextResponse.json({ ok: false, error: 'مين انت؟ سجل في الغرفة الأول' }, { status: 403 })
    }
    var me = meRows[0]
    if (String(me.token || '') !== token) {
      return NextResponse.json({ ok: false, error: 'جلسة غير صالحة — ادخل من الأول' }, { status: 403 })
    }
    var isHost = !!Number(me.isHost || 0)

    /* ===== start (هوست) ===== */
    if (action === 'start') {
      if (!isHost) return NextResponse.json({ ok: false, error: 'الهوست بس اللي بيبدأ التحدي' }, { status: 403 })
      if (room.status !== 'lobby') return NextResponse.json({ ok: true, already: true })
      await safeWrite(function () {
        return db.$executeRawUnsafe("UPDATE BattleRoom SET status = 'live', currentIndex = 0, questionStartAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?", String(Date.now()), room.id)
      })
      return NextResponse.json({ ok: true })
    }

    /* ===== answer ===== */
    if (action === 'answer') {
      if (room.status !== 'live') return NextResponse.json({ ok: false, error: 'التحدي مش شغال دلوقتي' }, { status: 409 })
      var idx = Number(body.questionIndex)
      if (idx !== Number(room.currentIndex)) {
        return NextResponse.json({ ok: false, error: 'السؤال اتغير — كمل على اللي بعده' }, { status: 409 })
      }
      var q = questions[idx]
      if (!q) return NextResponse.json({ ok: false, error: 'سؤال غير موجود' }, { status: 404 })
      var limitMs = Math.max(8, Number(q.timeLimitSec || 25)) * 1000
      var elapsed = Date.now() - Number(room.questionStartAt || 0)
      if (elapsed > limitMs) {
        return NextResponse.json({ ok: false, error: 'الوقت خلص على السؤال ده' }, { status: 409 })
      }
      var answersObj = {}
      try { answersObj = JSON.parse(String(me.answers || '{}')) } catch (e) {}
      if (answersObj[String(idx)]) {
        return NextResponse.json({ ok: false, error: 'جاوبت في السؤال ده قبل كذا' }, { status: 409 })
      }
      var choice = Number(body.choice)
      var ms = Math.max(0, Math.min(Number(body.ms) || elapsed, elapsed))
      var correct = choice === Number(q.correctIndex) ? 1 : 0
      var gained = 0
      var streak = Number(me.streak || 0)
      if (correct) {
        var remainFrac = Math.max(0, 1 - ms / limitMs)
        gained = 60 + Math.round(40 * remainFrac)
        streak = streak + 1
        if (streak >= 3) gained += 15 // بونص الستريك — تلات إجابات صح ورا بعض
      } else {
        streak = 0
      }
      answersObj[String(idx)] = { choice: choice, correct: correct, gained: gained, ms: ms }
      await safeWrite(function () {
        return db.$executeRawUnsafe('UPDATE BattlePlayer SET answers = ?, score = score + ?, streak = ?, lastSeen = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', JSON.stringify(answersObj), gained, streak, String(Date.now()), me.id)
      })
      return NextResponse.json({
        ok: true,
        correct: !!correct,
        gained: gained,
        streak: streak,
        correctIndex: Number(q.correctIndex), // للطالب اللي جاوب — محدش تاني بيشوفها
      })
    }

    /* ===== next (هوست) — تخطي يدوي لو الكل جاوب ===== */
    if (action === 'next') {
      if (!isHost) return NextResponse.json({ ok: false, error: 'الهوست بس' }, { status: 403 })
      var nextIdx = Number(room.currentIndex) + 1
      if (nextIdx >= questions.length) {
        await safeWrite(function () { return db.$executeRawUnsafe("UPDATE BattleRoom SET status = 'ended', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", room.id) })
      } else {
        await safeWrite(function () { return db.$executeRawUnsafe('UPDATE BattleRoom SET currentIndex = ?, questionStartAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', nextIdx, String(Date.now()), room.id) })
      }
      return NextResponse.json({ ok: true })
    }

    /* ===== end (هوست) ===== */
    if (action === 'end') {
      if (!isHost) return NextResponse.json({ ok: false, error: 'الهوست بس' }, { status: 403 })
      await safeWrite(function () { return db.$executeRawUnsafe("UPDATE BattleRoom SET status = 'ended', updatedAt = CURRENT_TIMESTAMP WHERE id = ?", room.id) })
      return NextResponse.json({ ok: true })
    }

    /* ===== leave ===== */
    if (action === 'leave') {
      await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM BattlePlayer WHERE id = ?', me.id) })
      // لو الهوست مشي قبل ما يبدأ → أول تاني بقي هوست
      if (isHost && room.status === 'lobby') {
        var rest = await db.$queryRawUnsafe('SELECT id FROM BattlePlayer WHERE roomId = ? ORDER BY lastSeen ASC LIMIT 1', room.id)
        if (rest && rest.length > 0) {
          await safeWrite(function () { return db.$executeRawUnsafe('UPDATE BattlePlayer SET isHost = 1 WHERE id = ?', rest[0].id) })
          await safeWrite(function () { return db.$executeRawUnsafe('UPDATE BattleRoom SET hostPlayerId = ? WHERE id = ?', rest[0].id, room.id) })
        }
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'أكشن غير معروف' }, { status: 400 })
  } catch (e: any) {
    console.error('[arena/room POST] failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في تنفيذ الطلب' }, { status: 500 })
  }
}
