// ============================================================
// (2026-و87) إشعارات أولياء الأمور — طلب المستر:
//   «لما الطالب يسلّم امتحان أو واجب — ولي الأمر ياخد إشعار
//    فيه اسم ابنه واسم الامتحان/الواجب ودرجته»
// ============================================================
//   - الجدول parent_notifications (بالشكل اللي اتطلب حرفيًا):
//       id INTEGER PK AUTOINCREMENT | parent_id TEXT (رقم ولي الأمر مطبّع)
//       student_name TEXT | message TEXT | is_read INTEGER 0/1 | created_at DATETIME
//   - parent_id = رقم موبايل ولي الأمر بصيغة 11 رقم (010xxxxxxxx) —
//     نفس تطبيع دخول حساب ولي الأمر، فالإشعار بيوصل لكل مستر مربوط
//     بالطالب (تليفون ولي الأمر على حسابه + حسابات Parent المدموجة و79)
//   - القوالب تحت PARENT_EXAM_TEMPLATE / PARENT_HOMEWORK_TEMPLATE —
//     تعديل كلام الرسالة بيتم من الملف ده بس (سهل ومركزي)
//   - insert متسامح: أي فشل في الإشعار **مابيبوّظش** التسليم نفسه
//
//   (2026-و88) الجزء الخارجي — طلب المستر: «الإشعار بيظهر لولي الأمر على
//   الموبايل بره، أول ما يضغط عليه يفتح التليفون ويدخله على صفحة تسجيل
//   الدخول بتاعت المنصة، وهو يسجل دخوله ويشوف الإشعار جوه المنصة —
//   يعني الاتنين»
//
//   (2026-و89) تحديث الجزء الخارجي بطلب المستر الحرفي: «الاشعار اللي هيجي
//   لولي الأمر بره مش هيجي على الواتساب — يجي زي برومبت البراوزر، ولما
//   يدوس عليه يخش على الاشعارات اللي جوه المنصة»:
//     → **Web Push حقيقي** (Service Worker + VAPID): نبعت إشعار براوزر
//       لكل جهاز اشترك لرقم ولي الأمر (ParentPushSubscription) — بيظهر
//       على شاشة الموبايل بره المنصة، وضغطة عليه بتفتح /#parent-login
//     → الاشتراك بيتم من بوب-أب «تفعيل الإشعارات» في بورتال ولي الأمر
//       (PushPermissionBanner + lib/push.ts + public/sw.js)
//     → مفيش اشتراكات = مفيش إشعار خارجي، والإشعار الداخلي شغال زي ما هو
// ============================================================
import { db } from '@/lib/db'
import { sendParentPush } from '@/lib/push'

/* ============================================================
   ✏️✏️ قوالب رسائل ولي الأمر — عدّل الكلام من هنا براحتك ✏️✏️
   المتاح في القالب:
     {student}  اسم الطالب
     {title}    اسم الامتحان أو الواجب
     {score}    الدرجة اللي جابها
     {max}      الدرجة النهائية
     {percent}  النسبة المئوية
   ملاحظة: الدرجة بتتكتب «X من Y» مش «X/Y» — عشان اتجاه العربي
   ما يقلبش الأرقام بصريًا (درس و65)
   ============================================================ */
export const PARENT_EXAM_TEMPLATE = [
  '🎓 متابعة من منصة Maths Genius',
  'الطالب/ة: {student}',
  'سلّم امتحان «{title}»',
  'الدرجة: {score} من {max} — النسبة {percent}%',
  '',
  'تقدر تشوف التفاصيل الكاملة وإجابات ابنك من حساب ولي الأمر في المنصة.',
  'Mr.Wael Khodair',
].join('\n')

export const PARENT_HOMEWORK_TEMPLATE = [
  '📝 متابعة من منصة Maths Genius',
  'الطالب/ة: {student}',
  'سلّم واجب «{title}»',
  'الدرجة: {score} من {max} — النسبة {percent}%',
  '',
  'تقدر تشوف التفاصيل الكاملة وإجابات ابنك من حساب ولي الأمر في المنصة.',
  'Mr.Wael Khodair',
].join('\n')

