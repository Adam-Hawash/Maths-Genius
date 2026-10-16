// Z-15: ترقية لوحة الصفوف والمواعيد في المنصات الخمسة الموجودة
// (إضافة صف في الأول + ترتيب ▲▼ + كشف إعادة تسمية آمن)
// + BooksManager يقرأ الصفوف من الكونفج في 4 منصات (زيكولا مفيهوش GRADES أصلاً)
import fs from 'fs'
import path from 'path'

const BASE = '/home/z/repos'
const tasks = []
function T(repo, file, repls) { tasks.push({ repo, file, repls }) }
const R = (old, nw, n = null) => ({ old, nw, n })
const stats = { ok: 0, miss: [], applied: 0 }

const PANELS = ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']
const BOOKS = ['Maths-Genius', 'Mr-Mohamed-Sabry', 'shaimaa-selim-science', 'mensat-alqaid']

const IMPORT_OLD = "import { CalendarClock, CalendarPlus, Clock, GraduationCap, Loader2, Plus, Save, Trash2 } from 'lucide-react'"
const IMPORT_NEW = "import { ArrowUpToLine, CalendarClock, CalendarPlus, ChevronDown, ChevronUp, Clock, GraduationCap, Loader2, Plus, Save, Trash2 } from 'lucide-react'"

const DETECT_OLD = `    if (!oldMatch && i < originals.length) oldMatch = originals[i]
    var oldAr = oldMatch ? (oldMatch.ar || '').trim() : ''`
const DETECT_NEW = `    /* (ز15) المطابقة بالمكان بس لو العدد ثابت والاسم القديم اختفى من
       القايمة الحالية — عشان إضافة صف في الأول أو الترتيب ما يترجموش
       غلط كـ«تغيير اسم» لصف قديم ويتنشر على الداتا */
    if (!oldMatch && originals.length === current.length && i < originals.length) {
      var posOld = originals[i]
      if ((posOld.ar || '').trim() && currentArs[(posOld.ar || '').trim()] !== true) oldMatch = posOld
    }
    var oldAr = oldMatch ? (oldMatch.ar || '').trim() : ''`

const DETECT_HEAD_OLD = `function detectRenames(originals: GradeItem[], current: GradeItem[]): Array<{ from: string; to: string }> {
  var renames: Array<{ from: string; to: string }> = []
  for (var i = 0; i < current.length; i++) {`
const DETECT_HEAD_NEW = `function detectRenames(originals: GradeItem[], current: GradeItem[]): Array<{ from: string; to: string }> {
  var renames: Array<{ from: string; to: string }> = []
  /* (ز15) الصف اللي اسمه موجود في الأصل مش rename — اتنقل مكانه بس */
  var originalArs: Record<string, boolean> = {}
  for (var z = 0; z < originals.length; z++) originalArs[(originals[z].ar || '').trim()] = true
  var currentArs: Record<string, boolean> = {}
  for (var c = 0; c < current.length; c++) currentArs[(current[c].ar || '').trim()] = true
  for (var i = 0; i < current.length; i++) {`

const SKIP_OLD = `    var nu = current[i]
    var newAr = (nu.ar || '').trim()
    if (!newAr) continue
    var oldMatch: GradeItem | null = null`
const SKIP_NEW = `    var nu = current[i]
    var newAr = (nu.ar || '').trim()
    if (!newAr) continue
    if (originalArs[newAr]) continue
    var oldMatch: GradeItem | null = null`

const ADDGRADE_OLD = `  function addGrade() {
    gradesDirtyRef.current = true
    setGrades(function (prev) {
      return prev.concat([{ ar: '', en: '', emoji: '🎓', short: '' }])
    })
  }`
const ADDGRADE_NEW = ADDGRADE_OLD + `

  /* (ز15) إضافة صف في أول القايمة — طلب المستر: «خليني أقدر أضيف حاجة في الأول» */
  function addGradeAtTop() {
    gradesDirtyRef.current = true
    setGrades(function (prev) {
      return [{ ar: '', en: '', emoji: '🎓', short: '' }].concat(prev)
    })
  }

  /* (ز15) ترتيب الصفوف يدويًا — اللي فوق في اللوحة بيظهر الأول في كل المنصة */
  function moveGrade(idx: number, dir: -1 | 1) {
    gradesDirtyRef.current = true
    setGrades(function (prev) {
      var j = idx + dir
      if (j < 0 || j >= prev.length) return prev
      var next = prev.slice()
      var tmp = next[idx]
      next[idx] = next[j]
      next[j] = tmp
      return next
    })
  }`

