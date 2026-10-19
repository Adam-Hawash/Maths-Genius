// ز18-ب — إصلاح «Could not save the lesson price»:
// السبب: زيكولا بتحط زرار سعر الدرس على كارت الفيديو المفرد، والمفرد groupKey بتاعه فاضي
// → الـ route بيرد 400 groupKey required → توست خطأ عند المستر.
// الإصلاح: route محصّن (videoId للمفرد + من غير فلتر grade + self-heal أعمدة)
// + زرار سعر الفيديو المفرد على كل المنصات + القائد: schema ناقصه groupKey/orderIndex/sortIndex.
import fs from 'fs'

var repos = [
  'Maths-Genius',
  'Mr-Sherif-ElSayed',
  'Mr-Mohamed-Sabry',
  'Zicola-Math',
  'shaimaa-selim-science',
  'mensat-alqaid',
]
var ROOT = '/home/z/repos/'
var failures = []

function fail(msg) { failures.push(msg); console.error('❌ ' + msg) }
function ok(msg) { console.log('✅ ' + msg) }

function replaceCounted(label, filePath, src, oldStr, newStr, expected) {
  var parts = src.split(oldStr)
  var count = parts.length - 1
  if (count !== expected) {
    fail(label + ' — expected ' + expected + ' match(es), found ' + count + ' → ' + filePath)
    return src
  }
  ok(label + ' — ' + count + ' replacement(s)')
  return parts.join(newStr)
}

// ============================================================
// 1) route.ts جديد موحّد للستة
// ============================================================
var ROUTE = `// @ts-nocheck
// ============================================================
// (ز18 — طلب المستر): سعر الدرس كله — جزء واحد بيتسدد = الدرس كله بيفتح
// (ز18-ب إصلاح): المستر كان بيضغط الزرار على فيديو مفرد فالـ groupKey يتبعت
// فاضي وييجي 400 — دلوقتي الفيديو المفرد بيتسعّر بـ videoId، وفلتر الصف
// اتشال من التحديث (groupKey فريد للدرس — فلاتر الصف كانت ممكن تبوّظه)،
// وأعمدة Video بتعمل لها self-heal لو ناقصة على أي قاعدة بيانات.
// POST { groupKey?, videoId?, price } — price = 0 → مجاني
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

var _columnsHealed = false
async function healVideoColumns() {
  if (_columnsHealed) return
  try {
    var cols = [
      ['price', 'REAL', 'DEFAULT 0'],
      ['groupKey', 'TEXT', "DEFAULT ''"],
      ['orderIndex', 'INTEGER', 'DEFAULT 0'],
      ['sortIndex', 'INTEGER', 'DEFAULT 0'],
    ]
    for (var i = 0; i < cols.length; i++) {
      try {
        await db.$executeRawUnsafe('ALTER TABLE Video ADD COLUMN ' + cols[i][0] + ' ' + cols[i][1] + ' ' + cols[i][2])
      } catch (eCol) {
        /* duplicate column = تمام — أي خطأ تاني بيتتجاهل والمحاولة الجاية تقول */
      }
    }
    _columnsHealed = true
  } catch (eHeal) {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const groupKey = String(body.groupKey || '')
    const videoId = String(body.videoId || '')
    const price = Math.max(0, Number(body.price) || 0)

    if (!groupKey && !videoId) {
      return NextResponse.json({ error: 'groupKey or videoId required' }, { status: 400 })
    }

    // (ز18-ب) ترميم دفاعي — نفس درس video-guard: أي عمود ناقص على قاعدة قديمة
    // بيبوّظ استعلامات Prisma على Video كلها
    await healVideoColumns()

    var updated = 0
    if (groupKey) {
      // (ز18-ب) من غير فلتر grade — groupKey فريد للدرس نفسه
      const res = await db.video.updateMany({ where: { groupKey: groupKey }, data: { price: price } })
      updated = res.count
    } else {
      const res = await db.video.updateMany({ where: { id: videoId }, data: { price: price } })
      updated = res.count
      if (updated === 0) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ ok: true, updated: updated, price: price })
  } catch (error) {
    console.error('Lesson price error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
`

