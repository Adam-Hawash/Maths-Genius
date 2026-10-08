// ============================================================
// grade-names — المرجع الموحد لأسماء الصفوف في كل المنصة
// ============================================================
// (توحيد الصفوف — طلب المستر: «ما تخلي البيانات كلها زي بعض عشان
//  الامتحانات تظهر»)
//
// العلّة اللي كانت: normalizeGrade المحلي القديم كان بيقصّ أسماء
//   صفوف الابتدائي بتقطيع includes — «الخامسة الابتدائي» بتتخزن
//   «الخامس»، و«الصف السادس الابتدائي» بتتخزن «السادس»، و«خمسة
//   ابتدائي» بتفضل زي ما هي — فالفيديو/الامتحان/الواجب المضاف لصف
//   ما كانش بيظهر لطلاب نفس الصف، والقايمة كانت فيها «الخامس،
//   السادس، الرابع» جنب الأسماء الكاملة.
//
// القاعدة دلوقتي — **اسم معتمد واحد لكل صف**:
//   • أي كتابة (storeGrade) بتتخزن بالاسم المعتمد الكامل
//   • أي قراءة (gradeVariants/gradeWhere) بتجيب كل الصيغ القديمة مع بعض
//   • أي عرض (displayGrade) بيرجع الاسم المعتمد الكامل
// الأسماء المعتمدة = نفس أسماء DEFAULT_GRADES في app-store و
// GRADES هنا في المنصة دي («رابعة ابتدائي» / «خمسة ابتدائي» /
// «الصف السادس الابتدائي» / «أولى بكالوريا»...) اللي ensure-schema
// بيوحّد عليها قاعدة البيانات (migrateGradeRows).
// ============================================================

export const GRADE_S1 = 'أولى بكالوريا'   // تسمية المنصة الرسمية (الثانوي)
export const GRADE_S1_LEGACY = 'أولى ثانوي' // مرادف محتمل مخزن — نفس الصف بالظبط

/* ------------------------------------------------------------
   عائلات صفوف الابتدائي — كل صيغة ممكن تتخزن → الاسم المعتمد.
   الأسماء المعتمدة = نفس أسماء DEFAULT_GRADES/GRADES في app-store
   (متلمةسش — دي تسمية المنصة الرسمية بتاعة لوحة الصفوف).
   bareSafe = الصيغ المفردة (من غير كلمة «ابتدائي») آمنة للعيلة دي —
   رابعة/خمسة/سادس مفيش صف تاني بيبدأ بنفس الكلمات، لكن الأول/الثاني/
   التالتة بيتلخبطوا مع الإعدادي/البكالوريا («أولى» لوحدها = أولى
   بكالوريا) فلازم كلمة «ابتدائي» تكون موجودة في الاسم الأصلي بتاعهم.
   ------------------------------------------------------------ */
export interface PrimaryGradeFamily {
  ar: string
  en: string
  emoji: string
  short: string
  bareSafe: boolean
  keys: string[]
}

export const PRIMARY_GRADE_FAMILIES: PrimaryGradeFamily[] = [
  {
    ar: 'رابعة ابتدائي', en: 'Grade 4', emoji: '4️⃣', short: 'G4', bareSafe: true,
    keys: ['رابعة ابتدائي', 'رابع ابتدائي', 'ربعة ابتدائي', 'الرابعة الابتدائي', 'الرابع الابتدائي', 'رابعة الابتدائي', 'grade 4', 'g4', '4', '٤', 'رابعة', 'رابع', 'ربعة', 'ربع'],
  },
  {
    ar: 'خمسة ابتدائي', en: 'Grade 5', emoji: '5️⃣', short: 'G5', bareSafe: true,
    /* «خمسة» و«خمس» بدون ألف كمان — صيغ مصرية شائعة */
    keys: ['خمسة ابتدائي', 'خامس ابتدائي', 'خمس ابتدائي', 'الخامسة الابتدائي', 'الخامس الابتدائي', 'خمسة الابتدائي', 'grade 5', 'g5', '5', '٥', 'خامسة', 'خامس', 'خمسة', 'خمس'],
  },
  {
    ar: 'الصف السادس الابتدائي', en: 'Grade 6', emoji: '6️⃣', short: 'G6', bareSafe: true,
    keys: ['الصف السادس الابتدائي', 'السادس الابتدائي', 'السادسة الابتدائي', 'سادس الابتدائي', 'سادسة الابتدائي', 'سادس ابتدائي', 'سادسة ابتدائي', 'grade 6', 'g6', '6', '٦', 'سادس', 'سادسة'],
  },
  {
    ar: 'الأول الابتدائي', en: 'Grade 1', emoji: '1️⃣', short: 'G1', bareSafe: false,
    keys: ['الاول الابتدائي', 'اولي ابتدائي', 'الاولي الابتدائي', 'اول ابتدائي', 'grade 1 primary', 'g1 primary'],
  },
  {
    ar: 'الثاني الابتدائي', en: 'Grade 2', emoji: '2️⃣', short: 'G2', bareSafe: false,
    keys: ['الثاني الابتدائي', 'ثاني ابتدائي', 'الثانية الابتدائي', 'ثانية ابتدائي', 'grade 2 primary', 'g2 primary'],
  },
  {
    ar: 'التالتة الابتدائي', en: 'Grade 3', emoji: '3️⃣', short: 'G3', bareSafe: false,
    keys: ['التالتة الابتدائي', 'تالتة ابتدائي', 'الثالثة الابتدائي', 'ثالثة ابتدائي', 'تالت ابتدائي', 'grade 3 primary', 'g3 primary'],
  },
]