/* ============================================================
   ✏️✏️ قوالب الإشعار اللي بيظهر **بره على شاشة موبايل ولي الأمر**
   (Web Push — و89) — عدّل الكلام من هنا براحتك
   نفس متغيرات القوالب الداخلية — العنوان والنص اللي بيظهروا على
   شاشة القفل/النوتيفيكيشن بار، وضغطة عليهم بتفتح شاشة دخول ولي الأمر
   ============================================================ */
export const PARENT_PUSH_EXAM_TITLE = '🔔 متابعة من منصة Math Genius'
export const PARENT_PUSH_HOMEWORK_TITLE = '📝 متابعة من منصة Math Genius'
export const PARENT_PUSH_EXAM_BODY = 'الطالب/ة {student} سلّم امتحان «{title}» — الدرجة: {score} من {max} ({percent}%)'
export const PARENT_PUSH_HOMEWORK_BODY = 'الطالب/ة {student} سلّم واجب «{title}» — الدرجة: {score} من {max} ({percent}%)'

/* ============================================================
   (2026-و91) أيقونة الإشعار الخارجي بطلب المستر: «الاشعار يكون
   بالصورة بتاعة المنصة — صورة الفافيكون بتاعة المستر» — بدل الجرس
   الأصفر. بنقرا favicon_url من إعدادات المنصة (نفس الصورة اللي جنب
   لينك الموقع) — ولو مش متاحة أو SVG (متعتمش في إشعارات النظام)
   بنرجّع للأيقونة الافتراضية. الكاش لكل process — إعدادات المنصة
   مابتتغيرش كتير، وأي تعديل لوجو بيتطبق بعد أول إرسال جديد.
   ============================================================ */
function isValidNotifIcon(p: string): boolean {
  if (!p) return false
  if (/\.svg(\?.*)?$/i.test(p)) return false /* الـ SVG مش بيتعرض في إشعارات الموبايل */
  return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(p)
}

var _pushIcon = ''
export async function resolveParentPushIcon(): Promise<string> {
  if (_pushIcon) return _pushIcon
  try {
    var rows: any = await db.$queryRawUnsafe("SELECT key, value FROM SiteConfig WHERE key IN ('favicon_url','site_logo')")
    rows = rows || []
    var v = ''
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i] && rows[i].key) === 'favicon_url') { v = String((rows[i] && rows[i].value) || ''); break }
    }
    if (!isValidNotifIcon(v)) {
      v = ''
      for (var j = 0; j < rows.length; j++) {
        if (String(rows[j] && rows[j].key) === 'site_logo') { v = String((rows[j] && rows[j].value) || ''); break }
      }
    }
    if (isValidNotifIcon(v)) _pushIcon = v
  } catch (e) {}
  if (!_pushIcon) _pushIcon = '/push-icon.png'
  return _pushIcon
}

/* ملامة قالب الإشعار الخارجي (Push payload) بالقيم الحقيقية.
   (و91) tag ثابت لكل نوع — بدل Date.now() — عشان الإشعارات المتتالية
   بتستبدل بعضها في شريط الموبايل بدل ما تتكدس، وكروم مايعتبرهاش
   إشعارات مزعجة (سبام) ومانحطهاش صامتة */
