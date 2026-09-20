// @ts-nocheck
// ============================================================
// FILE: src/lib/question-gen.ts
// PURPOSE: محرك توليد الأسئلة الرياضية المحلي (القلب الرياضي للميزات الجديدة):
//   • «اتدرب أكتر» (Smart Question Generator) — fallback ذكي مضمون لما
//     الذكاء الاصطناعي (ZAI/Gemini) مش متاح أو رجّع JSON بايظ
//   • «ساحة التحدي» — أسئلة اختياري (MCQ) بأرقام عشوائية جديدة كل مرة
//   • «تحدي الفلاش كاردز» — بطاقات سريعة بنفس المحرك
// القاعدة الذهبية: كل إجابة **محسوبة بالكود** (مش مخزنة) → الدقة 100%
// دايمًا، والأرقام بتتغير كل توليد → «10 أسئلة فريدة بأرقام وخدع مختلفة».
// المحتوى: منهج مصري (جبر/كسور/نِسب/هندسة/فيثاغورس/أسس/إحصاء) بأسلوب
// عامي تعليمي واضح زي شرح المستر بالظبط.
// ============================================================

export interface PracticeQuestion {
  id: string
  question: string
  answer: string
  steps: string[]
  trick: string
  topic: string
  difficulty: string // سهل | متوسط | صعب
}

export interface BattleQuestion {
  id: string
  text: string
  options: string[] // 4 اختيارات
  correctIndex: number
  explanation: string
  timeLimitSec: number
}

export interface MindMapNode {
  id: string
  label: string
  note?: string
  children?: MindMapNode[]
}

export interface MindMapData {
  title: string
  summary?: string
  root: MindMapNode
}

