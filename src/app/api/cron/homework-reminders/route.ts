// ============================================================
// (Z-30) تذكير الـ 24 ساعة للواجبات والامتحانات غير المسلّمة —
// طلب المستر الحرفي: «لو عدى 24 ساعة على الواجب أو الامتحان يجي
// يشعر لولي الأمر والطالب إن في اشعار بالواجب ولازم يتسلم».
//
// الكرون على Vercel بينادي الراوت ده مرة كل يوم (vercel.json crons
// — 6 مساءً UTC = 8/9 مساءً بتوقيت القاهرة) — وكل طالب بياخد تذكير
// واحد بس لكل واجب/امتحان (جدول ReminderSent بيمنع التكرار).
//
// الحماية: ?key= لازم تطابق المفتاح الثابت تحت — نفس المفتاح متكتب
// في مسار الكرون في vercel.json. غير كده 403.
//
// لكل طالب مستهدف وما سلّمش:
//   1) إشعار داخلي في بورتال الطالب (جدول Notification)
//   2) إشعار لولي الأمر: صف داخلي في parent_notifications + Web Push
//      حقيقي على موبايله (ParentPushSubscription)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifyStudent } from '@/lib/notify'
import { notifyParentOfPendingReminder } from '@/lib/parent-notify'

/* ✏️ مفتاح الحماية — نفس القيمة متكتبة في vercel.json → crons → path */
var CRON_KEY = 'MG-rm2026-9f4kz27'

/* سقف أمان — أقصى عدد تذكيرات في التشغيلة الواحدة (ضد أي انفجار بيانات) */
var MAX_REMINDERS_PER_RUN = 300

var _rsTableReady = false
async function ensureReminderSentTable(force?: boolean): Promise<void> {
  if (_rsTableReady && !force) return
  try {
    await db.$executeRawUnsafe("CREATE TABLE IF NOT EXISTS ReminderSent (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL DEFAULT '', itemId TEXT NOT NULL DEFAULT '', studentId TEXT NOT NULL DEFAULT '', sentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(kind, itemId, studentId))")
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_rs_item ON ReminderSent(kind, itemId)') } catch (e) {}
    _rsTableReady = true
  } catch (e) {
    console.error('[cron-reminders] ensure table failed (ignored):', e)
  }
}

/* استهداف الطلاب لواحد واجب/امتحان — نفس منطق الظهور في مسارات القراءة:
   targetStudentIds لو مش فاضية، وإلا الطلاب في targetGroupIds، وإلا
   كل طلاب الصف المفعّلين */
async function resolveTargetStudents(kind: string, item: any): Promise<string[]> {
  var parseIds = function (raw: any): string[] {
    try {
      var arr = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!Array.isArray(arr)) return []
      var out: string[] = []
      for (var i = 0; i < arr.length; i++) {
        var v = String(arr[i] == null ? '' : arr[i]).trim()
        if (v && out.indexOf(v) === -1) out.push(v)
      }
      return out
    } catch (e) { return [] }
  }

  var ids = parseIds(item.targetStudentIds)
  if (ids.length) return ids

  var gids = parseIds(item.targetGroupIds)
  if (gids.length) {
    try {
      var ph = gids.map(function () { return '?' }).join(',')
      var rows: any = await db.$queryRawUnsafe("SELECT id FROM Student WHERE status IN ('approved','paid') AND groupId IN (" + ph + ')', ...gids)
      return (rows || []).map(function (r: any) { return String(r.id) })
    } catch (eG) {}
  }

  try {
    var gradeRows: any = await db.$queryRawUnsafe("SELECT id FROM Student WHERE status IN ('approved','paid') AND grade = ?", String(item.grade || ''))
    return (gradeRows || []).map(function (r: any) { return String(r.id) })
  } catch (eAll) {
    return []
  }
}

/* الطلاب اللي سلّموا فعلًا — بنستبعدهم من التذكير */
async function submittedStudentIds(kind: string, itemId: string): Promise<Set<string>> {
  var out = new Set<string>()
  try {
    var table = kind === 'exam' ? 'ExamResult' : 'HomeworkResult'
    var col = kind === 'exam' ? 'examId' : 'homeworkId'
    var rows: any = await db.$queryRawUnsafe('SELECT studentId FROM ' + table + ' WHERE ' + col + ' = ?', String(itemId))
    for (var i = 0; i < (rows || []).length; i++) out.add(String(rows[i].studentId))
  } catch (e) {}
  return out
}

