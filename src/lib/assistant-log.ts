// ============================================================
// (2026-و110) assistant-log — سجل استخدام المساعد الذكي أثناء الحل
// ============================================================
// طلب المستر الحرفي: «لو حد وهو بيحل الواجب أو امتحان استخدم المساعد
// الذكي يقول له ما تستخدمش المساعد الذكي هتتحسب وتنقص 5 درجات —
// وتكون 3 محاولات: أول محاولة عادي، تاني محاولة 5 درجات، تالت محاولة
// 5 درجات وآخر محاولة بيسلّم».
//
// كل رسالة تتبعت للمساعد والطالب في نص حل (واجب/امتحان) بتتسجل هنا
// في جدول AssistantUse — وعند التسليم، راوت الواجب/الامتحان بيعدّ
// الاستخدامات وبيطبّق الخصم:
//   استخدام 1 → تحذير بس (صفر خصم)
//   استخدام 2 → −5 درجات
//   استخدام 3 → −5 درجات تانية (إجمالي −10) + تسليم تلقائي من الواجهة
// الجدول بيعمل self-heal هنا (CREATE TABLE IF NOT EXISTS) زي نمط
// UploadChunk — عشان أول طلب بعد النشر على Turso يشتغل من غير migration.
// ============================================================
import { db } from '@/lib/db'

var _tableReady: Promise<void> | null = null
export function ensureAssistantTable(): Promise<void> {
  if (!_tableReady) {
    _tableReady = (async function () {
      try {
        await db.$executeRawUnsafe(
          'CREATE TABLE IF NOT EXISTS AssistantUse (id TEXT PRIMARY KEY, "studentId" TEXT NOT NULL, kind TEXT NOT NULL DEFAULT \'\', "refId" TEXT NOT NULL DEFAULT \'\', page TEXT NOT NULL DEFAULT \'\', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)'
        )
      } catch (e) {}
      try {
        await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS AssistantUse_studentId_refId_idx ON AssistantUse ("studentId", "refId")')
      } catch (e) {}
    })()
  }
  return _tableReady
}

/* تسجيل استخدام واحد للمساعد أثناء حل واجب/امتحان */
export async function logAssistantUse(studentId: string, kind: string, refId: string, page: string): Promise<void> {
  await ensureAssistantTable()
  await db.$executeRawUnsafe(
    'INSERT INTO AssistantUse (id, "studentId", kind, "refId", page, "createdAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2)),
    String(studentId || '').substring(0, 80),
    String(kind || '').substring(0, 20),
    String(refId || '').substring(0, 80),
    String(page || '').substring(0, 200)
  )
}

/* عدد استخدامات المساعد للطالب ده في الواجب/الامتحان ده (أي وقت — التسليم مرة واحدة) */
export async function countAssistantUses(studentId: string, refId: string): Promise<number> {
  await ensureAssistantTable()
  var rows: any[] = await db.$queryRawUnsafe(
    'SELECT COUNT(*) AS n FROM AssistantUse WHERE "studentId" = ? AND "refId" = ?',
    String(studentId || ''), String(refId || '')
  ) as any[]
  return Math.max(0, parseInt(String((rows && rows[0] && rows[0].n) || 0), 10) || 0)
}

/* قاعدة الخصم الموحدة (نفسها على الكلينت في src/lib/assistant-guard.ts):
   أول محاولة عادي — من التانية كل محاولة −5 — بحد أقصى −10 (المحاولات 3) */
export function assistantPenaltyFor(uses: number): number {
  var n = Math.max(0, Math.min(Number(uses) || 0, 10))
  if (n < 2) return 0
  return Math.min((n - 1) * 5, 10)
}