/* ---------- أدوات عشوائية ---------- */
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function shuffle(arr) {
  var a = arr.slice()
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { var t = b; b = a % b; a = t }
  return a || 1
}
function uid() {
  return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/* نتيجة مولّد — answerNum للأجوبة الرقمية (بنبني منها اختيارات خاطئة ذكية)،
   و distractors للإجابات النصية (كسور/زوج جذور/حدود جبرية) */
interface GenQ {
  text: string
  answer: string
  answerNum: number | null
  steps: string[]
  trick: string
  topic: string
  distractors?: string[]
}

/* ============================================================
 * المولّدات — كل واحدة بترجع سؤال صحيح حسابيًا مضمون
 * hard=true → أرقام أكبر/خطوتين (مستوى صعب)
 * ============================================================ */

function genLinear(hard: boolean): GenQ {
  var x = ri(2, hard ? 15 : 9)
  var a = ri(2, hard ? 12 : 6)
  var b = ri(-14, 14)
  if (b === 0) b = 7
  var c = a * x + b
  var bTxt = b > 0 ? ('+ ' + b) : ('− ' + Math.abs(b))
  return {
    text: 'لو ' + a + 'x ' + bTxt + ' = ' + c + ' ، قيمة x = ؟',
    answer: String(x),
    answerNum: x,
    steps: [
      'انقل ' + (b > 0 ? b : ('− ' + Math.abs(b))) + ' للطرف التاني: ' + a + 'x = ' + (c - b),
      'اقسم الطرفين على ' + a + ': x = ' + (c - b) + ' ÷ ' + a + ' = ' + x,
    ],
    trick: 'في معادلة درجة أولى: خلي المجهول لوحده في طرف، والأرقام في الطرف التاني — وبس.',
    topic: 'معادلات الدرجة الأولى',
  }
}

function genLinearBrackets(hard: boolean): GenQ {
  var x = ri(2, hard ? 12 : 8)
  var a = ri(2, 6)
  var b = ri(-9, 9)
  if (b === 0) b = 3
  var c = a * (x + b)
  var bTxt = b > 0 ? ('+ ' + b) : ('− ' + Math.abs(b))
  return {
    text: 'احسب قيمة x: ' + a + '(x ' + bTxt + ') = ' + c,
    answer: String(x),
    answerNum: x,
    steps: [
      'اقسم الطرفين على ' + a + ': x ' + bTxt + ' = ' + (c / a),
      'انقل ' + (b > 0 ? b : ('− ' + Math.abs(b))) + ' للطرف التاني: x = ' + x,
    ],
    trick: 'الأقواس الأول: تقدر تقسم الطرفين على الرقم اللي جنب القوس قبل ما تفتحه — أسرع بكتير.',
    topic: 'معادلات بالأقواس',
  }
}

function genSystem2x2(hard: boolean): GenQ {
  var x = ri(1, hard ? 12 : 8)
  var y = ri(1, hard ? 12 : 8)
  var p = x + y
  var q = x - y
  return {
    text: 'حل نظام المعادلتين:  x + y = ' + p + '  ،  x − y = ' + q,
    answer: 'x = ' + x + ' ، y = ' + y,
    answerNum: null,
    distractors: [
      'x = ' + y + ' ، y = ' + x,
      'x = ' + (x + 1) + ' ، y = ' + (y - 1),
      'x = ' + (x - 1) + ' ، y = ' + (y + 1),
    ],
    steps: [
      'اجمع المعادلتين: (x + y) + (x − y) = 2x = ' + (p + q) + ' → x = ' + x,
      'عوّض في الأولى: ' + x + ' + y = ' + p + ' → y = ' + y,
    ],
    trick: 'الطريقة المثلثية: جمع المعادلتين بيلغي y على طول — خد بالك من الإشارات.',
    topic: 'نظام المعادلات',
  }
}

function genQuadratic(): GenQ {
  var r1 = ri(1, 9)
  var r2 = ri(1, 9)
  while (r2 === r1) r2 = ri(1, 9)
  var s = r1 + r2
  var pr = r1 * r2
  return {
    text: 'حل المعادلة التربيعية: x² − ' + s + 'x + ' + pr + ' = 0',
    answer: 'x = ' + Math.min(r1, r2) + ' أو x = ' + Math.max(r1, r2),
    answerNum: null,
    distractors: [
      'x = ' + (r1 + 1) + ' أو x = ' + r2,
      'x = ' + r1 + ' أو x = ' + (r2 - 1),
      'x = ' + (-r1) + ' أو x = ' + (-r2),
    ],
    steps: [
      'محتاجين رقمين: حاصل ضربهم ' + pr + ' ومجموعهم ' + s,
      'الرقمين هما ' + r1 + ' و ' + r2 + ' → (x − ' + r1 + ')(x − ' + r2 + ') = 0',
      'يبقى: x = ' + r1 + ' أو x = ' + r2,
    ],
    trick: 'في الشكل x² − sx + p: دوّر على العاملين اللي ضربهم p ومجموعهم s — بيتحلوا في ثواني.',
    topic: 'المعادلات التربيعية',
  }
}

function genFraction(op: '+' | '−', hard: boolean): GenQ {
  var b = ri(2, hard ? 12 : 8)
  var d = ri(2, hard ? 12 : 8)
  var a = ri(1, b - 1)
  var c = ri(1, d - 1)
  var lcd = (b * d) / gcd(b, d)
  var num = op === '+' ? (a * (lcd / b) + c * (lcd / d)) : (a * (lcd / b) - c * (lcd / d))
  var g = gcd(Math.abs(num), lcd)
  var n2 = num / g
  var d2 = lcd / g
  var frac = function (x: number, y: number) { return x + '/' + y }
  var answer = d2 === 1 ? String(n2) : frac(n2, d2)
  var opTxt = op === '+' ? '+' : '−'
  var distractors: string[] = []
  var cands = op === '+' ? [num + 1, num - 1] : [num + 1, Math.abs(num - 2)]
  for (var i = 0; i < cands.length; i++) {
    var gg = gcd(Math.abs(cands[i]), lcd)
    var nn = cands[i] / gg, dd = lcd / gg
    var sTxt = dd === 1 ? String(nn) : (nn + '/' + dd)
    if (sTxt !== answer && distractors.indexOf(sTxt) === -1) distractors.push(sTxt)
  }
  var gg2 = gcd(Math.abs(a * d + c * b), b * d)
  var crossTxt = (b * d === gg2) ? String((a * d + c * b) / gg2) : (((a * d + c * b) / gg2) + '/' + (b * d / gg2))
  if (crossTxt !== answer && distractors.indexOf(crossTxt) === -1) distractors.push(crossTxt)
  return {
    text: 'احسب:  ' + a + '/' + b + ' ' + opTxt + ' ' + c + '/' + d + '  = ؟',
    answer: answer,
    answerNum: null,
    distractors: distractors.slice(0, 3),
    steps: [
      'القوام المشترك الأصغر = ' + lcd + '  (لأن ' + b + ' × ' + (lcd / b) + ' = ' + lcd + ' و ' + d + ' × ' + (lcd / d) + ' = ' + lcd + ')',
      op === '+'
        ? ('الجمع: (' + (a * (lcd / b)) + ' + ' + (c * (lcd / d)) + ') ÷ ' + lcd + ' = ' + num + '/' + lcd)
        : ('الطرح: (' + (a * (lcd / b)) + ' − ' + (c * (lcd / d)) + ') ÷ ' + lcd + ' = ' + num + '/' + lcd),
      num < 0 ? 'الناتج سالب — خد إشارته معاك في الاختصار' : 'اختصر بقسمة على ' + g + ' → ' + answer,
    ],
    trick: 'القاعدة: نجمع البسط على قوام مشترك — **ممنوع** نجمع البسط مع البسط والمقام مع المقام.',
    topic: 'جمع وطرح الكسور',
  }
}

function genFractionMul(hard: boolean): GenQ {
  var b = ri(2, hard ? 10 : 6)
  var d = ri(2, hard ? 10 : 6)
  var a = ri(1, b)
  var c = ri(1, d)
  var num = a * c
  var den = b * d
  var g = gcd(num, den)
  var n2 = num / g, d2 = den / g
  var answer = d2 === 1 ? String(n2) : (n2 + '/' + d2)
  return {
    text: 'احسب:  ' + a + '/' + b + ' × ' + c + '/' + d + '  = ؟',
    answer: answer,
    answerNum: null,
    distractors: [
      d2 === 1 ? String(n2 + 1) : ((n2 + 1) + '/' + d2),
      (a + c) + '/' + (b + d),
      (a * d + c * b) + '/' + (b * d),
    ].filter(function (s) { return s !== answer }).slice(0, 3),
    steps: [
      'الضرب: بسط × بسط والمقام × مقام = ' + num + '/' + den,
      'اختصر بقسمة على ' + g + ' → ' + answer,
    ],
    trick: 'في ضرب الكسور اختصر **قبل** ما تضرب — بتوفر وقت ومجهود.',
    topic: 'ضرب الكسور',
  }
}

function genPercentOf(hard: boolean): GenQ {
  var p = pick(hard ? [15, 35, 45, 65, 85] : [5, 10, 20, 25, 50])
  var N = ri(2, hard ? 30 : 12) * 20
  var ans = (p * N) / 100
  return {
    text: 'احسب:  ' + p + '% من ' + N + ' = ؟',
    answer: String(ans),
    answerNum: ans,
    steps: [
      'حوّل النسبة لكسر: ' + p + '% = ' + p + '/100',
      'اضرب: ' + p + ' × ' + N + ' ÷ 100 = ' + ans,
    ],
    trick: '10% = انقسم على 10، و50% = النص، و25% = الربع — احفظ السريعات دي.',
    topic: 'النسبة المئوية',
  }
}

function genPercentChange(hard: boolean): GenQ {
  var up = Math.random() < 0.6
  var M = pick([100, 200, 300, 400, 500, 800])
  var p = pick(hard ? [15, 30, 45] : [10, 20, 25, 50])
  var ans = up ? (M * (100 + p) / 100) : (M * (100 - p) / 100)
  return {
    text: up
      ? ('سعر سلعة ' + M + ' جنيه وزاد ' + p + '% — السعر الجديد كام؟')
      : ('سعر سلعة ' + M + ' جنيه نقص ' + p + '% — السعر الجديد كام؟'),
    answer: String(ans),
    answerNum: ans,
    steps: [
      'قيمة التغيير = ' + p + '% من ' + M + ' = ' + ((p * M) / 100) + ' جنيه',
      up ? 'الجديد = ' + M + ' + ' + ((p * M) / 100) + ' = ' + ans : 'الجديد = ' + M + ' − ' + ((p * M) / 100) + ' = ' + ans,
    ],
    trick: 'زيادة: اضرب في (1 + p/100) — نقص: اضرب في (1 − p/100) — خطوة واحدة.',
    topic: 'تغيرات النسبة المئوية',
  }
}

function genPercentChain(): GenQ {
  var combos = [
    { M: 200, up: 25, down: 10 }, { M: 400, up: 20, down: 10 },
    { M: 300, up: 20, down: 20 }, { M: 500, up: 10, down: 20 },
    { M: 600, up: 50, down: 20 },
  ]
  var c = pick(combos)
  var mid = (c.M * (100 + c.up)) / 100
  var fin = (mid * (100 - c.down)) / 100
  return {
    text: 'سعر تليفون ' + c.M + ' جنيه وزاد ' + c.up + '% وبعدين نقص ' + c.down + '% — السعر النهائي كام؟',
    answer: String(fin),
    answerNum: fin,
    steps: [
      'بعد الزيادة: ' + c.M + ' × ' + (100 + c.up) + '/100 = ' + mid,
      'بعد النقص: ' + mid + ' × ' + (100 - c.down) + '/100 = ' + fin,
    ],
    trick: 'ممنوع تجمع النسب (+15% و −10% مش 5%) — كل تغيير بيحصل على السعر الجديد بتاعه.',
    topic: 'نسب مئوية متتالية',
    difficulty: 'صعب',
  }
}

var PYTHO_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [20, 21, 29], [10, 24, 26], [18, 24, 30]]

