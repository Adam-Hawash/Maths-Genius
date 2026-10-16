// ============================================================
// ز16 — زرار حفظ مواعيد السنتر والصفوف يشتغل بصواح
// (1) /api/config PUT: يستبعد grades_data/schedule_data/favicon_reset_v1
//     — حماية سيرفريدية من علة «التعديلات بترجع» (CMSPanel كان يكتب
//     الكونفج كامل بنسخة قديمة فيكنّس حفظ لوحة الصفوف والمواعيد)
// (2) CMSPanel: نفس الاستبعاد على العميل (يدًا بيد مع السيرفر)
// (3) ensure-schema: إزالة تكرار SiteConfig + فهرس فريد على key
//     — علة 500 في upsert لو جدول قديم من غير UNIQUE
// كل استبدال له عدد متوقع — أي انحراف = MISS
// ============================================================
import { readFileSync, writeFileSync } from 'fs'

const REPOS = ['Mr-Sherif-ElSayed', 'Maths-Genius', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'mensat-alqaid', 'shaimaa-selim-science']
const BASE = '/home/z/repos'

const GUARD_NOTE_A =
  '        /* (ز16) grades_data وschedule_data حصراً لـ /api/site-config (لوحة الصفوف والمواعيد) —\n' +
  '         * منع أي حفظ كونفج كامل من مسحهم بقيمة قديمة (علة «التعديلات بترجع»)،\n' +
  '         * وfavicon_reset_v1 بصمة ترميم داخلية مش من الكونفج */\n'

const report = []

function patchFile(repo, rel, replacements) {
  const p = `${BASE}/${repo}/${rel}`
  let src
  try { src = readFileSync(p, 'utf8') } catch (e) { report.push(`MISS ${repo}/${rel} — READ FAIL ${e.message}`); return }
  let changed = src
  for (const r of replacements) {
    const n = changed.split(r.old).length - 1
    if (n !== r.n) { report.push(`MISS ${repo}/${rel} [${r.tag}] expected ${r.n} got ${n}`); continue }
    changed = changed.split(r.old).join(r.new)
    report.push(`OK   ${repo}/${rel} [${r.tag}] x${n}`)
  }
  if (changed !== src) writeFileSync(p, changed)
}

// ---------- (1) /api/config/route.ts ----------
const OLD_FILTER_A = "      // Skip non-config keys that might come from error responses\n      if (key === 'error' || key === 'defaults') continue"
const NEW_FILTER_A =
  GUARD_NOTE_A +
  "      // Skip non-config keys that might come from error responses\n" +
  "      if (key === 'error' || key === 'defaults' || key === 'grades_data' || key === 'schedule_data' || key === 'favicon_reset_v1') continue"

const OLD_FILTER_Z = "        // Skip non-config keys that might come from error responses\n        if (key === 'error' || key === 'defaults') return Promise.resolve()"
const NEW_FILTER_Z =
  GUARD_NOTE_A.replace(/^ {8}/gm, '          ') +
  "        // Skip non-config keys that might come from error responses\n" +
  "        if (key === 'error' || key === 'defaults' || key === 'grades_data' || key === 'schedule_data' || key === 'favicon_reset_v1') return Promise.resolve()"

function patchConfigRoute(repo) {
  const p = `${BASE}/${repo}/src/app/api/config/route.ts`
  let src
  try { src = readFileSync(p, 'utf8') } catch (e) { report.push(`MISS ${repo}/config READ FAIL`); return }
  const nA = src.split(OLD_FILTER_A).length - 1
  const nZ = src.split(OLD_FILTER_Z).length - 1
  if (nA === 1 && nZ === 0) patchFile(repo, 'src/app/api/config/route.ts', [{ old: OLD_FILTER_A, new: NEW_FILTER_A, n: 1, tag: 'config-guard-A' }])
  else if (nZ === 1 && nA === 0) patchFile(repo, 'src/app/api/config/route.ts', [{ old: OLD_FILTER_Z, new: NEW_FILTER_Z, n: 1, tag: 'config-guard-Z' }])
  else if (nA === 0 && nZ === 0) {
    // ممكن يكون متبّث بالفعل أو شكل مختلف
    if (src.includes("key === 'grades_data' || key === 'schedule_data'")) report.push(`OK   ${repo}/config [already-patched]`)
    else report.push(`MISS ${repo}/config [config-guard] — variant not recognized`)
  } else report.push(`MISS ${repo}/config [config-guard] — ambiguous nA=${nA} nZ=${nZ}`)
}

