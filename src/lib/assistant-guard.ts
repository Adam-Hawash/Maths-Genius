'use client'

// ============================================================
// (2026-و110) assistant-guard — حارس المساعد الذكي أثناء الحل
// ============================================================
// طلب المستر الحرفي: «لو حد وهو بيحل الواجب أو امتحان استخدم المساعد
// الذكي يقول له ما تستخدمش المساعد الذكي هتتحسب وتنقص 5 درجات —
// وتكون برضه 3 محاولات: أول محاولة عادي، تاني محاولة خمس درجات،
// تالت محاولة برضه خمس درجات آخر محاولة هيسلّم».
//
// الشغل:
//  • شاشة الحل (واجب مكشوف أو امتحان شغال) بتسجّل جلسة بـ beginSession
//    وتقفلها بـ endSession.
//  • المساعد الذكي قبل ما يبعت أي رسالة بينادي registerUse — لو فيه
//    جلسة شغالة يرجّع عدد المحاولات + الخصم + هل دي المحاولة الأخيرة.
//  • المحاولة الأخيرة (التالتة) بتطلق finalHandler المسجّل من بورتال
//    الطالب → تسليم تلقائي للواجب/الامتحان.
//  • العدّاد بيتخزن في sessionStorage بمفتاح الـ refId — تحديث الصفحة
//    مايمسحش المخالفات (عصي على الغش) — وبيمسح بس بعد التسليم الفعلي.
// ============================================================

export type GuardKind = 'homework' | 'exam'

export interface ActiveSession {
  kind: GuardKind
  refId: string
  label: string
}

export interface UseResult {
  uses: number
  penalty: number
  kind: GuardKind
  refId: string
  label: string
  final: boolean
}

var sessions: Record<string, ActiveSession> = {}
/* handler لكل نوع (واجب/امتحان) — التابين ممكن يكونوا مركّبين في نفس الوقت،
   وكل واحد بيسجّل دالة التسليم التلقائي بتاعته لوحده */
var finalHandlers: { homework: null | ((s: ActiveSession) => void); exam: null | ((s: ActiveSession) => void) } = { homework: null, exam: null }
var finalFired: Record<string, boolean> = {}

var USES_KEY = 'mg_assist_uses_v1'

function loadUses(): Record<string, number> {
  try {
    var raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USES_KEY) : null
    var parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) { return {} }
}

function saveUses(u: Record<string, number>) {
  try { sessionStorage.setItem(USES_KEY, JSON.stringify(u)) } catch (e) {}
}

/* نفس قاعدة الخصم اللي على السيرفر في src/lib/assistant-log.ts */
export function penaltyFor(uses: number): number {
  var n = Math.max(0, Math.min(Number(uses) || 0, 10))
  if (n < 2) return 0
  return Math.min((n - 1) * 5, 10)
}

/* شاشة الحل بدأت — واجب اتفتح للحل أو امتحان ابدأ */
export function beginSession(kind: GuardKind, refId: string, label: string) {
  if (!refId) return
  sessions[refId] = { kind: kind, refId: refId, label: label || (kind === 'exam' ? 'الامتحان' : 'الواجب') }
}

/* شاشة الحل قفلت — اتسلّم أو طلع */
export function endSession(refId: string) {
  if (refId && sessions[refId]) delete sessions[refId]
}

/* الجلسة النشطة (آخر واحدة فتحت — مفيش حلين مع بعض عمليًا) */
export function getActiveSession(): ActiveSession | null {
  var ids = Object.keys(sessions)
  if (ids.length === 0) return null
  return sessions[ids[ids.length - 1]] || null
}

/* بورتال الطالب بيسجّل دالة التسليم التلقائي للمحاولة الأخيرة — لكل نوع */
export function setFinalHandler(kind: GuardKind, fn: ((s: ActiveSession) => void) | null) {
  finalHandlers[kind] = fn
}

/* إطلاق التسليم التلقائي (المحاولة الأخيرة خلصت) */
export function fireFinal() {
  var s = getActiveSession()
  if (!s) return
  var fn = finalHandlers[s.kind]
  if (!fn) return
  if (finalFired[s.refId]) return
  finalFired[s.refId] = true
  try { fn(s) } catch (e) {}
}

/* عدد محاولات الطالب في واجب/امتحان معين — بيتبعت مع التسليم */
export function usesFor(refId: string): number {
  if (!refId) return 0
  var u = loadUses()
  return Math.max(0, Number(u[refId] || 0))
}

/* بعد التسليم بنمسح عدّاد المحاولات بتاعة الـ refId ده */
export function clearUses(refId: string) {
  if (!refId) return
  var u = loadUses()
  delete u[refId]
  saveUses(u)
  try { delete finalFired[refId] } catch (e) {}
}

/* المساعد بيندّي عليها قبل إرسال أي رسالة — بترجع null لو مفيش حل شغال */
export function registerUse(): UseResult | null {
  var s = getActiveSession()
  if (!s) return null
  var u = loadUses()
  u[s.refId] = Math.max(0, Number(u[s.refId] || 0)) + 1
  saveUses(u)
  var uses = Number(u[s.refId])
  var final = uses >= 3 && !finalFired[s.refId]
  return {
    uses: uses,
    penalty: penaltyFor(uses),
    kind: s.kind,
    refId: s.refId,
    label: s.label,
    final: final,
  }
}
