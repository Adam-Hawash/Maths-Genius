// @ts-nocheck
// ============================================================
// (2026-و67) GET /api/exams/seq-check?kind=exam|homework&id=xxx&studentId=yyy
// ============================================================
// حكم السيرفر هو الفيصل في قفل التسلسل — نفس الدالة اللي بترفض التسليم
// بالظبط (sequential-guard). سبب وجوده: العميل بيبني سلسلته المحلية
// (exams/homework اللي وصلته) وأي اختلاف لحظي بين قايمته وقايمة السيرفر
// كان بيعمل «قفل كاذب» على طالب سلّم فعلاً. دلوقتي زرار «مقفول» يسأل
// السيرفر الأول:
//   ok=true  → الطالب سلّم اللي قبله فعلًا → العميل يفتح فورًا
//   ok=false → مقفول بجد → رسالة السيرفر (باسم العنصر اللي ناقص)
// نفس فلسفة الحارس: أي خطأ/مدخلات ناقصة → فتح (ممنوع نقفل طالب بريء).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { checkExamSequential, checkHwSequential } from '@/lib/sequential-guard'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    var sp = new URL(request.url).searchParams
    var kind = sp.get('kind') === 'homework' ? 'homework' : 'exam'
    var id = String(sp.get('id') || '')
    var studentId = String(sp.get('studentId') || '')
    if (!id || !studentId) return NextResponse.json({ ok: true, reason: '' })
    var res = kind === 'homework'
      ? await checkHwSequential(id, studentId)
      : await checkExamSequential(id, studentId)
    return NextResponse.json({ ok: !!res.ok, reason: String(res.reason || ''), code: Number(res.code || 0) })
  } catch (e) {
    /* fail-open — نفس قرار الحارس: أي خطأ داخلي ممنوع يقفل طالب بريء */
    return NextResponse.json({ ok: true, reason: '' })
  }
}