function genPythagoras(hard: boolean): GenQ {
  var t = pick(hard ? PYTHO_TRIPLES.slice(4) : PYTHO_TRIPLES.slice(0, 5))
  var askHyp = Math.random() < 0.6
  if (askHyp) {
    var cAns = t[2]
    return {
      text: 'مثلث قائم الزاوية طول ضلعا القائمتين ' + t[0] + ' و ' + t[1] + ' — احسب طول الوتر',
      answer: String(cAns),
      answerNum: cAns,
      steps: [
        'قانون فيثاغورس: (الوتر)² = (الضلع الأول)² + (الضلع التاني)²',
        '(الوتر)² = ' + t[0] + '² + ' + t[1] + '² = ' + (t[0] * t[0]) + ' + ' + (t[1] * t[1]) + ' = ' + (t[2] * t[2]),
        'الوتر = جذر ' + (t[2] * t[2]) + ' = ' + cAns,
      ],
      trick: 'احفظ الثلاثيات الشهيرة (3،4،5) و(5،12،13) و(8،15،17) — بتوفر نص الوقت.',
      topic: 'نظرية فيثاغورس',
    }
  }
  // ضلع ناقص: نعطي الوتر وقائم واحد
  var miss = t[0]
  var known = t[1]
  return {
    text: 'مثلث قائم الزاوية طول وتره ' + t[2] + ' وأحد ضلعي القائمة ' + known + ' — احسب الضلع القائم التاني',
    answer: String(miss),
    answerNum: miss,
    steps: [
      '(الوتر)² = (القائم الأول)² + (القائم التاني)²',
      (t[2] * t[2]) + ' = ' + (known * known) + ' + (القائم التاني)²',
      '(القائم التاني)² = ' + (t[2] * t[2] - known * known) + ' → القائم التاني = ' + miss,
    ],
    trick: 'الوتر دايمًا **أطول** ضلع — لو طلع منك أصغر يبقى في غلطة في الحساب.',
    topic: 'نظرية فيثاغورس (عكسي)',
  }
}