/* تطبيع مفتاح المقارنة: شيل «الصف» + وحّد الهمزات والتاء المربوطة/الألف
   المقصورة والتطويل والتشكيل + اطوي المسافات + lowercase (للاتيني) */
function gradeKey(name: any): string {
  var g = String(name || '')
  g = g.replace(/^\s*الصف\s+/u, '')
  g = g.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627') // أ إ آ ٱ → ا
  g = g.replace(/\u0649/g, '\u064A')                     // ى → ي
  g = g.replace(/\u0640/g, '')                           // ـ tatweel
  g = g.replace(/[\u064B-\u0652]/g, '')                  // التشكيل
  g = g.replace(/\s+/g, ' ').trim().toLowerCase()
  return g
}

/* الاسم بدون بادئة «ال» ولاحقة «الابتدائي» — للمطابقة الضبابية جوه العيلة */
function stripBare(key: string): string {
  return key.replace(/^(ال)?/, '').replace(/\s*(ابتدائي|الابتدائي)$/, '').trim()
}

/* ------------------------------------------------------------
   الاسم بيمثل صف ابتدائي من العائلات؟ → بيانات الاسم المعتمد (أو null)
   ------------------------------------------------------------ */
export function primaryGradeCanonical(name: any): PrimaryGradeFamily | null {
  var key = gradeKey(name)
  if (!key) return null
  var bare = stripBare(key)
  var hasIbtidai = key.indexOf('ابتدائي') !== -1
  for (var i = 0; i < PRIMARY_GRADE_FAMILIES.length; i++) {
    var f = PRIMARY_GRADE_FAMILIES[i]
    for (var k = 0; k < f.keys.length; k++) {
      if (key === gradeKey(f.keys[k])) return f
    }
    if (f.bareSafe || hasIbtidai) {
      for (var k2 = 0; k2 < f.keys.length; k2++) {
        var kk2 = stripBare(gradeKey(f.keys[k2]))
        if (bare && bare === kk2) return f
      }
    }
  }
  return null
}

/* ------------------------------------------------------------
   تطبيع اسم الصف — الاسم المعتمد:
   • كل صيغ صفوف الابتدائي (الخامس/خمسة/خامسة/5/grade 5/الصف السادس
     الابتدائي/...) → الاسم المعتمد الكامل بتاع المنصة
   • صفوف الإعدادي والثانوي — نفس المنطق المثبت القديم
   ------------------------------------------------------------ */
export function normalizeGrade(grade: string): string {
  if (!grade) return ''
  var raw = String(grade).trim()
  if (!raw) return ''
  /* (توحيد الصفوف) عائلات الابتدائي الأول — كل الصيغ → الاسم المعتمد الكامل
     (لازم قبل فحوصات includes — «أولى ابتدائي» عمرها ما تبقى «أولى») */
  var primary = primaryGradeCanonical(raw)
  if (primary) return primary.ar
  var g = raw.replace(/^الصف\s+/i, '')
  g = g.replace(/الاعدادي/gi, 'إعدادي')
  g = g.replace(/الإعدادي/gi, 'إعدادي')
  g = g.replace(/البكالوريا/gi, 'بكالوريا')
  g = g.replace(/بكالوريا/gi, 'بكالوريا')
  if (g.includes('أولى') || g.includes('اولى') || g.includes('اولي') || g.includes('الأول')) g = 'أولى'
  if (g.includes('تانية') || g.includes('الثاني')) g = 'تانية'
  if (g.includes('تالتة') || g.includes('الثالث')) g = 'تالتة'
  /* نسخة مطوية الهمزات/الى من الاسم الأصلي — لفحص اللواحق عشان صيغ
     زي «اولي بكالوريا» (بدون همزة وبالياء) تلحق نفس الصف */
  var fold = String(raw).replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627').replace(/\u0649/g, '\u064A')
  // اللاحقات: إعدادي الأول — بعده الثانوي (بكالوريا = ثانوي حاجة واحدة)
  if (g === 'أولى' && fold.includes('عداد')) g = 'أولى إعدادي'
  if (g === 'تانية' && fold.includes('عداد')) g = 'تانية إعدادي'
  if (g === 'تالتة' && fold.includes('عداد')) g = 'تالتة إعدادي'
  if (g === 'أولى' && (fold.includes('كالور') || fold.includes('ثانوي'))) g = GRADE_S1
  // «أولى» لوحدها (تخزين قديم من قبل الإصلاح) = أولى بكالوريا برضه
  if (g === 'أولى') g = GRADE_S1
  return g
}

