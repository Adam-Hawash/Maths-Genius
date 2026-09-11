'use client'

/* ============================================================
 * Geometry Laws — قوانين الهندسة (طلب المستر:
 * «حاجة اسمها Geometry Laws بالانجليزي — ليه قانون الهندسة
 * تحط لي بيها كل الأشكال القوانين بتاعتها عشان أقدر أجيب
 * المساحة والأريا والبراميتر وكل حاجة تكون مظبوطة»)
 * صفحة مرجعية: كل الأشكال المستوية والحجمية + قوانينها المظبوطة
 * برسوم توضيحية SVG وبحث سريع بالعربي والإنجليزي.
 * ============================================================ */

import { useMemo, useState } from 'react'
import { ArrowRight, Search, Ruler, Box, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const C1 = '#10b981' // لون الشكل (emerald)
const C2 = '#f59e0b' // لون الارتفاعات والمساعدات (amber)
const CT = '#94a3b8' // لون الكتابات

interface Law {
  label: string
  formula: string
}
interface Shape {
  id: string
  ar: string
  en: string
  tags: string
  draw: React.ReactNode
  laws: Law[]
}

/* ---------- الرسوم التوضيحية (SVG) ---------- */

const svgProps = {
  viewBox: '0 0 220 130',
  className: 'w-full max-w-[280px] h-36',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
}

function Label({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <text x={x} y={y} fill={CT} fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="inherit">
      {children}
    </text>
  )
}

const DRAW = {
  square: (
    <svg {...svgProps}>
      <rect x="65" y="28" width="78" height="78" rx="2" stroke={C1} strokeWidth="2.5" />
      <line x1="65" y1="16" x2="143" y2="16" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="65" y1="11" x2="65" y2="21" stroke={C2} strokeWidth="1.5" />
      <line x1="143" y1="11" x2="143" y2="21" stroke={C2} strokeWidth="1.5" />
      <Label x={104} y={12}>أ</Label>
      <Label x={156} y={72}>أ</Label>
    </svg>
  ),
  rectangle: (
    <svg {...svgProps}>
      <rect x="30" y="38" width="160" height="58" rx="2" stroke={C1} strokeWidth="2.5" />
      <line x1="30" y1="26" x2="190" y2="26" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <Label x={110} y={22}>ل</Label>
      <Label x={203} y={72}>ع</Label>
    </svg>
  ),
  triangle: (
    <svg {...svgProps}>
      <polygon points="35,102 185,102 110,26" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="110" y1="26" x2="110" y2="102" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="110" y="94" width="8" height="8" stroke={C2} strokeWidth="1.2" />
      <Label x={110} y={118}>ق</Label>
      <Label x={122} y={62}>ع</Label>
    </svg>
  ),
  rightTriangle: (
    <svg {...svgProps}>
      <polygon points="55,102 175,102 55,28" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="55" y="94" width="8" height="8" stroke={C2} strokeWidth="1.2" />
      <Label x={115} y={118}>ض₂</Label>
      <Label x={42} y={68}>ض₁</Label>
      <Label x={130} y={52}>و</Label>
    </svg>
  ),
  equilateral: (
    <svg {...svgProps}>
      <polygon points="45,102 175,102 110,22" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <Label x={68} y={52}>أ</Label>
      <Label x={152} y={52}>أ</Label>
      <Label x={110} y={118}>أ</Label>
    </svg>
  ),
  parallelogram: (
    <svg {...svgProps}>
      <polygon points="55,98 165,98 185,34 75,34" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="85" y1="34" x2="85" y2="98" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="85" y="90" width="8" height="8" stroke={C2} strokeWidth="1.2" />
      <Label x={110} y={116}>ق</Label>
      <Label x={76} y={68}>ع</Label>
    </svg>
  ),
  rhombus: (
    <svg {...svgProps}>
      <polygon points="110,14 182,66 110,118 38,66" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="110" y1="14" x2="110" y2="118" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="38" y1="66" x2="182" y2="66" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <Label x={120} y={44}>ق₁</Label>
      <Label x={152} y={60}>ق₂</Label>
      <Label x={104} y={124}>أ</Label>
    </svg>
  ),
  trapezoid: (
    <svg {...svgProps}>
      <polygon points="55,102 185,102 160,34 75,34" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="80" y1="34" x2="80" y2="102" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="80" y="94" width="8" height="8" stroke={C2} strokeWidth="1.2" />
      <Label x={120} y={120}>ق₁</Label>
      <Label x={117} y={26}>ق₂</Label>
      <Label x={70} y={70}>ع</Label>
    </svg>
  ),
  circle: (
    <svg {...svgProps}>
      <circle cx="110" cy="66" r="46" stroke={C1} strokeWidth="2.5" />
      <line x1="110" y1="66" x2="156" y2="66" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="110" cy="66" r="2.5" fill={C2} />
      <Label x={134} y={58}>نق</Label>
    </svg>
  ),
  sector: (
    <svg {...svgProps}>
      <path d="M 110 88 L 168 88 A 58 58 0 0 0 81 31 Z" stroke={C1} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="110" cy="88" r="2.5" fill={C2} />
      <Label x={137} y={82}>نق</Label>
      <Label x={124} y={102}>هـ</Label>
    </svg>
  ),
  cube: (
    <svg {...svgProps}>
      <rect x="42" y="22" width="62" height="62" rx="2" stroke={C1} strokeWidth="2" strokeDasharray="4 3" />
      <rect x="66" y="44" width="62" height="62" rx="2" stroke={C1} strokeWidth="2.5" />
      <line x1="66" y1="44" x2="42" y2="22" stroke={C1} strokeWidth="2" />
      <line x1="128" y1="44" x2="104" y2="22" stroke={C1} strokeWidth="2" />
      <line x1="128" y1="106" x2="104" y2="84" stroke={C1} strokeWidth="2" />
      <line x1="66" y1="106" x2="42" y2="84" stroke={C1} strokeWidth="2" />
      <Label x={97} y={122}>أ</Label>
      <Label x={140} y={78}>أ</Label>
    </svg>
  ),
  cuboid: (
    <svg {...svgProps}>
      <rect x="34" y="24" width="84" height="58" rx="2" stroke={C1} strokeWidth="2" strokeDasharray="4 3" />
      <rect x="58" y="46" width="84" height="58" rx="2" stroke={C1} strokeWidth="2.5" />
      <line x1="58" y1="46" x2="34" y2="24" stroke={C1} strokeWidth="2" />
      <line x1="142" y1="46" x2="118" y2="24" stroke={C1} strokeWidth="2" />
      <line x1="142" y1="104" x2="118" y2="82" stroke={C1} strokeWidth="2" />
      <line x1="58" y1="104" x2="34" y2="82" stroke={C1} strokeWidth="2" />
      <Label x={100} y={122}>ل</Label>
      <Label x={154} y={80}>ع</Label>
      <Label x={42} y={40}>ا</Label>
    </svg>
  ),
  cylinder: (
    <svg {...svgProps}>
      <ellipse cx="110" cy="34" rx="46" ry="13" stroke={C1} strokeWidth="2.5" />
      <line x1="64" y1="34" x2="64" y2="100" stroke={C1} strokeWidth="2.5" />
      <line x1="156" y1="34" x2="156" y2="100" stroke={C1} strokeWidth="2.5" />
      <ellipse cx="110" cy="100" rx="46" ry="13" stroke={C1} strokeWidth="2.5" />
      <Label x={136} y={30}>نق</Label>
      <Label x={168} y={72}>ع</Label>
    </svg>
  ),
  cone: (
    <svg {...svgProps}>
      <line x1="110" y1="18" x2="62" y2="102" stroke={C1} strokeWidth="2.5" />
      <line x1="110" y1="18" x2="158" y2="102" stroke={C1} strokeWidth="2.5" />
      <ellipse cx="110" cy="102" rx="48" ry="13" stroke={C1} strokeWidth="2.5" />
      <line x1="110" y1="18" x2="110" y2="102" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="110" y1="102" x2="158" y2="102" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <Label x={120} y={64}>ع</Label>
      <Label x={136} y={116}>نق</Label>
      <Label x={146} y={52}>ل</Label>
    </svg>
  ),
  sphere: (
    <svg {...svgProps}>
      <circle cx="110" cy="66" r="48" stroke={C1} strokeWidth="2.5" />
      <ellipse cx="110" cy="66" rx="48" ry="14" stroke={C1} strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="110" y1="66" x2="158" y2="66" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="110" cy="66" r="2.5" fill={C2} />
      <Label x={134} y={58}>نق</Label>
    </svg>
  ),
  pyramid: (
    <svg {...svgProps}>
      <polygon points="62,104 152,104 176,84 86,84" stroke={C1} strokeWidth="2" strokeDasharray="4 3" />
      <line x1="117" y1="18" x2="62" y2="104" stroke={C1} strokeWidth="2.5" />
      <line x1="117" y1="18" x2="152" y2="104" stroke={C1} strokeWidth="2.5" />
      <line x1="117" y1="18" x2="176" y2="84" stroke={C1} strokeWidth="2" />
      <line x1="117" y1="18" x2="86" y2="84" stroke={C1} strokeWidth="2" strokeDasharray="4 3" />
      <line x1="117" y1="18" x2="117" y2="94" stroke={C2} strokeWidth="1.5" strokeDasharray="4 3" />
      <Label x={107} y={120}>أ</Label>
      <Label x={126} y={60}>ع</Label>
    </svg>
  ),
}

/* ---------- بيانات الأشكال والقوانين (مظبوطة — مراجعة حسابية) ---------- */

const FLAT_SHAPES: Shape[] = [
  {
    id: 'square', ar: 'المربع', en: 'Square', tags: 'مربع مساحة محيط قطر area perimeter',
    draw: DRAW.square,
    laws: [
      { label: 'المساحة', formula: 'المساحة = أ × أ = أ²' },
      { label: 'المحيط', formula: 'المحيط = 4 × أ' },
      { label: 'القطر', formula: 'القطر = أ × √2' },
    ],
  },
  {
    id: 'rectangle', ar: 'المستطيل', en: 'Rectangle', tags: 'مستطيل مساحة محيط قطر area perimeter',
    draw: DRAW.rectangle,
    laws: [
      { label: 'المساحة', formula: 'المساحة = ل × ع' },
      { label: 'المحيط', formula: 'المحيط = 2 × ( ل + ع )' },
      { label: 'القطر', formula: 'القطر = √( ل² + ع² )' },
    ],
  },
  {
    id: 'triangle', ar: 'المثلث', en: 'Triangle', tags: 'مثلث مساحة محيط area',
    draw: DRAW.triangle,
    laws: [
      { label: 'المساحة', formula: 'المساحة = ½ × ق × ع' },
      { label: 'المحيط', formula: 'المحيط = مجموع الأضلاع الثلاثة' },
    ],
  },
  {
    id: 'right-triangle', ar: 'المثلث القائم', en: 'Right Triangle', tags: 'قائم فيثاغورس وتر pythagoras',
    draw: DRAW.rightTriangle,
    laws: [
      { label: 'فيثاغورس', formula: 'و² = ض₁² + ض₂²' },
      { label: 'المساحة', formula: 'المساحة = ½ × ض₁ × ض₂' },
      { label: 'المحيط', formula: 'المحيط = ض₁ + ض₂ + و' },
    ],
  },
  {
    id: 'equilateral', ar: 'المثلث المتساوي الأضلاع', en: 'Equilateral Triangle', tags: 'متساوي الأضلاع مثلث equilateral',
    draw: DRAW.equilateral,
    laws: [
      { label: 'المساحة', formula: 'المساحة = (√3 ÷ 4) × أ²' },
      { label: 'المحيط', formula: 'المحيط = 3 × أ' },
      { label: 'الارتفاع', formula: 'الارتفاع = (√3 ÷ 2) × أ' },
    ],
  },
  {
    id: 'parallelogram', ar: 'متوازي الأضلاع', en: 'Parallelogram', tags: 'متوازي الاضلاع مساحة parallelogram',
    draw: DRAW.parallelogram,
    laws: [
      { label: 'المساحة', formula: 'المساحة = ق × ع' },
      { label: 'المحيط', formula: 'المحيط = 2 × ( أ + ب )' },
    ],
  },
  {
    id: 'rhombus', ar: 'المعين', en: 'Rhombus', tags: 'معين مساحة قطرين rhombus',
    draw: DRAW.rhombus,
    laws: [
      { label: 'المساحة', formula: 'المساحة = ½ × ق₁ × ق₂' },
      { label: 'المحيط', formula: 'المحيط = 4 × أ' },
    ],
  },
  {
    id: 'trapezoid', ar: 'شبه المنحرف', en: 'Trapezium', tags: 'منحرف شبه المنحرف مساحة trapezium',
    draw: DRAW.trapezoid,
    laws: [
      { label: 'المساحة', formula: 'المساحة = ½ × ( ق₁ + ق₂ ) × ع' },
      { label: 'المحيط', formula: 'المحيط = مجموع الأضلاع الأربعة' },
    ],
  },
  {
    id: 'circle', ar: 'الدائرة', en: 'Circle', tags: 'دائرة مساحة محيط pi نق circle circumference',
    draw: DRAW.circle,
    laws: [
      { label: 'المساحة', formula: 'المساحة = π × نق²' },
      { label: 'طول الدائرة', formula: 'المحيط = 2 × π × نق' },
      { label: 'ملاحظة', formula: 'π ≈ 22/7 ≈ 3.14' },
    ],
  },
  {
    id: 'sector', ar: 'القطاع الدائري', en: 'Sector', tags: 'قطاع دائري قوس زاوية sector arc',
    draw: DRAW.sector,
    laws: [
      { label: 'مساحة القطاع', formula: 'المساحة = ( هـ ÷ 360 ) × π × نق²' },
      { label: 'طول القوس', formula: 'ل = ( هـ ÷ 360 ) × 2 × π × نق' },
    ],
  },
]

const SOLID_SHAPES: Shape[] = [
  {
    id: 'cube', ar: 'المكعب', en: 'Cube', tags: 'مكعب حجم مساحة سطح cube volume',
    draw: DRAW.cube,
    laws: [
      { label: 'الحجم', formula: 'الحجم = أ³' },
      { label: 'مساحة السطح', formula: 'مساحة السطح = 6 × أ²' },
      { label: 'القطر', formula: 'القطر = أ × √3' },
    ],
  },
  {
    id: 'cuboid', ar: 'متوازي المستطيلات', en: 'Cuboid', tags: 'متوازي المستطيلات صندوق حجم cuboid volume',
    draw: DRAW.cuboid,
    laws: [
      { label: 'الحجم', formula: 'الحجم = ل × ع × ا' },
      { label: 'مساحة السطح', formula: 'مساحة السطح = 2 × ( ل ع + ل ا + ع ا )' },
      { label: 'القطر', formula: 'القطر = √( ل² + ع² + ا² )' },
    ],
  },
  {
    id: 'cylinder', ar: 'الأسطوانة', en: 'Cylinder', tags: 'اسطوانة أسطوانة حجم cylinder volume',
    draw: DRAW.cylinder,
    laws: [
      { label: 'الحجم', formula: 'الحجم = π × نق² × ع' },
      { label: 'السطح المنحني', formula: 'المساحة الجانبية = 2 × π × نق × ع' },
      { label: 'مساحة السطح الكلية', formula: 'الكلية = 2 × π × نق × ( ع + نق )' },
    ],
  },
  {
    id: 'cone', ar: 'المخروط', en: 'Cone', tags: 'مخروط حجم رازم cone slant',
    draw: DRAW.cone,
    laws: [
      { label: 'الحجم', formula: 'الحجم = ( 1 ÷ 3 ) × π × نق² × ع' },
      { label: 'الرازم', formula: 'ل = √( نق² + ع² )' },
      { label: 'السطح الجانبي', formula: 'المساحة الجانبية = π × نق × ل' },
      { label: 'مساحة السطح الكلية', formula: 'الكلية = π × نق × ( ل + نق )' },
    ],
  },
  {
    id: 'sphere', ar: 'الكرة', en: 'Sphere', tags: 'كرة حجم مساحة sphere volume',
    draw: DRAW.sphere,
    laws: [
      { label: 'الحجم', formula: 'الحجم = ( 4 ÷ 3 ) × π × نق³' },
      { label: 'مساحة السطح', formula: 'مساحة السطح = 4 × π × نق²' },
    ],
  },
  {
    id: 'pyramid', ar: 'الهرم الرباعي القائم', en: 'Square Pyramid', tags: 'هرم حجم قاعدة pyramid volume',
    draw: DRAW.pyramid,
    laws: [
      { label: 'الحجم', formula: 'الحجم = ( 1 ÷ 3 ) × مساحة القاعدة × ع' },
      { label: 'قاعدة مربعة', formula: 'مساحة القاعدة = أ²' },
    ],
  },
]

/* قوانين لازم تحفظها — تغطي معظم أسئلة الامتحانات */
const MUST_KNOW: { title: string; body: string }[] = [
  { title: 'نظرية فيثاغورس', body: 'في المثلث القائم: (الوتر)² = (الضلع الأول)² + (الضلع الثاني)² — والعكس صحيح: لو مجموع مربعي ضلعين = مربع الثالث يبقى المثلث قائم والضلع الأكبر هو الوتر.' },
  { title: 'نسب التشابه', body: 'لو شكلين متشابهين بنسبة تشابه ك: نسبة المحيطات = ك ، نسبة المساحات = ك² ، نسبة الحجوم = ك³.' },
  { title: 'مجموع الزوايا', body: 'مجموع زوايا المثلث = 180° ، ومجموع زوايا أي شكل رباعي = 360°.' },
  { title: 'تحويلات المساحة والحجم', body: '1 سم² = 100 مم² ، 1 م² = 10,000 سم² ، 1 م³ = 1,000,000 سم³ ، 1 لتر = 1,000 سم³.' },
]

function ShapeCard({ s }: { s: Shape }) {
  return (
    <Card className="overflow-hidden group hover:border-emerald-500/40 transition-colors">
      <div className="flex items-center justify-center h-40 border-b border-border/50 bg-gradient-to-br from-emerald-500/8 via-transparent to-amber-500/8">
        {s.draw}
      </div>
      <CardContent className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-foreground text-[15px]">{s.ar}</h3>
          <span dir="ltr" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-2.5 py-0.5">
            {s.en}
          </span>
        </div>
        <ul className="space-y-1.5">
          {s.laws.map(function (l, i) {
            return (
              <li key={i} className="flex items-start justify-between gap-2 text-sm rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2">
                <span className="text-muted-foreground shrink-0 text-xs font-medium mt-0.5">{l.label}</span>
                <span className="font-bold text-foreground text-[13px] text-left leading-relaxed">{l.formula}</span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

export function GeometryLaws() {
  const [query, setQuery] = useState('')

  var q = query.trim().toLowerCase()
  var flat = useMemo(function () {
    if (!q) return FLAT_SHAPES
    return FLAT_SHAPES.filter(function (s) {
      return s.ar.toLowerCase().indexOf(q) >= 0 || s.en.toLowerCase().indexOf(q) >= 0 || s.tags.toLowerCase().indexOf(q) >= 0
    })
  }, [q])
  var solids = useMemo(function () {
    if (!q) return SOLID_SHAPES
    return SOLID_SHAPES.filter(function (s) {
      return s.ar.toLowerCase().indexOf(q) >= 0 || s.en.toLowerCase().indexOf(q) >= 0 || s.tags.toLowerCase().indexOf(q) >= 0
    })
  }, [q])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Header */}
        <div className="border-b bg-gradient-to-b from-emerald-500/8 to-transparent">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                رجوع للرئيسية
              </a>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Math Genius
              </span>
            </div>
            <div className="text-center space-y-2">
              <h1 dir="ltr" className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                Geometry <span className="text-emerald-600 dark:text-emerald-400">Laws</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-medium">
                كل قوانين الهندسة في صفحة واحدة — المساحة والمحيط والحجم، مظبوطة وجاهزة
              </p>
            </div>
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={function (e) { setQuery(e.target.value) }}
                placeholder="ابحث عن شكل: مربع، دائرة، مخروط، sphere…"
                aria-label="ابحث في قوانين الهندسة"
                className="w-full h-11 pr-10 pl-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Flat shapes */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <Ruler className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">المساحات والمحيطات (أشكال مستوية)</h2>
          </div>
          {flat.length === 0 && solids.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">مفيش شكل بالاسم ده — جرب كلمة تانية (مثل «مربع» أو «circle»)</p>
          ) : flat.length === 0 ? null : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flat.map(function (s) { return <ShapeCard key={s.id} s={s} /> })}
            </div>
          )}
        </section>

        {/* Solid shapes */}
        {solids.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
                <Box className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-foreground">الحجوم ومساحات السطح (أشكال حجمية)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {solids.map(function (s) { return <ShapeCard key={s.id} s={s} /> })}
            </div>
          </section>
        )}

        {/* Must-know laws */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-500/12 text-teal-600 dark:text-teal-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">قوانين لازم تحفظها</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MUST_KNOW.map(function (m, i) {
              return (
                <Card key={i} className="border-teal-500/25 bg-teal-500/5">
                  <CardContent className="p-4 space-y-1.5">
                    <h3 className="font-bold text-foreground text-sm">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t bg-background/60 py-4 text-center text-xs text-muted-foreground">
        Math Genius — مستر وائل خضير • Geometry Laws — قوانين الهندسة
      </footer>
    </div>
  )
}