function genRectArea(hard: boolean): GenQ {
  var askArea = Math.random() < 0.5
  var w = ri(3, hard ? 18 : 10)
  var h = ri(3, hard ? 15 : 9)
  if (askArea) {
    var a = w * h
    return {
      text: 'مستطيل طوله ' + w + ' سم وعرضه ' + h + ' سم — احسب مساحته',
      answer: String(a),
      answerNum: a,
      steps: ['مساحة المستطيل = الطول × العرض', 'المساحة = ' + w + ' × ' + h + ' = ' + a + ' سم²'],
      trick: 'المساحة دايمًا بوحدة **مربعة** (سم²) — متنساش تكتبها.',
      topic: 'مساحة المستطيل',
    }
  }
  var p = 2 * (w + h)
  return {
    text: 'مستطيل طوله ' + w + ' سم وعرضه ' + h + ' سم — احسب محيطه',
    answer: String(p),
    answerNum: p,
    steps: ['محيط المستطيل = 2 × (الطول + العرض)', 'المحيط = 2 × (' + w + ' + ' + h + ') = ' + p + ' سم'],
    trick: 'المحيط لف حوالي الشكل — بوحدة خطية عادية (سم) مش مربعة.',
    topic: 'محيط المستطيل',
  }
}

function genTriangleArea(): GenQ {
  var b = ri(2, 12) * 2
  var h = ri(3, 12)
  var a = (b * h) / 2
  return {
    text: 'مثلث قاعدته ' + b + ' سم وارتفاعه ' + h + ' سم — مساحته = ؟',
    answer: String(a),
    answerNum: a,
    steps: ['مساحة المثلث = ½ × القاعدة × الارتفاع', 'المساحة = ½ × ' + b + ' × ' + h + ' = ' + a + ' سم²'],
    trick: 'الارتفاع لازم يكون **عمودي** على القاعدة — مش أي ضلع يبقى ارتفاع.',
    topic: 'مساحة المثلث',
  }
}

function genCircle(): GenQ {
  var r = pick([7, 14, 21, 28, 35])
  var askArea = Math.random() < 0.5
  if (askArea) {
    var a = (22 * r * r) / 7
    return {
      text: 'دائرة نصف قطرها ' + r + ' سم — احسب مساحتها (π = 22/7)',
      answer: String(a),
      answerNum: a,
      steps: [
        'مساحة الدائرة = π × نق²',
        'المساحة = 22/7 × ' + r + ' × ' + r + ' = ' + a + ' سم²',
      ],
      trick: 'لما نق من مضاعفات 7 خلي π = 22/7 — القسمة بتطلع سليمة على طول.',
      topic: 'مساحة الدائرة',
    }
  }
  var c = (44 * r) / 7
  return {
    text: 'دائرة نصف قطرها ' + r + ' سم — احسب محيطها (π = 22/7)',
    answer: String(c),
    answerNum: c,
    steps: [
      'محيط الدائرة = 2 × π × نق',
      'المحيط = 2 × 22/7 × ' + r + ' = ' + c + ' سم',
    ],
    trick: 'المحيط = 44/7 × نق — مضاعفات 7 بتقسم جميل.',
    topic: 'محيط الدائرة',
  }
}

function genCuboidVol(): GenQ {
  var l = ri(2, 12), w = ri(2, 10), h = ri(2, 9)
  var v = l * w * h
  return {
    text: 'متوازي مستطيلات أبعاده ' + l + ' × ' + w + ' × ' + h + ' سم — حجمه = ؟',
    answer: String(v),
    answerNum: v,
    steps: ['الحجم = الطول × العرض × الارتفاع', 'الحجم = ' + l + ' × ' + w + ' × ' + h + ' = ' + v + ' سم³'],
    trick: 'الحجم دايمًا وحدة **مكعبة** (سم³) — التلات أبعاد بتتضرب في بعض.',
    topic: 'حجم متوازي المستطيلات',
  }
}

function genCylinderVol(): GenQ {
  var r = pick([7, 14, 21])
  var h = ri(3, 15)
  var v = (22 * r * r * h) / 7
  return {
    text: 'أسطوانة نصف قطر قاعدتها ' + r + ' سم وارتفاعها ' + h + ' سم — حجمها (π = 22/7)؟',
    answer: String(v),
    answerNum: v,
    steps: [
      'حجم الأسطوانة = π × نق² × الارتفاع',
      'الحجم = 22/7 × ' + (r * r) + ' × ' + h + ' = ' + v + ' سم³',
    ],
    trick: 'فكر فيها كطبقات دائرية فوق بعض: مساحة القاعدة × الارتفاع.',
    topic: 'حجم الأسطوانة',
  }
}

