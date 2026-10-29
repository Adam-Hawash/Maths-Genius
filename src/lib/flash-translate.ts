// ============================================================
// (2026-و88) flash-translate — ترجمة عربية فورية لأسئلة الفلاش كارد
// ============================================================
// زرار 🌐 في شاشة الفلاش كاردز (شكل الصورة) — بيحوّل نص السؤال
// الإنجليزي المولّد من المحرك المحلي (lib/question-gen) لجملة عربية
// مفهومة فورًا ومن غير أي نداء شبكة.
// لو النص مش من الأنماط المعروفة (كروت المستر العربية مثلًا) بيرجع
// null — والواجهة بتخفي الزرار خالص.
// الأرقام والرموز الرياضية بتتفصل زي ما هي — الرياضيات لغة عالمية.
// ============================================================

type Rule = [RegExp, string]

/* الترتيب مهم: الأنماط الأطخص الأول وبعدين العامة */
var RULES: Rule[] = [
  [/^Solve the quadratic equation:\s*/i, 'حل المعادلة التربيعية: '],
  [/^Solve the system:\s*/i, 'حل المنظومة: '],
  [/^Solve for x:\s*/i, 'حل المعادلة: '],
  [/^Simplify the fraction:\s*/i, 'بسّط الكسر: '],
  [/^Simplify:\s*/i, 'بسّط: '],
  [/^Calculate:\s*/i, 'احسب: '],
  [/^Find the greatest common factor \(GCF\) of\s*/i, 'أوجد العامل المشترك الأكبر للأعداد '],
  [/^Find the least common multiple \(LCM\) of\s*/i, 'أوجد المضاعف المشترك الأصغر للأعداد '],
  [/^A phone costs\s*/, 'موبايل سعره '],
  [/^A right triangle has legs of length\s*/, 'مثلث قائم ضلعاه القائمان '],
  [/^A right triangle has a hypotenuse of\s*/, 'مثلث قائم وتره '],
  [/^A rectangle has length\s*/, 'مستطيل طوله '],
  [/^A triangle has a base of\s*/, 'مثلث قاعدته '],
  [/^A triangle has two angles of\s*/, 'مثلث فيه زاويتين '],
  [/^A circle has a radius of\s*/, 'دائرة نصف قطرها '],
  [/^A cuboid measures\s*/, 'متوازي مستطيلات أبعاده '],
  [/^A cylinder has a base radius of\s*/, 'أسطوانة نصف قطر قاعدتها '],
  [/^A student scored\s*/, 'طالب جاب درجات '],
  [/^A car travels at\s*/, 'عربية بتتحرك بسرعة '],
  [/^A car covered\s*/, 'عربية قطعت '],
  [/^If\s*/, 'لو '],
]

/* قطع الجُمل الثابتة — بتتنفذ بالترتيب على النص بعد استبدال البداية */
var PHRASES: Rule[] = [
  [/\s*its price increased by\s*/, ' والسعر زاد '],
  [/\s*then decreased by\s*/, ' وبعدين قلّ '],
  [/\s*— what is the final price\?/, ' — كم السعر النهائي؟'],
  [/\s*and\s*/, ' و'],
  [/\s*— find the hypotenuse/, ' — أوجد الوتر'],
  [/\s*— find the other leg/, ' — أوجد الضلع القائم التاني'],
  [/\s*and one leg of\s*/, ' وضلع قائم منه '],
  [/\s*cm and width\s*/, ' سم وعرضه '],
  [/\s*cm — find its area/, ' سم — أوجد مساحته'],
  [/\s*cm — find its perimeter/, ' سم — أوجد محيطه'],
  [/\s*cm and a height of\s*/, ' سم وارتفاعه '],
  [/\s*cm — its area = \?/, ' سم — مساحته = ؟'],
  [/\s*cm — find its area \(π = 22\/7\)/, ' سم — أوجد مساحتها (π = 22/7)'],
  [/\s*cm — find its circumference \(π = 22\/7\)/, ' سم — أوجد محيطها (π = 22/7)'],
  [/\s*cm — find its volume \(π = 22\/7\)/, ' سم — أوجد حجمها (π = 22/7)'],
  [/\s*cm — find its volume/, ' سم — أوجد حجمه'],
  [/\s*in 4 subjects — find the mean \(average\)/, ' في 4 مواد — أوجد المتوسط'],
  [/\s*km\/h for\s*/, ' كم/س لمدة '],
  [/\s*hours — find the distance covered/, ' ساعة — أوجد المسافة المقطوعة'],
  [/\s*km at\s*/, ' كم بسرعة '],
  [/\s*km\/h — how long did the trip take\?/, ' كم/س — كم ساعتها الرحلة؟'],
  [/\s*% of\s*/, '% من '],
  [/\s*of the same kind cost\?/, ' بنفس السعر بـ كام؟'],
  [/\s*cost\s*/, ' بـ '],
  [/\s*— find the third angle/, ' — أوجد الزاوية التالتة'],
  [/\s*° and\s*/, '° و'],
]

/**
 * الترجمة العربية لسؤال الفلاش كارد — null = مفيش ترجمة معروفة
 * (والواجهة بتخفي زرار الترجمة في الحالة دي)
 */
export function arabicFlashStem(text: string): string | null {
  var t = String(text || '').trim()
  if (!t) return null
  /* نصوص عليها عربي أصلًا (كروت المستر) → مفيش داعي للترجمة */
  if (/[\u0600-\u06FF]/.test(t)) return null

  var head: Rule | null = null
  for (var i = 0; i < RULES.length; i++) {
    if (RULES[i][0].test(t)) { head = RULES[i]; break }
  }
  if (!head) return null /* نمط غير معروف → الزرار يتخفي */

  var out = t.replace(head[0], head[1])
  for (var j = 0; j < PHRASES.length; j++) {
    out = out.replace(PHRASES[j][0], PHRASES[j][1])
  }
  /* تنظيف: مسافات مكررة حوالين الأرقام بعد الاستبدال */
  out = out.replace(/\s{2,}/g, ' ').trim()
  return out
}
