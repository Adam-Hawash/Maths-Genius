// ============================================================
// /api/admin/db-cleanup — (2026-و81) أداة تنظيف قاعدة البيانات
// ============================================================
// سبب وجودها: مسح الطلاب/الفيديوهات القديم كان بيسيب صفوف يتيمة
// في كل الجداول المرتبطة (StudentActivity وExamResult وVideoProgress...)
// فقاعدة البيانات اتضخمت بسرعة. أداة لوحة الأدمن بتعدّ الصفوف اليتيمة
// وبتقدر تمسحها نهائيًا + زرار VACUUM لضغط ملف الداتابيز.
//
// POST /api/admin/db-cleanup            → { dryRun } فحص بدون حذف (افتراضي)
// POST /api/admin/db-cleanup?vacuum=1   → تنفيذ VACUUM (فحص + ضغط)
// Body: { adminId, dryRun? } — نفس نمط auth الأدمن (adminId + isAdmin
// زي /api/videos و /api/groups بالظبط).
//
// Response: { ok: true, dryRun, results: [{ table, found, deleted }], vacuum? }
//   — deleted = 0 دايمًا في وضع الفحص (dryRun)، وفي وضع الحذف = عدد الصفوف
//     اللي اتمسحت فعلًا من كل جدول.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { makeLibsqlClient } from '@/lib/ensure-schema'
import { isAdmin } from '@/lib/video-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* جداول بعمود studentId — الصفوف اللي studentId بتاعها مش موجود في Student = يتيمة.
   guard='' معناها العمود ممكن يكون نص فاضي (DEFAULT "") في الداتابيز —
   فبنستثنيه من فحص اليتيمة عشان ما نمسحش صفوف طلاب غير مسجلين بالمحتوى الفاضي
   (تذاكر تشغيل زوار، دخولات تحدي بدون حساب، إلخ). */
var STUDENT_ORPHANS: Array<{ table: string; guard: boolean }> = [
  { table: 'StudentActivity', guard: false },
  { table: 'ExamResult', guard: false },
  { table: 'HomeworkResult', guard: false },
  { table: 'VideoProgress', guard: false },
  { table: 'VideoAccess', guard: false },
  { table: 'Payment', guard: false },
  { table: 'Notification', guard: false },
  { table: 'Discussion', guard: false },
  { table: 'PlayTicket', guard: true },
  { table: 'Complaint', guard: true },
  { table: 'ChallengeEntry', guard: true },
  { table: 'ChallengeAttempt', guard: true },
  { table: 'FlashcardScore', guard: true },
  { table: 'BattlePlayer', guard: true },
]

/* جداول بعمود videoId — صفوف فيديوهات اتمسحت (المستثنى الوحيد MindMap
   لأن videoId عنده DEFAULT "" — خريطة نصية مش مربوطة بفيديو). */
var VIDEO_ORPHANS: Array<{ table: string; guard: boolean }> = [
  { table: 'VideoProgress', guard: false },
  { table: 'VideoAccess', guard: false },
  { table: 'VideoGroupSchedule', guard: false },
  { table: 'PlayTicket', guard: false },
  { table: 'MindMap', guard: true },
]

type RuleResult = { table: string; found: number; deleted: number; err?: string }

