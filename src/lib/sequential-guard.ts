// ============================================================
// SEQUENTIAL GUARD — الترتيب التسلسلي للواجبات والامتحانات
// ============================================================
// (طلب المستر — نفس نظام الفيديوهات بالظبط)
// الواجب/الامتحان مينفعش يتفتح غير لما اللي قبله يتسلّم/يتقدّم.
// الترتيب: من الأقدم للأحدث (ترتيب النزول على المنصة نفسه).
// العناصر اللي مش قابلة للتسليم (من غير أسئلة — ملف بس) بتتخطى
// عشان التسلسل ميقلعش على حاجة الطالب مش قادر يسلمها.
// أي خطأ داخلي → ممنوع نمنع طالب بريء (نفتح بدل ما نقفل).
// ============================================================
import { db } from '@/lib/db'

export interface SeqCheckResult {
  ok: boolean
  code?: number
  reason?: string
}

function hasQuestions(questionsJson: string | null | undefined): boolean {
  try {
    var qs = JSON.parse(String(questionsJson || '[]'))
    return Array.isArray(qs) && qs.length > 0
  } catch (e) {
    return false
  }
}

/** الواجب بيفتح بس لو الواجب اللي قبله (نفس الصف، الأقدم الأول) متسلّم */
export async function checkHwSequential(
  homeworkId: string,
  studentId: string | null | undefined
): Promise<SeqCheckResult> {
  if (!studentId) return { ok: true }
  try {
    var hw: any = await db.homework.findUnique({ where: { id: homeworkId } })
    if (!hw) return { ok: true }
    var gradeHws: any[] = await db.homework.findMany({
      where: { grade: hw.grade },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, questions: true },
    })
    var idx = gradeHws.findIndex(function (h) { return h.id === homeworkId })
    if (idx <= 0) return { ok: true } // أول واجب مفتوح دايمًا
    for (var i = idx - 1; i >= 0; i--) {
      var prev = gradeHws[i]
      if (!hasQuestions(prev.questions)) continue // ملف بس — مش قابل للتسليم، نتخطاه
      var done = await db.homeworkResult.findUnique({
        where: { studentId_homeworkId: { studentId, homeworkId: prev.id } },
      }).catch(function () { return null })
      if (!done) {
        return {
          ok: false,
          code: 423,
          reason: 'الواجب ده هيتفتح أول ما تسلّم الواجب اللي قبله' + (prev.title ? ' — "' + prev.title + '"' : ''),
        }
      }
      break // أقرب واجب قبله قابل للتسليم اتسلّم → الفيديو ده مفتوح
    }
    return { ok: true }
  } catch (e) {
    return { ok: true }
  }
}

/** الامتحان بيفتح بس لو الامتحان اللي قبله (نفس الصف، الأقدم الأول) اتقدّم */
export async function checkExamSequential(
  examId: string,
  studentId: string | null | undefined
): Promise<SeqCheckResult> {
  if (!studentId) return { ok: true }
  try {
    var exam: any = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) return { ok: true }
    var gradeExams: any[] = await db.exam.findMany({
      where: { grade: exam.grade },
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, questions: true },
    })
    var idx = gradeExams.findIndex(function (e) { return e.id === examId })
    if (idx <= 0) return { ok: true }
    for (var i = idx - 1; i >= 0; i--) {
      var prev = gradeExams[i]
      if (!hasQuestions(prev.questions)) continue
      var done = await db.examResult.findUnique({
        where: { studentId_examId: { studentId, examId: prev.id } },
      }).catch(function () { return null })
      if (!done) {
        return {
          ok: false,
          code: 423,
          reason: 'الامتحان ده هيتفتح أول ما تاخد الامتحان اللي قبله' + (prev.title ? ' — "' + prev.title + '"' : ''),
        }
      }
      break
    }
    return { ok: true }
  } catch (e) {
    return { ok: true }
  }
}