function genExponents(hard: boolean): GenQ {
  var kind = ri(1, 3)
  var a = pick([2, 3, 5])
  var m = ri(2, hard ? 5 : 3)
  var n = ri(2, hard ? 4 : 3)
  if (kind === 1) {
    var ans = Math.pow(a, m + n)
    return {
      text: 'احسب:  ' + a + '^' + m + ' × ' + a + '^' + n + ' = ؟',
      answer: String(ans),
      answerNum: ans,
      steps: [
        'نفس الأساس → نجمع الأسس: ' + a + '^(' + m + '+' + n + ') = ' + a + '^' + (m + n),
        'الناتج = ' + ans,
      ],
      trick: 'قانون الضرب لنفس الأساس: اجمع الأسس — الأساس بيفضل زي ما هو.',
      topic: 'قوانين الأسس',
    }
  }
  if (kind === 2) {
    var m2 = Math.max(m, n), n2 = Math.min(m, n)
    var ans2 = Math.pow(a, m2 - n2)
    return {
      text: 'احسب:  ' + a + '^' + m2 + ' ÷ ' + a + '^' + n2 + ' = ؟',
      answer: String(ans2),
      answerNum: ans2,
      steps: [
        'القسمة لنفس الأساس → نطرح الأسس: ' + a + '^(' + m2 + '−' + n2 + ') = ' + a + '^' + (m2 - n2),
        'الناتج = ' + ans2,
      ],
      trick: 'قسمة = طرح الأسس. ضرب = جمع الأسس. متقلطش بينهم.',
      topic: 'قوانين الأسس',
    }
  }
  var ans3 = Math.pow(a, m * n)
  return {
    text: 'احسب:  (' + a + '^' + m + ')^' + n + ' = ؟',
    answer: String(ans3),
    answerNum: ans3,
    steps: [
      'قوة فوق قوة → نضرب الأسس: ' + a + '^(' + m + '×' + n + ') = ' + a + '^' + (m * n),
      'الناتج = ' + ans3,
    ],
    trick: 'قوة خارجية على قوة داخلية = ضرب الأسس في بعض.',
    topic: 'قوانين الأسس',
  }
}

function genRoots(hard: boolean): GenQ {
  if (hard && Math.random() < 0.5) {
    var a = ri(2, 9), b = ri(2, 9)
    var ans = a * b
    return {
      text: 'احسب:  √(' + (a * a) + ' × ' + (b * b) + ') = ؟',
      answer: String(ans),
      answerNum: ans,
      steps: [
        '√(x × y) = √x × √y',
        '= ' + a + ' × ' + b + ' = ' + ans,
      ],
      trick: 'الجذر بيتبعظ على الضرب: جذر كل عامل لوحده وبعدين اضرب.',
      topic: 'الجذور التربيعية',
    }
  }
  var n = ri(4, 30)
  return {
    text: 'احسب:  √' + (n * n) + ' = ؟',
    answer: String(n),
    answerNum: n,
    steps: ['محتاجين رقم لو ضرب نفسه يطلع ' + (n * n), 'الرقم هو ' + n + ' لأن ' + n + ' × ' + n + ' = ' + (n * n)],
    trick: 'احفظ المربعات الكاملة لحد 30² — الجذور بتبقى لعبة أطفال.',
    topic: 'الجذور التربيعية',
  }
}

function genAverage(hard: boolean): GenQ {
  var avg = ri(5, hard ? 40 : 20)
  var n1 = avg - ri(1, 6)
  var n2 = avg + ri(1, 6)
  var n3 = avg - ri(1, 4)
  var n4 = 4 * avg - n1 - n2 - n3
  if (n4 <= 0 || n4 === n1 || n4 === n2 || n4 === n3) {
    n4 = avg + ri(1, 5)
    n3 = 4 * avg - n1 - n2 - n4
    if (n3 <= 0) n3 = avg
  }
  return {
    text: 'درجات طالب في 4 مواد: ' + n1 + ' ، ' + n2 + ' ، ' + n3 + ' ، ' + n4 + ' — المتوسط الحسابي = ؟',
    answer: String(avg),
    answerNum: avg,
    steps: [
      'المجموع = ' + n1 + ' + ' + n2 + ' + ' + n3 + ' + ' + n4 + ' = ' + (4 * avg),
      'المتوسط = المجموع ÷ العدد = ' + (4 * avg) + ' ÷ 4 = ' + avg,
    ],
    trick: 'خدعة: لو الأرقام قريبة من بعض، حدد الرقم اللي بينهم — غالبًا هو المتوسط.',
    topic: 'المتوسط الحسابي',
  }
}

function genSpeed(hard: boolean): GenQ {
  var v = pick(hard ? [45, 65, 75, 85] : [40, 50, 60, 70, 80])
  var t = ri(2, hard ? 6 : 4)
  var s = v * t
  var kind = ri(1, 2)
  if (kind === 1) {
    return {
      text: 'عربية بتتحرك بسرعة ' + v + ' كم/ساعة لمدة ' + t + ' ساعات — المسافة المقطوعة؟',
      answer: String(s),
      answerNum: s,
      steps: ['المسافة = السرعة × الزمن', 'المسافة = ' + v + ' × ' + t + ' = ' + s + ' كم'],
      trick: 'المثلث السحري: المسافة فوق، السرعة والزمن تحت — غطي اللي عايزه.',
      topic: 'السرعة والمسافة',
    }
  }
  return {
    text: 'عربية قطعت مسافة ' + s + ' كم بسرعة ' + v + ' كم/ساعة — الزمن اللي أخدته؟',
    answer: String(t),
    answerNum: t,
    steps: ['الزمن = المسافة ÷ السرعة', 'الزمن = ' + s + ' ÷ ' + v + ' = ' + t + ' ساعة'],
    trick: 'الزمن = مسافة ÷ سرعة — واحفظ الوحدات: كم ÷ كم/ساعة = ساعة.',
    topic: 'السرعة والزمن',
  }
}