export async function buildParentPushPayload(kind: 'exam' | 'homework', studentName: string, title: string, score: number, maxScore: number): Promise<{ title: string; body: string; url: string; tag: string; icon: string }> {
  var s = Number(score) || 0
  var m = Number(maxScore) || 0
  var pct = m > 0 ? Math.round((s / m) * 100) : 0
  var t = kind === 'exam' ? PARENT_PUSH_EXAM_TITLE : PARENT_PUSH_HOMEWORK_TITLE
  var b = kind === 'exam' ? PARENT_PUSH_EXAM_BODY : PARENT_PUSH_HOMEWORK_BODY
  var body = String(b)
    .split('{student}').join(String(studentName || 'الطالب'))
    .split('{title}').join(String(title || ''))
    .split('{score}').join(String(s))
    .split('{max}').join(String(m))
    .split('{percent}').join(String(pct))
  var icon = '/push-icon.png'
  try { icon = await resolveParentPushIcon() } catch (e) {}
  return {
    title: String(t),
    body: body,
    url: '/#parent-login', /* ضغطة الإشعار بتفتح شاشة دخول ولي الأمر */
    tag: 'parent-' + kind,
    icon: icon,
  }
}

/* ملامة القالب بالقيم الحقيقية */
export function buildParentMessage(kind: 'exam' | 'homework', studentName: string, title: string, score: number, maxScore: number): string {
  var s = Number(score) || 0
  var m = Number(maxScore) || 0
  var pct = m > 0 ? Math.round((s / m) * 100) : 0
  var tpl = kind === 'exam' ? PARENT_EXAM_TEMPLATE : PARENT_HOMEWORK_TEMPLATE
  return String(tpl)
    .split('{student}').join(String(studentName || 'الطالب'))
    .split('{title}').join(String(title || ''))
    .split('{score}').join(String(s))
    .split('{max}').join(String(m))
    .split('{percent}').join(String(pct))
}

/* تطبيع رقم ولي الأمر — نفس صيغة تسجيل دخول ولي الأمر بالظبط:
   11 رقم بتبدأ بـ 0 (010xxxxxxxx) — بيتقبل 20-prefix وأي تنسيق غريب */
export function normalizeParentPhone(raw: string): string {
  var t = String(raw || '')
  t = t.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)) })
  t = t.replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) })
  var digits = t.replace(/[^0-9]/g, '')
  if (digits.length === 12 && digits.indexOf('20') === 0) digits = '0' + digits.slice(2)
  else if (digits.length > 11) digits = digits.slice(digits.length - 11)
  else if (digits.length === 10 && digits.indexOf('1') === 0) digits = '0' + digits
  return (digits.length === 11 && digits.charAt(0) === '0') ? digits : ''
}

/* (و45 نفس الدرس) ضمان وجود الجدول — أول INSERT فاشل بعمل CREATE TABLE
   IF NOT EXISTS بالأعمدة المطلوبة ونعدّي المحاولة — مرة لكل process.
   ده اللي بيخلي الإنتاج (Turso) بيتعمل فيه الجدول لوحده من غير أي تدخل يدوي */
var _pnTableReady = false
export async function ensureParentNotificationsTable(force?: boolean): Promise<void> {
  if (_pnTableReady && !force) return
  try {
    await db.$executeRawUnsafe("CREATE TABLE IF NOT EXISTS parent_notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, parent_id TEXT NOT NULL DEFAULT '', student_name TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '', is_read INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)")
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_pn_parent ON parent_notifications(parent_id, is_read)') } catch (e) {}
    try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_pn_created ON parent_notifications(created_at)') } catch (e) {}
    _pnTableReady = true
  } catch (e) {
    console.error('[parent-notify] ensure table failed (ignored):', e)
  }
}

/**
 * إنشاء إشعارات ولي الأمر بعد تسليم امتحان/واجب — بيتنادى من مسارات
 * التسليم (exams/submit بعد الدرجة النهائية + homework/submit).
 * الإشعار بيتكتب لكل رقم ولي أمر مربوط بالطالب (و37 + و79 multi-child).
 * أي فشل = سجل في اللوج وبس — التسليم مش بيتأثر أبدًا.
 */
