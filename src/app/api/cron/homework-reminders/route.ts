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
import { notifyStudents } from '@/lib/notify'
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

/* (Z-30-تحسين) الطلاب اللي سبق تذكيرهم للعنصر ده — استعلام واحد مجمّع
   بدل استعلام لكل طالب (استعلامات Turso المتسلسلة كانت بتخلي التشغيلة
   تعلق على الإنتاج) */
async function remindedStudentIds(kind: string, itemId: string): Promise<Set<string>> {
  var out = new Set<string>()
  try {
    var rows: any = await db.$queryRawUnsafe('SELECT studentId FROM ReminderSent WHERE kind = ? AND itemId = ?', kind, String(itemId))
    for (var i = 0; i < (rows || []).length; i++) out.add(String(rows[i].studentId))
  } catch (e) {}
  return out
}

/* تسجيل التذكيرات المرسلة — INSERT OR IGNORE مجمّع على دفعات */
async function markRemindedBatch(kind: string, itemId: string, studentIds: string[]): Promise<void> {
  var CHUNK = 40
  for (var i = 0; i < studentIds.length; i += CHUNK) {
    var slice = studentIds.slice(i, i + CHUNK)
    var values: string[] = []
    var args: any[] = []
    for (var k = 0; k < slice.length; k++) {
      values.push('(?, ?, ?, CURRENT_TIMESTAMP)')
      args.push(kind, String(itemId), slice[k])
    }
    try {
      await db.$executeRawUnsafe('INSERT OR IGNORE INTO ReminderSent (kind, itemId, studentId, sentAt) VALUES ' + values.join(', '), ...args)
    } catch (e) {
      console.error('[cron-reminders] batch mark failed (ignored):', e)
    }
  }
}

async function sweepKind(kind: string, deadlineMs: number): Promise<{ items: number; reminded: number }> {
  var table = kind === 'exam' ? 'Exam' : 'Homework'
  var out = { items: 0, reminded: 0 }
  /* العناصر: اتعملت من أكتر من 24 ساعة + موعد الظهور عدى (لو موجود) */
  var items: any = []
  try {
    items = await db.$queryRawUnsafe(
      'SELECT id, title, grade, targetStudentIds, targetGroupIds, scheduledAt FROM ' + table +
      " WHERE createdAt <= datetime('now', '-24 hours') AND (scheduledAt IS NULL OR scheduledAt = '' OR scheduledAt <= datetime('now')) ORDER BY createdAt DESC LIMIT 25"
    )
  } catch (e) {
    console.error('[cron-reminders] fetch ' + kind + ' failed (ignored):', e)
    return out
  }
  items = items || []

  for (var i = 0; i < items.length; i++) {
    /* ميزانية زمنية — بنرجّع رد دايمًا حتى لو لسه فيه بقايا (بتاخدها تشغيلة الغد) */
    if (Date.now() > deadlineMs || out.reminded >= MAX_REMINDERS_PER_RUN) break
    var item = items[i]
    if (!item || !item.id) continue
    var targets = await resolveTargetStudents(kind, item)
    if (!targets.length) continue
    var submitted = await submittedStudentIds(kind, String(item.id))
    var reminded = await remindedStudentIds(kind, String(item.id))
    var pending: string[] = []
    for (var s2 = 0; s2 < targets.length; s2++) {
      var sid = targets[s2]
      if (submitted.has(sid) || reminded.has(sid)) continue
      pending.push(sid)
    }
    if (!pending.length) continue
    out.items++
    var title = String(item.title || (kind === 'exam' ? 'امتحان' : 'واجب'))
    var done: string[] = []
    /* 1) إشعار داخلي مجمّع للطلاب — دفعة واحدة */
    try {
      var msgTitle = kind === 'exam'
        ? '⏰ تذكير: امتحان «' + title + '» لسه متحلّش — لازم تدخل وتسلّمه'
        : '⏰ تذكير: واجب «' + title + '» لسه مسلّمش — لازم يتسلم في أقرب وقت'
      var msgBody = kind === 'exam'
        ? 'عدى أكتر من 24 ساعة على الامتحان من غير تسليم — دخول من تاب الامتحانات وحلّه دلوقتي'
        : 'عدى أكتر من 24 ساعة على الواجب من غير تسليم — دخول من تاب الواجبات وسلّمه دلوقتي'
      await notifyStudents({ studentIds: pending, type: kind === 'exam' ? 'exam_reminder' : 'homework_reminder', title: msgTitle, body: msgBody })
      done = pending.slice()
    } catch (eN) {
      console.error('[cron-reminders] student notify failed (ignored):', eN)
    }
    /* 2) إشعار ولي الأمر لكل طالب (صف داخلي + Push) — مع الالتزام بالميزانية الزمنية.
       بنسجّل بس اللي وصلهم إشعار ولي الأمر فعلًا — اللي ما وصلهمش بياخدهم
       تشغيلة الغد كاملة (إشعار الطالب الداخلي هيتكرر — مقبول) */
    var processed: string[] = []
    for (var p2 = 0; p2 < done.length; p2++) {
      if (Date.now() > deadlineMs || out.reminded >= MAX_REMINDERS_PER_RUN) break
      try {
        await notifyParentOfPendingReminder({ studentId: done[p2], kind: kind === 'exam' ? 'exam' : 'homework', title: title })
        processed.push(done[p2])
        out.reminded++
      } catch (eOne) {
        console.error('[cron-reminders] one reminder failed (ignored):', eOne)
      }
    }
    /* 3) تسجيل المرسل لهم فقط */
    if (processed.length) await markRemindedBatch(kind, String(item.id), processed)
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

    var deadline = Date.now() + 20000 /* ميزانية 20 ثانية لكل تشغيلة */
    var hw = await sweepKind('homework', deadline)
    var ex = await sweepKind('exam', deadline)

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
