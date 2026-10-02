// @ts-nocheck
// FILE: src/app/api/admin/fix-unicode/route.ts
// ROUTE: POST /api/admin/fix-unicode?adminId=...
// (U-1 — شكوى المستر: «الأسئلة ظهرت u221b48 / Xu222aY / a u2208 ]2,5[»)
// ============================================================
// PURPOSE: تصليح تلقائي واحد-كليك لكل الأسئلة المخزنة — بيفك رموز
//          يونيكود الماث اللي الموديل كتبها كـ \uXXXX (أو الباك سلاش
//          بتاعها اتاكل خلاص: u221b) وترجّعها الرموز الحقيقية:
//              u221b / \u221b → ∛      u222a → ∪      u2229 → ∩
//              u2208 → ∈               u03c0 → π      221a → √ …
//          من غير إعادة استخراج ومن غير أي مساس بحلول الطلاب أو نتايجهم —
//          نفس دالة repairCorruptMath اللي بترمّر كل النصوص وقت العرض
//          (يعني التصليح مطابق 100% لما الطالب شايفه) — بس هنا بنكتب
//          النتيجة في القاعدة كمان عشان التصحيح الذكي وواتساب الأهل
//          يقراو النص النضيف.
// الجداول الممسوحة: Exam.questions + Exam.models، Homework.questions،
//   HomeworkResult.answers، Book.questionsJson، TeacherChallenge.question+options،
//   BattleRoom.questions
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'
import { isAdmin } from '@/lib/video-guard'
import { repairCorruptMath } from '@/lib/math-text'

export const runtime = 'nodejs'
export const maxDuration = 120

/* تطبيق التصليح على كل سترينج جوه أي قيمة JSON (بعمق — شامل جداول
   الأسئلة وخلايا {t:"…"} والاختيارات والإجابات النموذجية) */
function deepRepair(v: any): any {
  if (typeof v === 'string') return repairCorruptMath(v)
  if (Array.isArray(v)) return v.map(deepRepair)
  if (v && typeof v === 'object') {
    var out: any = {}
    for (var k in v) out[k] = deepRepair(v[k])
    return out
  }
  return v
}

/* تصليح عمود JSON مخزّن — بيرجّع النص الجديد وهل اتغير فعلًا.
   المقارنة بين نسخة مصلّحة ونسخة مفسّرة (مش النص الخام) عشان فروق
   المسافات/التنسيق في التخزين ما تحسبش «تغيير» زيادة */
function repairJsonColumn(raw: string): { text: string; changed: boolean } {
  var s = String(raw || '')
  if (!s.trim()) return { text: s, changed: false }
  var parsed: any
  try { parsed = JSON.parse(s) } catch (e) {
    var fixedPlain = repairCorruptMath(s)
    return { text: fixedPlain, changed: fixedPlain !== s }
  }
  var fixed = deepRepair(parsed)
  var changed = JSON.stringify(fixed) !== JSON.stringify(parsed)
  return { text: JSON.stringify(fixed), changed: changed }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = new URL(request.url).searchParams.get('adminId')
    const admin = await isAdmin(adminId)
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    var fixed: Record<string, number> = {}
    var bump = function (k: string, n: number) { if (n > 0) fixed[k] = (fixed[k] || 0) + n }

    /* 1) الامتحانات: questions + models (نماذج أ/ب العشوائية) */
    try {
      var exams = await db.exam.findMany({ select: { id: true, questions: true, models: true } })
      for (var ei = 0; ei < exams.length; ei++) {
        var ex = exams[ei]
        var qFix = repairJsonColumn(ex.questions)
        var mFix = repairJsonColumn(ex.models)
        if (qFix.changed || mFix.changed) {
          var examId = ex.id
          var qText = qFix.text
          var mText = mFix.text
          await safeWrite(function () {
            return db.exam.update({ where: { id: examId }, data: { questions: qText, models: mText } })
          })
          bump('امتحانات', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] exams:', e && e.message) }

    /* 2) الواجبات: questions */
    try {
      var hws = await db.homework.findMany({ select: { id: true, questions: true } })
      for (var hi = 0; hi < hws.length; hi++) {
        var hw = hws[hi]
        var hFix = repairJsonColumn(hw.questions)
        if (hFix.changed) {
          var hwId = hw.id
          var hText = hFix.text
          await safeWrite(function () {
            return db.homework.update({ where: { id: hwId }, data: { questions: hText } })
          })
          bump('واجبات', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] homework:', e && e.message) }

    /* 3) نتايج الواجبات المخزنة (لقطات الأسئلة/الإجابات في واتساب الأهل) */
    try {
      var hres = await db.homeworkResult.findMany({ select: { id: true, answers: true } })
      for (var ri = 0; ri < hres.length; ri++) {
        var hr = hres[ri]
        var rFix = repairJsonColumn(hr.answers)
        if (rFix.changed) {
          var hrId = hr.id
          var rText = rFix.text
          await safeWrite(function () {
            return db.homeworkResult.update({ where: { id: hrId }, data: { answers: rText } })
          })
          bump('نتايج واجبات', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] homework results:', e && e.message) }

    /* 4) الكتب والملازم: questionsJson (الأسئلة المستخرجة المحفوظة على الكتاب) */
    try {
      var books = await db.book.findMany({ select: { id: true, questionsJson: true } })
      for (var bi = 0; bi < books.length; bi++) {
        var bk = books[bi]
        var bFix = repairJsonColumn(bk.questionsJson)
        if (bFix.changed) {
          var bkId = bk.id
          var bText = bFix.text
          await safeWrite(function () {
            return db.book.update({ where: { id: bkId }, data: { questionsJson: bText } })
          })
          bump('كتب', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] books:', e && e.message) }

    /* 5) تحديات المستر: question نص عادي + options JSON */
    try {
      var challenges = await db.teacherChallenge.findMany({ select: { id: true, question: true, options: true } })
      for (var ci = 0; ci < challenges.length; ci++) {
        var ch = challenges[ci]
        var cFixQ = repairJsonColumn(ch.question)
        var cFixO = repairJsonColumn(ch.options)
        if (cFixQ.changed || cFixO.changed) {
          var chId = ch.id
          var cqText = cFixQ.text
          var coText = cFixO.text
          await safeWrite(function () {
            return db.teacherChallenge.update({ where: { id: chId }, data: { question: cqText, options: coText } })
          })
          bump('تحديات', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] challenges:', e && e.message) }

    /* 6) غرف الباتل: questions */
    try {
      var rooms = await db.battleRoom.findMany({ select: { id: true, questions: true } })
      for (var li = 0; li < rooms.length; li++) {
        var rm = rooms[li]
        var rmFix = repairJsonColumn(rm.questions)
        if (rmFix.changed) {
          var rmId = rm.id
          var rmText = rmFix.text
          await safeWrite(function () {
            return db.battleRoom.update({ where: { id: rmId }, data: { questions: rmText } })
          })
          bump('باتل', 1)
        }
      }
    } catch (e) { console.error('[fix-unicode] battle rooms:', e && e.message) }

    var total = 0
    for (var k in fixed) total += fixed[k]
    console.log('[fix-unicode] done by admin', adminId, '— fixed rows:', total, JSON.stringify(fixed))
    return NextResponse.json({ success: true, fixed: fixed, total: total })

  } catch (error) {
    console.error('fix-unicode error:', error)
    return NextResponse.json({ error: 'Error: ' + ((error && error.message) || 'Unknown') }, { status: 500 })
  }
}