export async function notifyParentsOfResult(opts: { studentId: string; kind: 'exam' | 'homework'; title: string; score: number; maxScore: number; siteUrl?: string }): Promise<void> {
  try {
    if (!opts || !opts.studentId) return
    await ensureParentNotificationsTable()

    var stu: any = await db.$queryRawUnsafe('SELECT name, parentPhone FROM Student WHERE id = ? LIMIT 1', String(opts.studentId))
    stu = stu || []
    if (!stu.length) return
    var studentName = String(stu[0].name || '')

    /* كل أرقام أولياء الأمور المربوطة بالطالب — بدون تكرار */
    var targets: string[] = []
    var pushTarget = function (raw: any) {
      var n = normalizeParentPhone(String(raw || ''))
      if (n && targets.indexOf(n) === -1) targets.push(n)
    }
    pushTarget(stu[0].parentPhone)
    /* حسابات Parent المربوطة مباشرة (و37) */
    try {
      var p1: any = await db.$queryRawUnsafe('SELECT phone FROM Parent WHERE studentId = ?', String(opts.studentId))
      p1 = p1 || []
      for (var i = 0; i < p1.length; i++) pushTarget(p1[i] && p1[i].phone)
    } catch (e1) {}
    /* حسابات Parent المدموجة عبر ParentStudent (و79 — ولي أمر بعدة أبناء) */
    try {
      var links: any = await db.$queryRawUnsafe('SELECT parentId FROM ParentStudent WHERE studentId = ?', String(opts.studentId))
      links = links || []
      for (var j = 0; j < links.length; j++) {
        var pid = links[j] && links[j].parentId ? String(links[j].parentId) : ''
        if (!pid) continue
        try {
          var pr: any = await db.$queryRawUnsafe('SELECT phone FROM Parent WHERE id = ? LIMIT 1', pid)
          pr = pr || []
          if (pr.length) pushTarget(pr[0] && pr[0].phone)
        } catch (e2) {}
      }
    } catch (e3) {}

    if (!targets.length) return /* مفيش رقم ولي أمر مسجل — مفيش إشعار (مش مشكلة) */

    var message = buildParentMessage(opts.kind, studentName, opts.title, opts.score, opts.maxScore)
    for (var k = 0; k < targets.length; k++) {
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO parent_notifications (parent_id, student_name, message, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
          targets[k], studentName.slice(0, 120), message
        )
      } catch (eIns) {
        /* المحاولة الأولى فشلت — غالبًا الجدول ناقص (نشر جديد): نعمله ونعدّي مرة */
        try {
          await ensureParentNotificationsTable(true)
          await db.$executeRawUnsafe(
            'INSERT INTO parent_notifications (parent_id, student_name, message, is_read, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
            targets[k], studentName.slice(0, 120), message
          )
        } catch (eIns2) {
          console.error('[parent-notify] insert failed (ignored):', eIns2)
        }
      }
    }

    /* (2026-و89) الجزء الخارجي بقى **Web Push حقيقي** بطلب المستر:
       «مش واتساب — إشعار براوزر يظهر على شاشة الموبايل بره، وضغطة عليه
       تفتح شاشة دخول ولي الأمر وبعد الدخول يشوف الإشعار جوه المنصة».
       بنبعت لكل جهاز اشترك لرقم ولي الأمر (ParentPushSubscription).
       مفيش اشتراكات = مفيش إشعار خارجي — الإشعار الداخلي شغال زي ما هو. */
    try {
      var payload = await buildParentPushPayload(opts.kind, studentName, opts.title, opts.score, opts.maxScore)
      var pushOut = await Promise.all(targets.map(function (t: string) {
        return sendParentPush(t, payload).catch(function () { return { sent: 0, failed: 0 } })
      }))
      for (var w = 0; w < pushOut.length; w++) {
        var pr = pushOut[w] as any
        if (pr && pr.failed > 0) {
          console.error('[parent-notify] push failed for some devices (ignored): sent=' + pr.sent + ' failed=' + pr.failed)
        }
      }
    } catch (ePush) {
      console.error('[parent-notify] push send error (ignored):', ePush)
    }
  } catch (e) {
    console.error('[parent-notify] failed (ignored):', e)
  }
}