function genLcmGcd(): GenQ {
  var a = ri(4, 24), b = ri(4, 24)
  var wantGcd = Math.random() < 0.5
  if (wantGcd) {
    var g = gcd(a, b)
    return {
      text: 'احسب العامل المشترك الأكبر للعددين ' + a + ' و ' + b,
      answer: String(g),
      answerNum: g,
      steps: [
        'عوامل ' + a + ': ' + factorsText(a),
        'عوامل ' + b + ': ' + factorsText(b),
        'أكبر عامل مشترك = ' + g,
      ],
      trick: 'العامل المشترك الأكبر مفيش أكبر من أصغر العددين — استبعد فورًا أي رقم أكبر.',
      topic: 'العامل المشترك الأكبر',
    }
  }
  var l = (a * b) / gcd(a, b)
  return {
    text: 'احسب المضاعف المشترك الأصغر للعددين ' + a + ' و ' + b,
    answer: String(l),
    answerNum: l,
    steps: [
      'العامل المشترك الأكبر = ' + gcd(a, b),
      'م.م.أ = (العدد الأول × التاني) ÷ ع.م.أ = ' + (a * b) + ' ÷ ' + gcd(a, b) + ' = ' + l,
    ],
    trick: 'م.م.أ دايمًا ≥ أكبر عدد، وع.م.أ دايمًا ≤ أصغر عدد.',
    topic: 'المضاعف المشترك الأصغر',
  }
}

function factorsText(n: number): string {
  var out: string[] = []
  for (var i = 1; i <= n; i++) if (n % i === 0) out.push(String(i))
  return out.join(' ، ')
}

function genLikeTerms(): GenQ {
  var add = Math.random() < 0.5
  var v = pick(['x', 'س', 'ص'])
  if (add) {
    var a = ri(3, 12), b = ri(2, 9)
    return {
      text: 'بسّط:  ' + a + v + ' + ' + b + v + ' = ؟',
      answer: (a + b) + v,
      answerNum: null,
      distractors: [(a * b) + v, (a + b) + v + '²', (a + b + 1) + v],
      steps: [
        'الحدود المتشابهة (نفس ' + v + ') بتتجمع',
        '(' + a + ' + ' + b + ')' + v + ' = ' + (a + b) + v,
      ],
      trick: 'الحدود المتشابهة زي التفاح مع التفاح: 3 تفاح + 5 تفاح = 8 تفاح.',
      topic: 'تبسيط الحدود الجبرية',
    }
  }
  var a2 = ri(5, 14), b2 = ri(2, 4)
  return {
    text: 'بسّط:  ' + a2 + v + ' − ' + b2 + v + ' = ؟',
    answer: (a2 - b2) + v,
    answerNum: null,
    distractors: [(a2 - b2 - 1) + v, (a2 * b2) + v, (a2 - b2) + v + '²'],
    steps: [
      'نطرح المعاملات لأن الحدود متشابهة',
      '(' + a2 + ' − ' + b2 + ')' + v + ' = ' + (a2 - b2) + v,
    ],
    trick: 'متقدرش تطرح حدود مختلفة: x − y عمرها ما تبقى حد واحد.',
    topic: 'تبسيط الحدود الجبرية',
  }
}

function genProportion(): GenQ {
  var unit = pick([3, 4, 5, 6, 8, 10, 12, 15])
  var q1 = ri(2, 6)
  var q2 = q1 + ri(1, 6)
  var p1 = unit * q1
  var ans = unit * q2
  var item = pick(['قلم', 'كشكول', 'مسطرة', 'دفتر'])
  return {
    text: 'لو ' + q1 + ' قطع من ' + item + ' ثمنها ' + p1 + ' جنيه، يبقى ' + q2 + ' قطع من نفس النوع ثمنها ؟',
    answer: String(ans),
    answerNum: ans,
    steps: [
      'سعر القطعة الواحدة = ' + p1 + ' ÷ ' + q1 + ' = ' + unit + ' جنيه',
      'سعر ' + q2 + ' قطع = ' + unit + ' × ' + q2 + ' = ' + ans + ' جنيه',
    ],
    trick: 'في التناسب الطردي: اقسم عشان تطلع سعر الوحدة، وبعدين اضرب.',
    topic: 'النسبة والتناسب',
  }
}

function genTriangleAngles(): GenQ {
  var a1 = ri(30, 75)
  var a2 = ri(30, 80)
  while (a2 === a1) a2 = ri(30, 80)
  var a3 = 180 - a1 - a2
  if (a3 < 15) { a3 = 15 + ri(0, 20); a1 = 180 - a2 - a3 }
  return {
    text: 'مثلث زاويتين منه ' + a1 + '° و ' + a2 + '° — احسب الزاوية التالتة',
    answer: String(a3),
    answerNum: a3,
    steps: [
      'مجموع زوايا المثلث = 180°',
      'الزاوية التالتة = 180 − (' + a1 + ' + ' + a2 + ') = ' + a3 + '°',
    ],
    trick: 'قاعدة 180 في المثلث من أهم القوانين — بتحل بيها نص أسئلة الهندسة.',
    topic: 'زوايا المثلث',
  }
}