async function runOrphanRule(
  sqlTable: string,
  display: string,
  where: string,
  dryRun: boolean
): Promise<RuleResult> {
  var found = 0
  var deleted = 0
  try {
    var cRows: any[] = await db.$queryRawUnsafe('SELECT COUNT(*) AS c FROM ' + sqlTable + ' WHERE ' + where)
    found = Number((cRows && cRows[0] && cRows[0].c) || 0)
    if (!dryRun && found > 0) {
      deleted = await db.$executeRawUnsafe('DELETE FROM ' + sqlTable + ' WHERE ' + where)
      deleted = Number(deleted) || 0
    }
    return { table: display, found, deleted }
  } catch (e: any) {
    // الجدول ممكن يكون مش موجود في داتابيز قديمة — بنسجل الخطأ ونكمل
    return { table: display, found, deleted, err: String((e && e.message) || e).slice(0, 200) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    var body: any = {}
    try { body = await request.json() } catch (e) {}

    // نفس نمط auth الأدمن في المشروع (adminId من البودي أو الكويري)
    var adminId = String((body && body.adminId) || searchParams.get('adminId') || '')
    if (!(await isAdmin(adminId))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    /* (2026-و84) إصلاح منطق معكوس كان في و81: الواجهة بتبعت dryRun:true للفحص
       وdryRun:false للحذف الفعلي — الفورمولا القديم كان بياخدهم بالعكس
       (الفحص بيمسح والحذف بيفحص!). الصح: افتراضي فحص، والحذف بس لما
       dryRun=false ييجي صريح من البودي أو ?dryRun=0 */
    var dryRun = !((body && body.dryRun === false) || searchParams.get('dryRun') === '0')
    var wantVacuum = searchParams.get('vacuum') === '1'

    var results: RuleResult[] = []

    // ===== (1) صفوف الطلاب اليتيمة — studentId مش في Student =====
    for (var si = 0; si < STUDENT_ORPHANS.length; si++) {
      var so = STUDENT_ORPHANS[si]
      var cond = 'studentId NOT IN (SELECT id FROM Student)'
      if (so.guard) cond = "studentId != '' AND " + cond
      results.push(await runOrphanRule(so.table, so.table, cond, dryRun))
    }

    // ===== (2) صفوف الفيديوهات اليتيمة — videoId مش في Video =====
    for (var vi = 0; vi < VIDEO_ORPHANS.length; vi++) {
      var vo = VIDEO_ORPHANS[vi]
      var vcond = 'videoId NOT IN (SELECT id FROM Video)'
      if (vo.guard) vcond = "videoId != '' AND " + vcond
      results.push(await runOrphanRule(vo.table, vo.table, vcond, dryRun))
    }

    // ===== (3) نتايج امتحانات/واجبات اتمسحت =====
    results.push(await runOrphanRule('ExamResult', 'ExamResult (examId يتيم)', 'examId NOT IN (SELECT id FROM Exam)', dryRun))
    results.push(await runOrphanRule('HomeworkResult', 'HomeworkResult (homeworkId يتيم)', 'homeworkId NOT IN (SELECT id FROM Homework)', dryRun))

    // ===== (4) أولياء الأمور اليتيمة =====
    // روابط أبناء لحسابات أب اتمسحت أو طلاب اتمسحوا (و80: الأب بعدة أبناء)
    results.push(await runOrphanRule(
      'ParentStudent',
      'ParentStudent',
      'parentId NOT IN (SELECT id FROM Parent) OR studentId NOT IN (SELECT id FROM Student)',
      dryRun
    ))
    // حساب أب أصله طالب اتمسح (الأب مربوط بحساب ابنه بـ studentId)
    results.push(await runOrphanRule('Parent', 'Parent', 'studentId NOT IN (SELECT id FROM Student)', dryRun))

    // ===== (2026-و84) شكاوى اتحلت — طلب المستر: الشكوى بعد حلها تتمسح
    // من صفحة الأدمن. من النهاردة الـ PATCH بيحذفها لحظة الحل، والقاعدة
    // دي بتلم المخزون القديم (المحلولة = الطالب واخد إشعار الحل والرد)
    results.push(await runOrphanRule(
      'Complaint',
      'Complaint (شكاوى اتحلت)',
      "status = 'resolved'",
      dryRun
    ))

    // ===== (2026-و85) غرف التحدي القديمة — طلب المستر: «التحدي يتمسح
    // بعديها بيوم عشان الطالب لو يقدر يجي يشوف درجته هو وزمايله».
    // sweepArena بيمسحها أوتوماتيك من المنصة، والقاعدة دي بتلم المخزون
    // القديم من الأدمن كمان. درجات جلسة اللعب مؤقتة في BattlePlayer بس —
    // مش درجات امتحان/واجب (ExamResult/HomeworkResult/PointsLedger) فآمنة.
    try {
      var dayCut = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
      var roomWhere = "(status IN ('ended','finished') AND updatedAt < '" + dayCut + "') OR createdAt < '" + dayCut + "'"
      results.push(await runOrphanRule('BattleRoom', 'BattleRoom (غرف تحدي أكتر من يوم)', roomWhere, dryRun))
      results.push(await runOrphanRule('BattlePlayer', 'BattlePlayer (لاعبو غرف تحدي اتمسحت)', 'roomId NOT IN (SELECT id FROM BattleRoom)', dryRun))
    } catch (e: any) {
      results.push({ table: 'BattleRoom (غرف تحدي قديمة)', found: 0, deleted: 0, err: String((e && e.message) || e).slice(0, 200) })
    }

    // ===== (5) تذاكر تشغيل منتهية الصلاحية =====
    // expiresAt بصيغة Prisma DateTime — بنستخدم موديل Prisma نفسه عشان
    // المقارنة تبقى بنفس ترميز التواريخ المكتوب في الداتابيز بالظبط
    try {
      var expiredCount = await db.playTicket.count({ where: { expiresAt: { lt: new Date() } } })
      var expiredDeleted = 0
      if (!dryRun && expiredCount > 0) {
        var delRes = await db.playTicket.deleteMany({ where: { expiresAt: { lt: new Date() } } })
        expiredDeleted = delRes.count || 0
      }
      results.push({ table: 'PlayTicket (تذاكر منتهية)', found: expiredCount, deleted: expiredDeleted })
    } catch (e: any) {
      results.push({ table: 'PlayTicket (تذاكر منتهية)', found: 0, deleted: 0, err: String((e && e.message) || e).slice(0, 200) })
    }

    // ===== (2026-و82) ملفات Media اليتيمة — كان أكبر مصدر تضخم في الداتابيز =====
    // كل الملفات (صور حلول، فيديوهات، PDF، صور مصغرة) بتتخزن في جدول Media.
    // ملف مش معروف في أي صف تاني (فيديو/امتحان/واجب/نتيجة/كتاب/معرض/إيصال...)
    // = يتيمة اتشالت من المنصة وصفوفها اتمسحت بس الملف نفسه فضل. بنعمل
    // «قش» واحد بكل النصوص من كل الجداول التانية وبندوّر على كل معرف Media
    // فيه — اللي ملقيناش له أي ذكر بنحسبه يتيمة.
    try {
      var mediaRows: any[] = await db.$queryRawUnsafe('SELECT id FROM Media')
      var mIds: string[] = mediaRows.map(function (r: any) { return String(r.id) })
      var tRows: any[] = await db.$queryRawUnsafe(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'libsql_%'"
      )
      var tNames: string[] = tRows.map(function (r: any) { return String(r.name) }).filter(function (t) { return t !== 'Media' })
      var hay = ''
      for (var hi = 0; hi < tNames.length; hi++) {
        try {
          var hRows: any[] = await db.$queryRawUnsafe('SELECT * FROM "' + tNames[hi] + '"')
          for (var hr = 0; hr < hRows.length; hr++) {
            var rowObj = hRows[hr]
            for (var hk in rowObj) {
              var hv = rowObj[hk]
              if (typeof hv === 'string' && hv.length > 0) hay += hv + '\n'
            }
          }
        } catch (e) { /* جدول ناقص في داتابيز قديمة — نكمل */ }
      }
      var orphanMedia: string[] = mIds.filter(function (mid) { return hay.indexOf(mid) === -1 })
      var orphanMediaDeleted = 0
      if (!dryRun && orphanMedia.length > 0) {
        for (var oi = 0; oi < orphanMedia.length; oi += 50) {
          var oChunk = orphanMedia.slice(oi, oi + 50)
            .filter(function (x) { return /^c[a-z0-9]{14,}$/i.test(x) })
            .map(function (x) { return "'" + x + "'" })
          if (oChunk.length === 0) continue
          try {
            orphanMediaDeleted += await db.$executeRawUnsafe('DELETE FROM Media WHERE id IN (' + oChunk.join(',') + ')')
          } catch (e) { /* دفعة فشلت — نكمل الباقي */ }
        }
      }
      results.push({ table: 'Media (ملفات يتيمة — الأكبر تضخمًا)', found: orphanMedia.length, deleted: orphanMediaDeleted })
    } catch (e: any) {
      results.push({ table: 'Media (ملفات يتيمة)', found: 0, deleted: 0, err: String((e && e.message) || e).slice(0, 200) })
    }

    // ===== VACUUM (اختياري — ?vacuum=1) =====
    var vacuum: any = null
    if (wantVacuum) {
      try {
        await db.$executeRawUnsafe('VACUUM')
        vacuum = { attempted: true, ok: true, via: 'prisma' }
      } catch (e1: any) {
        try {
          var lc = makeLibsqlClient()
          if (!lc) throw new Error('لا يوجد إعدادات Turso/DATABASE_URL لعميل libsql')
          await lc.execute('VACUUM')
          vacuum = { attempted: true, ok: true, via: 'libsql' }
        } catch (e2: any) {
          vacuum = { attempted: true, ok: false, error: String((e2 && e2.message) || e2).slice(0, 300) }
        }
      }
    }

    return NextResponse.json({ ok: true, dryRun, results, vacuum })
  } catch (error: any) {
    console.error('db-cleanup error:', error)
    return NextResponse.json({ error: String((error && error.message) || error) }, { status: 500 })
  }
}