const BTNS_OLD = `            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={addGrade}>
                <Plus className="h-4 w-4 ml-1" />إضافة صف
              </Button>`
const BTNS_NEW = `            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={addGradeAtTop} title="الصف الجديد يظهر أول القايمة في كل المنصة">
                <ArrowUpToLine className="h-4 w-4 ml-1" />إضافة صف في الأول
              </Button>
              <Button variant="outline" size="sm" className="min-h-[36px]" onClick={addGrade}>
                <Plus className="h-4 w-4 ml-1" />إضافة صف
              </Button>`

const TRASH_OLD = `                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  onClick={function () { removeGrade(idx) }}
                  title="حذف الصف"
                >`
const TRASH_NEW = `                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted"
                  onClick={function () { moveGrade(idx, -1) }}
                  disabled={idx === 0}
                  title="تحريك الصف لفوق"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted"
                  onClick={function () { moveGrade(idx, 1) }}
                  disabled={idx === grades.length - 1}
                  title="تحريك الصف لتحت"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                  onClick={function () { removeGrade(idx) }}
                  title="حذف الصف"
                >`

for (const r of PANELS) {
  T(r, 'src/components/admin/GradesSchedulePanel.tsx', [
    R(IMPORT_OLD, IMPORT_NEW, 1),
    R(DETECT_HEAD_OLD, DETECT_HEAD_NEW, 1),
    R(SKIP_OLD, SKIP_NEW, 1),
    R(DETECT_OLD, DETECT_NEW, 1),
    R(ADDGRADE_OLD, ADDGRADE_NEW, 1),
    R(BTNS_OLD, BTNS_NEW, 1),
    R(TRASH_OLD, TRASH_NEW, 1),
  ])
}

const BOOKS_IMPORT_OLD = "import { useAppStore, GRADES } from '@/stores/app-store'"
const BOOKS_IMPORT_NEW = "import { useAppStore, gradesFromConfig } from '@/stores/app-store'"
const BOOKS_TOP_OLD = `export function BooksManager() {
  const adminId = useAppStore(function (s) { return s.currentAdmin?.id || '' })`
const BOOKS_TOP_NEW = `export function BooksManager() {
  const adminId = useAppStore(function (s) { return s.currentAdmin?.id || '' })
  /* (ز15) القايمة الديناميكية من لوحة الأدمن (grades_data) */
  const GRADES = gradesFromConfig(useAppStore(function (s) { return s.siteConfig })).map(function (g) { return g.ar })`
for (const r of BOOKS) {
  T(r, 'src/components/admin/BooksManager.tsx', [
    R(BOOKS_IMPORT_OLD, BOOKS_IMPORT_NEW, 1),
    R(BOOKS_TOP_OLD, BOOKS_TOP_NEW, 1),
  ])
}

for (const t of tasks) {
  const fp = path.join(BASE, t.repo, t.file)
  let content
  try { content = fs.readFileSync(fp, 'utf8') } catch (e) { stats.miss.push(t.repo + ' ' + t.file + ' :: FILE NOT FOUND'); continue }
  let changed = false
  for (const rp of t.repls) {
    const parts = content.split(rp.old)
    const count = parts.length - 1
    if (count === 0) { stats.miss.push(t.repo + ' ' + t.file + ' :: NOT FOUND :: ' + rp.old.slice(0, 60).replace(/\n/g, '⏎')); continue }
    if (rp.n !== null && count !== rp.n) { stats.miss.push(t.repo + ' ' + t.file + ' :: COUNT ' + count + ' != ' + rp.n + ' :: ' + rp.old.slice(0, 60).replace(/\n/g, '⏎')); continue }
    content = parts.join(rp.nw)
    stats.applied += count
    changed = true
  }
  if (changed) { fs.writeFileSync(fp, content); stats.ok++ }
}
console.log('=== Z-15 panels/books runner ===')
console.log('files changed:', stats.ok, '| replacements applied:', stats.applied)
if (stats.miss.length) { console.log('--- MISSES (' + stats.miss.length + ') ---'); for (const m of stats.miss) console.log('  ' + m) } else { console.log('no misses — all replacements exact') }
