// ============================================================
// (2026-و82) تنظيف ملفات Media اليتيمة — سد ثغرة التضخم الأكبر
// ============================================================
// الخلفية: كل الملفات (صور حلول الواجبات/الامتحانات، فيديوهات مرفوعة،
// ملفات PDF، صور مصغرة، صور قص الأشكال) بتتخزن كصفوف في جدول Media
// (عمود data). لما كانت نتايج امتحان/واجب أو فيديو بتتمسح، الصفوف
// بتتمسح بس ملفاتها في Media كانت بتفضل يتيمة للأبد — وده كان أكبر
// مصدر تضخم قاعدة البيانات (اتلقا 546 ملف يتيمة = 820MB في و82).
//
// collectMediaIds: بيستخرج كل الـ cuids اللي شبه معرفات Media من نص
//   (JSON إجابات، أسئلة، مسارات /api/files/...). التحذير الوحيد لو
//   طلع فيه معرف طالب/جدول تاني فهو مش هيتمسح من Media أصلاً لأن
//   DELETE بيتم على جدول Media بس — فالاستخراج الواسع آمن.
// deleteMediaByIds: مسح مجزّئ (50 بالدفعة) — أي فشل بيترجع بالعدد اللي
//   اتمسح فعلًا وما بيرميش (التنظيف مش مفروض يبوّظ عملية المسح الأساسية).
// ============================================================
import { db } from '@/lib/db'

export function collectMediaIds(texts: Array<string | null | undefined>): string[] {
  var ids = new Set<string>()
  var list = texts || []
  for (var i = 0; i < list.length; i++) {
    var t = list[i]
    if (!t || typeof t !== 'string') continue
    var re = /c[a-z0-9]{14,}/gi
    var m: RegExpExecArray | null
    while ((m = re.exec(t))) {
      if (m[0]) ids.add(m[0])
    }
  }
  return Array.from(ids)
}

export async function deleteMediaByIds(ids: string[]): Promise<number> {
  if (!ids || ids.length === 0) return 0
  var deleted = 0
  for (var i = 0; i < ids.length; i += 50) {
    var chunk = ids.slice(i, i + 50).filter(function (x) { return /^c[a-z0-9]{14,}$/i.test(x) })
    if (chunk.length === 0) continue
    var list = chunk.map(function (x) { return "'" + x + "'" }).join(',')
    try {
      deleted += await db.$executeRawUnsafe('DELETE FROM Media WHERE id IN (' + list + ')')
    } catch (e) {
      console.error('deleteMediaByIds chunk failed:', e)
    }
  }
  return deleted
}

/* بييجمع نصوص مراجع الملفات من حقول امتحان/واجب (الملف نفسه + المفتاح
   + الصورة المصغرة + الأشكال المقصوصة جوه JSON الأسئلة) */
export function examHomeworkMediaTexts(rec: Record<string, unknown> | null): string[] {
  if (!rec) return []
  return [
    rec.content, rec.filePath, rec.answerKeyPath, rec.thumbnail,
    rec.questions, rec.models,
  ].filter(function (x) { return typeof x === 'string' && x }) as string[]
}
