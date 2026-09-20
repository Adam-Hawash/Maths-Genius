// @ts-nocheck
// ============================================================
// FILE: src/app/api/arena/rooms/route.ts
// PURPOSE: (2026-و66) تحدي الجروبات — إنشاء غرفة تحدي بكود مشترك
//   POST {name} → غرفة جديدة + اللاعب المؤسس (هوست)
//   الأسئلة بتتولد لحظة الإنشاء من المحرك الرياضي المحلي
//   (أرقام جديدة كل مرة — مفيش غرفتين بنفس الأسئلة تقريبًا)
// ============================================================

import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { ensureArenaTables, makeRoomCode, makeId } from '@/lib/arena'
import { generateBattleQuestions } from '@/lib/question-gen'

export const runtime = 'nodejs'

var ROOM_ROUNDS = 8

export async function POST(request: Request) {
  try {
    await ensureArenaTables()
    var body = await request.json().catch(function () { return ({} as any) })
    var name = String(body.name || '').trim().slice(0, 40)
    if (!name) return NextResponse.json({ ok: false, error: 'اكتب اسمك الأول يا بطل' }, { status: 400 })

    var rounds = Math.max(3, Math.min(Number(body.rounds) || ROOM_ROUNDS, 15))
    var questions = generateBattleQuestions(rounds)

    // نظافة: امسح الغرف القديمة (أقدم من 6 ساعات)
    try {
      var cutoff = Date.now() - 6 * 60 * 60 * 1000
      var old = await db.$queryRawUnsafe('SELECT id FROM BattleRoom WHERE createdAt < ?', new Date(cutoff).toISOString())
      for (var i = 0; i < (old || []).length; i++) {
        await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM BattlePlayer WHERE roomId = ?', old[i].id) })
        await safeWrite(function () { return db.$executeRawUnsafe('DELETE FROM BattleRoom WHERE id = ?', old[i].id) })
      }
    } catch (e) {}

    // كود فريد
    var code = ''
    for (var attempt = 0; attempt < 8; attempt++) {
      var cand = makeRoomCode()
      var exists = await db.$queryRawUnsafe('SELECT id FROM BattleRoom WHERE code = ? LIMIT 1', cand)
      if (!exists || exists.length === 0) { code = cand; break }
    }
    if (!code) code = makeRoomCode() + Math.floor(Math.random() * 10)

    var roomId = makeId('brm')
    var hostId = makeId('bp')
    var token = Math.random().toString(36).slice(2) + Date.now().toString(36)

    await safeWrite(function () {
      return db.$executeRawUnsafe(
        'INSERT INTO BattleRoom (id, code, title, hostPlayerId, status, questions, currentIndex, questionStartAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        roomId, code, 'تحدي ' + name, hostId, 'lobby', JSON.stringify(questions), 0, 0
      )
    })
    await safeWrite(function () {
      return db.$executeRawUnsafe(
        'INSERT INTO BattlePlayer (id, roomId, name, token, isHost, score, streak, answers, lastSeen, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, 0, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        hostId, roomId, name, token, '{}', String(Date.now())
      )
    })

    return NextResponse.json({
      ok: true,
      room: { id: roomId, code: code, status: 'lobby', totalRounds: rounds },
      me: { id: hostId, name: name, token: token, isHost: true, score: 0 },
    })
  } catch (e: any) {
    console.error('[arena/rooms] create failed:', String((e && e.message) || e))
    return NextResponse.json({ ok: false, error: 'مشكلة في إنشاء الغرفة — جرب تاني' }, { status: 500 })
  }
}