function genSimplifyFraction(): GenQ {
  var g = pick([2, 3, 4, 5, 6])
  var n2 = ri(2, 9)
  var num = n2 * g
  var den = n2 * g + g * ri(1, 5)
  var gg = gcd(num, den)
  var ans = (num / gg) + '/' + (den / gg)
  return {
    text: 'بسّط الكسر:  ' + num + '/' + den,
    answer: ans,
    answerNum: null,
    distractors: [
      (num / (gg * 2) === Math.floor(num / (gg * 2)) && den / (gg * 2) === Math.floor(den / (gg * 2))) ? (num / (gg * 2)) + '/' + (den / (gg * 2)) : (num) + '/' + (den + 1),
      (num - 1) + '/' + (den - 1),
      (num) + '/' + (den - gg),
    ].filter(function (s) { return s !== ans && s.indexOf('/') > 0 }).slice(0, 3),
    steps: [
      'العامل المشترك الأكبر لـ ' + num + ' و ' + den + ' = ' + gg,
      'اقسم البسط والمقام على ' + gg + ' → ' + ans,
    ],
    trick: 'الاختصار: اقسم البسط **والمقام** على نفس الرقم — لو حسّيت واحد فيهم كسر يبقى الغلط.',
    topic: 'تبسيط الكسور',
  }
}

var GENERATORS_EASY = [genLinear, genPercentOf, genRectArea, genAverage, genExponents, genRoots, genSpeed, genLikeTerms, genSimplifyFraction, genTriangleAngles, genProportion, genFractionMul]
var GENERATORS_MED = [genFraction, genPythagoras, genCircle, genCuboidVol, genPercentChange, genSystem2x2, genLinearBrackets, genLcmGcd, genProportion, genCylinderVol, genTriangleArea]
var GENERATORS_HARD = [genQuadratic, genPercentChain, genSystem2x2, genPythagoras, genLinearBrackets, genFraction, genCylinderVol, genExponents]

/* ============================================================
 * 1) مولّد أسئلة «اتدرب أكتر» — 10 أسئلة بخطوات وخدع
 *    topic: كلام الطالب — بنحلل الكلمات المفتاحية ونختار المولّدات المناسبة
 * ============================================================ */
var TOPIC_KEYWORDS: Array<{ re: RegExp; keys: string[] }> = [
  { re: /(معادل|مجهول|equation|x\s*=|حل\s+و)/, keys: ['linear', 'brackets', 'system', 'quadratic'] },
  { re: /(تربيعية|تربيعي|x²|x\^2)/, keys: ['quadratic'] },
  { re: /(كسر|كسور|قوام|بسط|مقام)/, keys: ['fracAdd', 'fracSub', 'fracMul', 'simplify'] },
  { re: /(نسبة|مئوي|%|بالمئة|خصم|ربح)/, keys: ['percentOf', 'percentChange', 'percentChain'] },
  { re: /(فيثاغورس|قائم|وتر|قائمه)/, keys: ['pytho'] },
  { re: /(مساح|محيط|دائرة|مستطيل|مثلث|مربع)/, keys: ['rectArea', 'triArea', 'circle', 'angles'] },
  { re: /(حجم|أسطوانة|مكعب|متوازي)/, keys: ['cuboid', 'cylinder'] },
  { re: /(أس|أسس|قوة|أُس|قدرة)/, keys: ['exp', 'roots'] },
  { re: /(جذر|تربيع\s*الجذر|√)/, keys: ['roots'] },
  { re: /(متوسط|وسط\s*حسابي|إحصاء)/, keys: ['average'] },
  { re: /(سرعة|مسافة|زمن|ساعة|كم)/, keys: ['speed'] },
  { re: /(مضاعف|عامل\s+مشترك|تحليل)/, keys: ['lcmGcd'] },
  { re: /(تبسيط|حدود|جبر|متشابهة)/, keys: ['likeTerms'] },
  { re: /(تناسب|تناسب طردى|طردية|نسبة\s+سعر)/, keys: ['proportion'] },
]

function pickGeneratorsFor(topic: string): Array<{ fn: Function; key: string }> {
  var t = String(topic || '')
  var keys: string[] = []
  for (var i = 0; i < TOPIC_KEYWORDS.length; i++) {
    if (TOPIC_KEYWORDS[i].re.test(t)) {
      for (var k = 0; k < TOPIC_KEYWORDS[i].keys.length; k++) {
        if (keys.indexOf(TOPIC_KEYWORDS[i].keys[k]) === -1) keys.push(TOPIC_KEYWORDS[i].keys[k])
      }
    }
  }
  if (keys.length === 0) {
    // طلب عام → خليط متوازن من كل المنهج
    keys = ['linear', 'fracAdd', 'percentOf', 'pytho', 'rectArea', 'exp', 'average', 'speed', 'likeTerms', 'circle', 'system', 'proportion']
  }
  var map: Record<string, { fn: Function }> = {
    linear: { fn: genLinear }, brackets: { fn: genLinearBrackets }, system: { fn: genSystem2x2 },
    quadratic: { fn: genQuadratic }, fracAdd: { fn: function (h) { return genFraction('+', h) } },
    fracSub: { fn: function (h) { return genFraction('−', h) } }, fracMul: { fn: genFractionMul },
    simplify: { fn: genSimplifyFraction }, percentOf: { fn: genPercentOf },
    percentChange: { fn: genPercentChange }, percentChain: { fn: genPercentChain },
    pytho: { fn: genPythagoras }, rectArea: { fn: genRectArea }, triArea: { fn: genTriangleArea },
    circle: { fn: genCircle }, cuboid: { fn: genCuboidVol }, cylinder: { fn: genCylinderVol },
    exp: { fn: genExponents }, roots: { fn: genRoots }, average: { fn: genAverage },
    speed: { fn: genSpeed }, lcmGcd: { fn: genLcmGcd }, likeTerms: { fn: genLikeTerms },
    proportion: { fn: genProportion }, angles: { fn: genTriangleAngles },
  }
  var out = []
  for (var j = 0; j < keys.length; j++) {
    if (map[keys[j]]) out.push({ fn: map[keys[j]].fn, key: keys[j] })
  }
  return out.length > 0 ? out : [{ fn: genLinear, key: 'linear' }]
}

