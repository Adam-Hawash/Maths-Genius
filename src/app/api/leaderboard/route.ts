// @ts-nocheck
// FILE: src/app/api/leaderboard/route.ts
// PURPOSE: (2026-و16) لوحة شرف عامة — طلب المستر حرفيًا: «الصفحة الرئيسية خالص…
//   من غير تسجيل دخول — أول 3 طلاب من حيث عدد النقاط اللي معاهم».
//   • GET بدون أي توثيق — بتشتغل من صفحة الهبوط مباشرة
//   • النقاط = مجموع درجات الامتحانات (ExamResult.score) + مجموع درجات الواجبات
//     (HomeworkResult.score) — نفس أرقام لوحة الأدمن بالظبط
//   • خصوصية: ممنوع التليفون أو الإيميل أو أي بيانات شخصية — الاسم بس زي ما الطالب كاتبه
//     (2026-و21: تعديل بطلب المستر — الاسم كامل زي ما هو كاتبه مش كلمتين)
//   • الطلاب المقبولين بس (approved/paid)
//
//   (2026-و58) دفتر النقاط الدايم — طلب المستر حرفيًا:
//   «لما أنزل واجب جديد أو امتحان جديد النقط ما تتمسحش وتتعاد من الأول،
//    لا النقط تتضاف على الأولانية — عشان النقط تبقى كبيرة»
//   ------------------------------------------------------------
//   المشكلة: النقاط كانت بتتحسب مباشرة من ExamResult/HomeworkResult —
//   ودي جداول مربوطة بالامتحان/الواجب نفسه بحذف متسلسل (Cascade)،
//   فأول ما المستر يمسح امتحان/واجب قديم (حتى لو عشان ينزل واحد جديد
//   مكانه) كل نتايجه بتتمسح ودرجات الطلاب بتقل فجأة.
//   الحل: جدول PointsLedger — مرآة دايمة لكل نتيجة (بمعرّف النتيجة نفسه).
//   • أي نتيجة جديدة/معدلة (إعادة تصحيح/تصحيح مقالي) بتتحدّث في المرآة
//   • مسح الامتحان/الواجب **مش بيمسح** نقاطه من الدفتر — النقاط بتضل متراكمة
//   • مسح الطالب بيمسح نقاطه هو بس (عشان مفيش أشباح في الترتيب)
//   • امتحان جديد الطلاب يحلوه = نقاط جديدة بتتجمع فوق القديمة (تراكمي)

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// كاش داخلي بسيط (60 ثانية) — الصفحة الرئيسية بتتفتح كتير ومفيش داعي نضرب
// الداتابيز بكل زيارة. نفس نمط الكاش المحلي في باقي المنصة.
var CACHE_TTL_MS = 60000
var cachedAt = 0
var cachedRows: any[] | null = null

// إنشاء جدول الدفتر لو مش موجود (نفس نمط ensureTable في باقي المنصة)
async function ensureLedgerTable() {
  await db.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS PointsLedger (' +
    'resultId TEXT PRIMARY KEY, ' +
    'studentId TEXT NOT NULL, ' +
    'kind TEXT NOT NULL, ' +
    'points REAL DEFAULT 0, ' +
    'updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP)'
  )
}

// مزامنة المرآة: أي نتيجة موجودة دلوقتي في ExamResult/HomeworkResult
// بتتكتب في الدفتر (INSERT OR REPLACE = التعديلات بتتحدث نفس الصف).
// صفوف نتايج اتمسحت من المصدر (امتحان/واجب اتشال) **بتفضل** في الدفتر عمدًا.
async function syncLedger() {
  await ensureLedgerTable()
  try {
    await db.$executeRawUnsafe(
      'INSERT OR REPLACE INTO PointsLedger (resultId, studentId, kind, points, updatedAt) ' +
      "SELECT er.id, er.studentId, 'exam', COALESCE(er.score, 0), CURRENT_TIMESTAMP " +
      'FROM ExamResult er WHERE er.studentId IS NOT NULL AND er.studentId != \'\''
    )
  } catch (e) { console.error('ledger sync exam error:', e) }
  try {
    await db.$executeRawUnsafe(
      'INSERT OR REPLACE INTO PointsLedger (resultId, studentId, kind, points, updatedAt) ' +
      "SELECT hr.id, hr.studentId, 'homework', COALESCE(hr.score, 0), CURRENT_TIMESTAMP " +
      'FROM HomeworkResult hr WHERE hr.studentId IS NOT NULL AND hr.studentId != \'\''
    )
  } catch (e) { console.error('ledger sync homework error:', e) }
  // طالب اتمسح → نقاطه تتمسح من الدفتر (ممنوع أشباح في الترتيب)
  try {
    await db.$executeRawUnsafe(
      'DELETE FROM PointsLedger WHERE studentId NOT IN (SELECT id FROM Student)'
    )
  } catch (e) { console.error('ledger ghost cleanup error:', e) }
}

export async function GET() {
  // رد الكاش لو لسه صالح
  try {
    if (cachedRows && Date.now() - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({ leaderboard: cachedRows })
    }
  } catch (e) {}

  try {
    await syncLedger()

    var rows: any[] = await db.$queryRawUnsafe(
      'SELECT s.id, s.name, s.grade, COALESCE(SUM(pl.points), 0) AS totalPoints ' +
      'FROM PointsLedger pl ' +
      'INNER JOIN Student s ON s.id = pl.studentId ' +
      "WHERE s.status IN ('approved', 'paid') " +
      'GROUP BY s.id, s.name, s.grade ' +
      'HAVING totalPoints > 0 ' +
      'ORDER BY totalPoints DESC, s.name ASC ' +
      'LIMIT 3'
    ) || []

    // تنسيق الرد: الاسم كامل زي ما الطالب كاتبه (و21 بطلب المستر) + الصف + النقاط كرقم نظيف
    var leaderboard = (rows || []).map(function (r: any) {
      var displayName = String(r.name || 'طالب').trim().replace(/\s+/g, ' ') || 'طالب'
      var total = Number(r.totalPoints) || 0
      // تقريب نظيف: صحيح لو مقدرش كسور، وإلا رقم عشري واحد
      var totalClean = Math.round(total * 10) / 10
      if (totalClean % 1 === 0) totalClean = Math.round(totalClean)
      return {
        name: displayName,
        grade: String(r.grade || ''),
        totalPoints: totalClean,
      }
    })

    cachedRows = leaderboard
    cachedAt = Date.now()

    return NextResponse.json({ leaderboard: leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    // حالة فاضية رشيقة — الصفحة بتعرض رسالة «لا يوجد طلاب بعد» بدل ما تبوظ
    return NextResponse.json({ leaderboard: [] })
  }
}
