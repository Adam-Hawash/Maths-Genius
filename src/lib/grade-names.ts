// ============================================================
// grade-names (Maths-Genius) — مرجع موحد لتطبيع الصفوف ومطابقتها
// ============================================================
// (2026-ص3) علاج «الواجب/الامتحان ظاهر لكل الصفوف»: الفلاتر القديمة كانت
// بتطابق بأول كلمة (contains 'أولى') — فامتحان «أولى بكالوريا» كان بيظهر
// لـ«أولى إعدادي» و«أولى ابتدائي»! القاعدة الجديدة: مطابقة تساوي حرفية
// على كل الصيغ اللي تعني نفس الصف — وعمرها ما تطابق صف تاني.
// ============================================================

export const GRADE_S1 = 'أولى بكالوريا'   // تسمية المنصة الرسمية
export const GRADE_S1_LEGACY = 'أولى ثانوي' // مرادف محتمل بعد أي توحيد تسمية

/* تطبيع اسم الصف (نفس المنطق المحلي القديم في /api/homework و /api/exams) */
export function normalizeGrade(grade: string): string {
  if (!grade) return ''
  var g = String(grade).trim()
  g = g.replace(/^الصف\s+/i, '')
  g = g.replace(/الاعدادي/gi, 'إعدادي')
  g = g.replace(/الإعدادي/gi, 'إعدادي')
  g = g.replace(/البكالوريا/gi, 'بكالوريا')
  g = g.replace(/بكالوريا/gi, 'بكالوريا')
  if (g.includes('أولى') || g.includes('اولى') || g.includes('الأول')) g = 'أولى'
  if (g.includes('تانية') || g.includes('الثاني')) g = 'تانية'
  if (g.includes('تالتة') || g.includes('الثالث')) g = 'تالتة'
  if (g.includes('الرابع')) g = 'الرابع'
  if (g.includes('الخامس')) g = 'الخامس'
  if (g.includes('السادس')) g = 'السادس'
  if (g === 'أولى' && grade.includes('عداد')) g = 'أولى إعدادي'
  if (g === 'تانية' && grade.includes('عداد')) g = 'تانية إعدادي'
  if (g === 'تالتة' && grade.includes('عداد')) g = 'تالتة إعدادي'
  if (g === 'أولى' && (grade.includes('كالور') || grade.includes('ثانوي'))) g = GRADE_S1
  return g
}

/* (2026-ص3) كل الصيغ المخزنة اللي تعني نفس الصف — مطابقة تساوي حرفية
   مكان خدعة contains بأول كلمة: «أولى بكالوريا» بتجيب الاسم المرادف
   و«أولى» المخزنة قديمًا — وعمرها ما تلحق «أولى إعدادي». */
export function gradeVariants(grade: string): string[] {
  var g = String(grade || '').trim()
  var n = normalizeGrade(g)
  var out: string[] = []
  if (g) out.push(g)
  if (n) out.push(n)
  if (n === GRADE_S1) {
    out.push(GRADE_S1_LEGACY) // مرادف التسمية
    out.push('أولى')          // تخزين قديم بدون صف دراسي تاني
  }
  // توأم إملائي محدود (ثانوى/اعدادى بالى) — ممنوع استبدال عمي للـ ي
  var twin = function (v: string): string {
    return String(v || '').replace('ثانوي', 'ثانوى').replace('إعدادي', 'إعدادى')
  }
  var arr = out.slice()
  for (var i = 0; i < arr.length; i++) { var t = twin(arr[i]); if (t !== arr[i]) out.push(t) }
  var seen: Record<string, boolean> = {}
  var res: string[] = []
  for (var j = 0; j < out.length; j++) { var v = out[j]; if (v && !seen[v]) { seen[v] = true; res.push(v) } }
  return res
}