// ---------- (2) CMSPanel.tsx ----------
const OLD_CMS_K = "        if (key === 'error' || key === 'defaults') continue"
const NEW_CMS_K =
  "        /* (ز16) مفاتيح الصفوف والمواعيد حصراً للوحة GradesSchedulePanel — ما تترجعش قديمة من هنا */\n" +
  "        if (key === 'error' || key === 'defaults' || key === 'grades_data' || key === 'schedule_data' || key === 'favicon_reset_v1') continue"
const OLD_CMS_KI = "        if (keys[i] === 'error' || keys[i] === 'defaults') continue"
const NEW_CMS_KI =
  "        /* (ز16) مفاتيح الصفوف والمواعيد حصراً للوحة GradesSchedulePanel — ما تترجعش قديمة من هنا */\n" +
  "        if (keys[i] === 'error' || keys[i] === 'defaults' || keys[i] === 'grades_data' || keys[i] === 'schedule_data' || keys[i] === 'favicon_reset_v1') continue"

// ---------- (3) ensure-schema.ts: إدراج قبل نهاية كل مصفوفة ----------
function insertBeforeArrayEnd(src, arrayDecl, insertLines, tag, repo) {
  const start = src.indexOf(arrayDecl)
  if (start === -1) { report.push(`MISS ${repo} [${tag}] decl not found`); return src }
  // أول سطر ] لوحده بعد بداية المصفوفة
  const endIdx = src.indexOf('\n]', start)
  if (endIdx === -1) { report.push(`MISS ${repo} [${tag}] end not found`); return src }
  const insertion = insertLines.join('\n') + '\n'
  if (src.includes(insertLines[insertLines.length - 1])) { report.push(`MISS ${repo} [${tag}] already patched`); return src }
  report.push(`OK   ${repo} [${tag}]`)
  return src.slice(0, endIdx) + '\n' + insertion + src.slice(endIdx)
}

const SCHEMA_FIX_LINES = [
  "  // ===== (ز16) إزالة تكرار SiteConfig قبل إنشاء الفهرس الفريد — علة 500 في upsert على جداول قديمة",
  "  // بنحتفظ بأحدث صف لكل مفتاح (أكبر rowid) — لو مفيش تكرار الاستعلام مش بيمسح حاجة (idempotent)",
  "  'DELETE FROM SiteConfig WHERE rowid NOT IN (SELECT MAX(rowid) FROM SiteConfig GROUP BY key)',",
]
const SCHEMA_IDX_LINES = [
  "  // (ز16) فهرس فريد على مفتاح الكونفج — بدون ON CONFLICT فريد، upsert بيفشل 500 على الجداول القديمة",
  "  'CREATE UNIQUE INDEX IF NOT EXISTS idx_siteconfig_key_unique ON SiteConfig(key)',",
]

for (const repo of REPOS) {
  // config route — كشف الفاريانت ديناميكيًا
  patchConfigRoute(repo)
  // CMSPanel — العدد بيتفحص ديناميكيًا من الملف نفسه
  {
    const p = `${BASE}/${repo}/src/components/admin/CMSPanel.tsx`
    let src = readFileSync(p, 'utf8')
    const nK = src.split(OLD_CMS_K).length - 1
    const nKI = src.split(OLD_CMS_KI).length - 1
    patchFile(repo, 'src/components/admin/CMSPanel.tsx', [
      { old: OLD_CMS_K, new: NEW_CMS_K, n: nK, tag: `cms-key x${nK}` },
      { old: OLD_CMS_KI, new: NEW_CMS_KI, n: nKI, tag: `cms-keyi x${nKI}` },
    ])
  }
  // ensure-schema
  {
    const p = `${BASE}/${repo}/src/lib/ensure-schema.ts`
    let src = readFileSync(p, 'utf8')
    src = insertBeforeArrayEnd(src, 'var SCHEMA_FIXES', SCHEMA_FIX_LINES, 'schema-fixes', repo)
    src = insertBeforeArrayEnd(src, 'var SCHEMA_INDEXES', SCHEMA_IDX_LINES, 'schema-indexes', repo)
    writeFileSync(p, src)
  }
  // فحص بعدّي: CMSPanel لازم يكون فيه الجارد
  {
    const p = `${BASE}/${repo}/src/components/admin/CMSPanel.tsx`
    const src = readFileSync(p, 'utf8')
    if (!src.includes("grades_data") || !src.includes("schedule_data")) report.push(`MISS ${repo}/CMSPanel [post-check] — guard missing`)
  }
}

console.log(report.join('\n'))
const miss = report.filter(r => r.startsWith('MISS')).length
console.log(`\nTOTAL: ${report.filter(r => r.startsWith('OK')).length} OK, ${miss} MISS`)