/* فلتر Prisma للقراءة: بيجيب كل صيغ نفس الصف مع بعض */
export function gradeWhere(grade: string): string | { in: string[] } {
  var vs = gradeVariants(grade)
  if (vs.length === 0) return normalizeGrade(grade)
  if (vs.length === 1) return vs[0]
  return { in: vs }
}

/* ------------------------------------------------------------
   (توحيد الصفوف) كل الصيغ المخزنة اللي تعني نفس الصف —
   مطابقة **تساوي حرفية** على القايمة دي مكان خدعة contains بكلمة واحدة.
   للصف الابتدائي: الاسم المعتمد + كل مفاتيح العيلة + الصيغ القصيرة
   القديمة (الخامس/خامس/خمسة ابتدائي/...) — عشان أي اسم اتخزن قبل
   التوحيد يظل يطابق، وعمرها ما تطابق صف تاني مهما كان قريب.
   ------------------------------------------------------------ */
export function gradeVariants(grade: string): string[] {
  var g = String(grade || '').trim()
  var n = normalizeGrade(g)
  var out: string[] = []
  if (g) out.push(g) // الصيغة الخام زي ما بعتها الطلب
  if (n) out.push(n) // الصيغة المطبعة الرسمية
  var fam = primaryGradeCanonical(g) || primaryGradeCanonical(n)
  if (fam) {
    out.push(fam.ar) // الاسم المعتمد الكامل
    for (var k = 0; k < fam.keys.length; k++) {
      var kk = String(fam.keys[k] || '').trim()
      if (kk) out.push(kk)
      var kb = stripBare(gradeKey(kk))
      if (kb) {
        out.push(kb) // «خامس» / «خمسة» ...
        /* «الخامس» / «الخمسة» — صيغ التقطيع القديمة (للعربي بس — ممنوع
           نعمل «ال5» و«الgrade 5» من المفاتيح اللاتينية والأرقام) */
        if (/[\u0600-\u06FF]/.test(kb)) out.push('ال' + kb)
      }
    }
    /* بادئة «الصف» — القايمة الرسمية بتاعة المنصة بتكتبها أصلًا في
       اسم السادس المعتمد، فبنضيفها بس للعائلات اللي اسمها من غيرها */
    if (fam.ar.indexOf('الصف ') !== 0) out.push('الصف ' + fam.ar)
  }
  if (n === GRADE_S1) {
    out.push(GRADE_S1_LEGACY) // «أولى ثانوي» — نفس الصف بالاسم القديم
    out.push('أولى')          // «أولى» لوحدها — تخزين قديم = أولى بكالوريا
  }
  if (n === 'أولى إعدادي' || n === 'تانية إعدادي' || n === 'تالتة إعدادي') {
    /* صيغ الإعدادي بالـ«ال» والهمزات — تخزين قديم شائع */
    var prepBase = n.split(' ')[0]
    out.push('ال' + prepBase + ' الإعدادي')
    out.push(prepBase + ' الاعدادي')
    out.push('الصف ' + n)
  }
  /* توأم إملائي محدود للكلمات اللي بتتباين في الى/ي بس — ممنوع استبدال
     عمي (كان بيخرّب «بكالوريا») */
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

/* ------------------------------------------------------------
   أي اسم قديم في بيانات مخزنة بيرجع معروض بالاسم المعتمد الكامل —
   «الخامس» بتظهر «خمسة ابتدائي» في شارة الطالب وقوائم الأدمن.
   ------------------------------------------------------------ */
export function displayGrade(grade?: string | null): string {
  var g = String(grade || '').trim()
  if (!g) return ''
  if (g.indexOf('كالوريا') !== -1) return GRADE_S1
  var fam = primaryGradeCanonical(g)
  if (fam) return fam.ar
  return g
}

/* قيمة بتتخزن (كتابة جديدة دايمًا بالاسم المعتمد الكامل) */
export function storeGrade(grade?: string | null): string {
  var g = normalizeGrade(String(grade || ''))
  return g || String(grade || '')
}