/* سبق إرسال تذكير للطالب ده على العنصر ده؟ */
async function alreadyReminded(kind: string, itemId: string, studentId: string): Promise<boolean> {
  try {
    var rows: any = await db.$queryRawUnsafe('SELECT id FROM ReminderSent WHERE kind = ? AND itemId = ? AND studentId = ? LIMIT 1', kind, String(itemId), String(studentId))
    return !!(rows && rows.length)
  } catch (e) {
    return false
  }
}

async function markReminded(kind: string, itemId: string, studentId: string): Promise<void> {
  try {
    await db.$executeRawUnsafe('INSERT INTO ReminderSent (kind, itemId, studentId, sentAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', kind, String(itemId), String(studentId))
  } catch (e) {
    /* تكرار UNIQUE = سبق الإرسال — مقبول */
  }
}

async function sweepKind(kind: string): Promise<{ items: number; reminded: number }> {
  var table = kind === 'exam' ? 'Exam' : 'Homework'
  var out = { items: 0, reminded: 0 }
  /* العناصر: اتعملت من أكتر من 24 ساعة + موعد الظهور عدى (لو موجود) */
  var items: any = []
  try {
    items = await db.$queryRawUnsafe(
      'SELECT id, title, grade, targetStudentIds, targetGroupIds, scheduledAt FROM ' + table +
      " WHERE createdAt <= datetime('now', '-24 hours') AND (scheduledAt IS NULL OR scheduledAt = '' OR scheduledAt <= datetime('now')) ORDER BY createdAt DESC LIMIT 50"
    )
  } catch (e) {
    console.error('[cron-reminders] fetch ' + kind + ' failed (ignored):', e)
    return out
  }
  items = items || []

  for (var i = 0; i < items.length && out.reminded < MAX_REMINDERS_PER_RUN; i++) {
    var item = items[i]
    if (!item || !item.id) continue
    var targets = await resolveTargetStudents(kind, item)
    if (!targets.length) continue
    var submitted = await submittedStudentIds(kind, String(item.id))
    var pending: string[] = []
    for (var s = 0; s < targets.length; s++) {
      var sid = targets[s]
      if (submitted.has(sid)) continue
      if (await alreadyReminded(kind, String(item.id), sid)) continue
      pending.push(sid)
    }
    if (!pending.length) continue
    out.items++
    for (var p = 0; p < pending.length && out.reminded < MAX_REMINDERS_PER_RUN; p++) {
      var studentId = pending[p]
      try {
        var title = String(item.title || (kind === 'exam' ? 'امتحان' : 'واجب'))
        if (kind === 'exam') {
          await notifyStudent(studentId, 'exam_reminder', '⏰ تذكير: امتحان «' + title + '» لسه متحلّش — لازم تدخل وتسلّمه', 'عدى أكتر من 24 ساعة على الامتحان من غير تسليم — دخول من تاب الامتحانات وحلّه دلوقتي')
        } else {
          await notifyStudent(studentId, 'homework_reminder', '⏰ تذكير: واجب «' + title + '» لسه مسلّمش — لازم يتسلم في أقرب وقت', 'عدى أكتر من 24 ساعة على الواجب من غير تسليم — دخول من تاب الواجبات وسلّمه دلوقتي')
        }
        await notifyParentOfPendingReminder({ studentId: studentId, kind: kind === 'exam' ? 'exam' : 'homework', title: title })
        await markReminded(kind, String(item.id), studentId)
        out.reminded++
      } catch (eOne) {
        console.error('[cron-reminders] one reminder failed (ignored):', eOne)
      }
    }
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    /* حماية بمفتاح — الكرون الرسمي بيدي المفتاح في الـ query */
    var url = new URL(request.url)
    var key = String(url.searchParams.get('key') || '')
    if (key !== CRON_KEY) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 })
    }

    await ensureReminderSentTable()

    var hw = await sweepKind('homework')
    var ex = await sweepKind('exam')

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      homework: hw,
      exam: ex,
    })
  } catch (e: any) {
    console.error('[cron-reminders] run failed:', e)
    return NextResponse.json({ ok: false, error: e && e.message ? e.message : 'failed' }, { status: 500 })
  }
}
