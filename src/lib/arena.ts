// @ts-nocheck
// ============================================================
// FILE: src/lib/arena.ts
// PURPOSE: (2026-و66) أدوات مشتركة لساحة التحدي والخرائط الذهنية:
//   • ensureArenaTables — ضمان جداول الساحة (BattleRoom/BattlePlayer/
//     TeacherChallenge/ChallengeEntry/FlashcardScore/MindMap) على Turso
//     بنفس نمط المشروع (ممنوع db:push — ensureSchema تتحمل كل حاجة)
//   • مولدات كود الغرفة والمعرفات
// كاش مستوى الموديول: الـ DDL مرة واحدة لكل instance (زي باقي المنصة)
// ============================================================

import { ensureSchema, makeLibsqlClient } from '@/lib/ensure-schema'

var _arenaReady: Promise<void> | null = null

export function ensureArenaTables(): Promise<void> {
  if (!_arenaReady) {
    _arenaReady = (async function () {
      try {
        var client = makeLibsqlClient()
        if (client) {
          try { await ensureSchema(client) } finally { try { await client.close() } catch (e2) {} }
        }
      } catch (e) {}
    })()
  }
  return _arenaReady
}

/* ترميز أكواد الغرف بدون حروف متشابهة (بدون O/0 و I/1) */
export var CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function makeRoomCode(): string {
  var s = ''
  for (var i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  return s
}

export function makeId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function makeToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