for (var r of repos) {
  var p = ROOT + r + '/src/app/api/videos/lesson-price/route.ts'
  if (!fs.existsSync(p)) { fail('route missing: ' + r); continue }
  fs.writeFileSync(p, ROUTE)
  ok('route.ts rewritten — ' + r)
}

// ============================================================
// 2) لوحات الأدمن — الخمس (القائد مفيش عنده الزرار أصلاً)
// ============================================================
var dashboards = ['Maths-Genius', 'Mr-Sherif-ElSayed', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science']

var OLD_STATE = "const [lessonPriceGroup, setLessonPriceGroup] = useState<{ key: string; title: string; grade: string; price: number } | null>(null)"
var NEW_STATE = "const [lessonPriceGroup, setLessonPriceGroup] = useState<{ key: string; title: string; grade: string; price: number; videoId?: string } | null>(null)"

var OLD_OPEN = `const openLessonPrice = function (key: string, grade: string, title: string, price: number) {
    setLessonPriceGroup({ key: key, grade: grade, title: title, price: price })`
var NEW_OPEN = `const openLessonPrice = function (key: string, grade: string, title: string, price: number, videoId?: string) {
    setLessonPriceGroup({ key: key, grade: grade, title: title, price: price, videoId: videoId || '' })`

var OLD_BODY = "body: JSON.stringify({ groupKey: lessonPriceGroup.key, grade: lessonPriceGroup.grade, price: Number(lessonPriceValue) || 0 }),"
var NEW_BODY = "body: JSON.stringify({ groupKey: lessonPriceGroup.key, videoId: lessonPriceGroup.videoId || '', price: Number(lessonPriceValue) || 0 }),"

var OLD_TOAST = "toast.success('✓ Lesson price saved: ' + (Number(lessonPriceValue) || 0) + ' EGP — applied to all parts of the lesson')"
var NEW_TOAST = "toast.success('✓ Price saved: ' + (Number(lessonPriceValue) || 0) + ' EGP' + (lessonPriceGroup.key ? ' — applied to all parts of the lesson' : ' — this video is now paid for free-tier students'))"

var OLD_DESC = "<p className=\"text-[10px] text-muted-foreground\">The price applies to the whole lesson ({lessonPriceGroup.grade}) — paying once unlocks ALL its parts. 0 = free.</p>"
var NEW_DESC = "<p className=\"text-[10px] text-muted-foreground\">{lessonPriceGroup.key ? 'The price applies to the whole lesson (' + lessonPriceGroup.grade + ') — paying once unlocks ALL its parts.' : 'This video is priced on its own — free students see it as paid content.'} 0 = free.</p>"

// زرار سعر الفيديو المفرد — بعد زرار حذف في صف أزرار كارت الفيديو المفرد (4 منصات)
var OLD_SINGLE_ROW = `<Button size="sm" variant="ghost" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />حذف
                      </Button>
                    </div>`
var NEW_SINGLE_ROW = `<Button size="sm" variant="ghost" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7" onClick={() => handleDelete(v.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />حذف
                      </Button>
                      {/* (ز18-ب) سعر الفيديو المفرد — نفس نافذة السعر بس بـ videoId */}
                      <Button size="sm" variant="ghost" className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs h-7" onClick={function () { openLessonPrice('', v.grade, v.title, Number(v.price || 0), v.id) }} title="Set the price for this video — free students see it as paid content">
                        💰 سعر الفيديو
                      </Button>
                    </div>`

// زيكولا: استدعاء الزرار الموجود بيزيد videoId
var OLD_ZICOLA_CALL = "openLessonPrice(gKey, v.grade, v.title, gParts[0] ? Number(gParts[0].price || 0) : 0) }}"
var NEW_ZICOLA_CALL = "openLessonPrice(gKey, v.grade, v.title, gParts[0] ? Number(gParts[0].price || 0) : 0, v.id) }}"

for (var d of dashboards) {
  var p = ROOT + d + '/src/components/admin/AdminDashboard.tsx'
  var src = fs.readFileSync(p, 'utf8')
  console.log('--- ' + d + ' ---')
  src = replaceCounted('state', p, src, OLD_STATE, NEW_STATE, 1)
  src = replaceCounted('openLessonPrice', p, src, OLD_OPEN, NEW_OPEN, 1)
  src = replaceCounted('body', p, src, OLD_BODY, NEW_BODY, 1)
  src = replaceCounted('toast', p, src, OLD_TOAST, NEW_TOAST, 1)
  src = replaceCounted('dialog-desc', p, src, OLD_DESC, NEW_DESC, 1)
  if (d === 'Zicola-Math') {
    src = replaceCounted('zicola-call', p, src, OLD_ZICOLA_CALL, NEW_ZICOLA_CALL, 1)
  } else {
    src = replaceCounted('single-price-btn', p, src, OLD_SINGLE_ROW, NEW_SINGLE_ROW, 1)
  }
  fs.writeFileSync(p, src)
}

// ============================================================
// 3) القائد — schema + ensure-schema + video-guard + بصمة
// ============================================================
console.log('--- mensat-alqaid schema/guard ---')

// 3-أ schema.prisma — إضافة groupKey/orderIndex/sortIndex لموديل Video
var sp = ROOT + 'mensat-alqaid/prisma/schema.prisma'
var schema = fs.readFileSync(sp, 'utf8')
var OLD_MODEL = `  grade     String
  price     Float    @default(0)
  createdAt DateTime @default(now())`
var NEW_MODEL = `  grade     String
  price     Float    @default(0)
  // (ز18-ب) دروس متعددة الأجزاء + ترتيب — محاذاة باقي المنصات
  groupKey  String   @default("")
  orderIndex Int     @default(0)
  sortIndex  Int     @default(0)
  createdAt DateTime @default(now())`
schema = replaceCounted('alqaid-video-model', sp, schema, OLD_MODEL, NEW_MODEL, 1)
fs.writeFileSync(sp, schema)

// 3-ب ensure-schema — COLUMN_ADDS + بصمة جديدة (الدرس الموثق و38/و40/و43: من غير
// تغيير المفتاح الأعمدة الجديدة عمرها ما بتتضاف على Turso الموجودة)
var ep = ROOT + 'mensat-alqaid/src/lib/ensure-schema.ts'
var esrc = fs.readFileSync(ep, 'utf8')
esrc = replaceCounted('alqaid-column-adds', ep, esrc,
  "  ['Video', 'price', 'REAL', 'DEFAULT 0'],",
  `  ['Video', 'price', 'REAL', 'DEFAULT 0'],
  // (ز18-ب) أعمدة الدروس متعددة الأجزاء + الترتيب
  ['Video', 'groupKey', 'TEXT', "DEFAULT ''"],
  ['Video', 'orderIndex', 'INTEGER', 'DEFAULT 0'],
  ['Video', 'sortIndex', 'INTEGER', 'DEFAULT 0'],`, 1)
esrc = replaceCounted('alqaid-hash-bump', ep, esrc,
  "var SCHEMA_HASH_KEY = 'schema_heal_hash_v2_arena_z13'",
  "var SCHEMA_HASH_KEY = 'schema_heal_hash_v2_z18b_video_price'", 1)
fs.writeFileSync(ep, esrc)

// 3-ج video-guard — قايمة أعمدة ensureVideoTable
var vp = ROOT + 'mensat-alqaid/src/lib/video-guard.ts'
var vsrc = fs.readFileSync(vp, 'utf8')
vsrc = replaceCounted('alqaid-guard-cols', vp, vsrc,
  "      ['price', 'REAL', 'DEFAULT 0'],\n    ]",
  `      ['price', 'REAL', 'DEFAULT 0'],
      // (ز18-ب) أعمدة الدروس متعددة الأجزاء + الترتيب
      ['groupKey', 'TEXT', "DEFAULT ''"],
      ['orderIndex', 'INTEGER', 'DEFAULT 0'],
      ['sortIndex', 'INTEGER', 'DEFAULT 0'],
    ]`, 1)
fs.writeFileSync(vp, vsrc)

console.log('')
if (failures.length) {
  console.error('🛑 ' + failures.length + ' failure(s) — لا تدفع! راجع الفشل فوق.')
  process.exit(1)
}
console.log('🎉 كل الترقيعات عدّت بعدّادات مطابقة — راجع الفوق ثم فحص الـ syntax')