/* توليد 10 أسئلة تدريب — صعوبتها بتزيد تدريجيًا (3 سهل / 4 متوسط / 3 صعب) */
export function generatePracticeSet(topic: string): PracticeQuestion[] {
  var gens = pickGeneratorsFor(topic)
  var out: PracticeQuestion[] = []
  var usedTexts: Record<string, boolean> = {}
  var plan = ['easy', 'easy', 'easy', 'med', 'med', 'med', 'med', 'hard', 'hard', 'hard']
  var attempts = 0
  while (out.length < 10 && attempts < 120) {
    attempts++
    var idx = out.length
    var diff = plan[idx] || 'med'
    var g = gens[(idx + Math.floor(Math.random() * gens.length)) % gens.length]
    var hard = diff === 'hard'
    var q: GenQ = null
    try { q = g.fn(hard) } catch (e) { continue }
    if (!q || !q.text || usedTexts[q.text]) continue
    usedTexts[q.text] = true
    out.push({
      id: uid(),
      question: q.text,
      answer: String(q.answer),
      steps: (q.steps || []).map(function (s) { return String(s) }),
      trick: String(q.trick || ''),
      topic: String(q.topic || ''),
      difficulty: diff === 'easy' ? 'سهل' : (diff === 'med' ? 'متوسط' : 'صعب'),
    })
  }
  // لو اتعذر إكمال 10 (نظريًا مستحيل) — كرر بمولد عام
  while (out.length < 10) {
    var q2 = genLinear(true)
    out.push({ id: uid(), question: q2.text, answer: q2.answer, steps: q2.steps, trick: q2.trick, topic: q2.topic, difficulty: 'صعب' })
  }
  return out
}

/* ============================================================
 * 2) مولّد أسئلة ساحة التحدي (MCQ) — 4 اختيارات مع مشتتات ذكية
 * ============================================================ */
function buildDistractors(ansNum: number, count: number): string[] {
  var cands = [ansNum + 1, ansNum - 1, ansNum + 2, ansNum - 2, ansNum + 5, ansNum - 5, ansNum * 2, ansNum + 10, ansNum - 10, Math.round(ansNum / 2), ansNum + 3, ansNum - 3]
  var out: string[] = []
  cands = shuffle(cands)
  for (var i = 0; i < cands.length && out.length < count; i++) {
    var c = cands[i]
    if (c === ansNum || c <= 0 || out.indexOf(String(c)) !== -1) continue
    out.push(String(c))
  }
  return out
}

export function generateBattleQuestions(count: number, timeLimitSec?: number): BattleQuestion[] {
  var n = Math.max(3, Math.min(count || 8, 15))
  var pool = GENERATORS_EASY.concat(GENERATORS_MED, GENERATORS_HARD)
  var out: BattleQuestion[] = []
  var used: Record<string, boolean> = {}
  var guard = 0
  while (out.length < n && guard < 200) {
    guard++
    var g = pick(pool)
    var q: GenQ = null
    try { q = g(Math.random() < 0.25) } catch (e) { continue }
    if (!q || !q.text || used[q.text]) continue
    var options: string[] = []
    var correctTxt = String(q.answer)
    if (q.answerNum !== null && isFinite(q.answerNum)) {
      var dis = buildDistractors(q.answerNum, 3)
      if (dis.length < 3) continue
      options = shuffle([correctTxt].concat(dis))
    } else {
      var disTxt = (q.distractors || []).slice(0, 3)
      if (disTxt.length < 3) continue
      options = shuffle([correctTxt].concat(disTxt))
    }
    used[q.text] = true
    out.push({
      id: uid(),
      text: q.text,
      options: options,
      correctIndex: options.indexOf(correctTxt),
      explanation: (q.steps || []).join(' ← ') || String(q.trick || ''),
      timeLimitSec: timeLimitSec || (25 + Math.floor(Math.random() * 3) * 5),
    })
  }
  return out
}

/* بطاقات الفلاش كاردز — أسئلة قصيرة سريعة (8 ثواني للبطاقة) */
export function generateFlashcards(count: number): BattleQuestion[] {
  var qs = generateBattleQuestions(count, 8)
  return qs
}

/* تحقق من مجموعة أسئلة AI — لو ناقصة بنكملها محليًا (المولد ما يفشلش أبدًا) */
export function sanitizeAiPractice(items: any): PracticeQuestion[] {
  var out: PracticeQuestion[] = []
  if (Array.isArray(items)) {
    for (var i = 0; i < items.length && out.length < 10; i++) {
      var it = items[i] || {}
      var q = String(it.question || it.q || '').trim()
      var a = String(it.answer || it.a || '').trim()
      if (!q || !a) continue
      var steps = Array.isArray(it.steps) ? it.steps.map(function (s) { return String(s) }).filter(Boolean) : []
      if (steps.length === 0) steps = [a]
      out.push({
        id: uid(),
        question: q,
        answer: a,
        steps: steps.slice(0, 6),
        trick: String(it.trick || it.tip || '').trim(),
        topic: String(it.topic || '').trim(),
        difficulty: String(it.difficulty || 'متوسط').trim(),
      })
    }
  }
  return out
}
