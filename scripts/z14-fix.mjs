// Z-14-fix: إصلاح الـ 22 miss من السكريبت الأساسي
import fs from 'fs'
import path from 'path'

const BASE = '/home/z/repos'
const tasks = []
function T(repo, file, repls) { tasks.push({ repo, file, repls }) }
const R = (old, nw, n = null) => ({ old, nw, n })
const stats = { ok: 0, miss: [], applied: 0 }

// 1) شريف + زيكولا: where مختلف (بدون gradeWhere)
const SORT_SHERIF_OLD = `      if (!inherited) {
        const agg = await db.video.aggregate({ _min: { sortIndex: true }, where: { grade: String(grade) } })
        const minSort = Number((agg._min && (agg._min as { sortIndex: number | null }).sortIndex) || 0)
        newSortIndex = minSort - 1
      }`
const SORT_SHERIF_NEW = `      if (!inherited) {
        const agg = await db.video.aggregate({ _max: { sortIndex: true }, where: { grade: String(grade) } })
        const maxSort = Number((agg._max && (agg._max as { sortIndex: number | null }).sortIndex) || 0)
        if (maxSort > 0) newSortIndex = maxSort + 1
      }`
for (const r of ['Mr-Sherif-ElSayed', 'Zicola-Math']) T(r, 'src/app/api/videos/route.ts', [R(SORT_SHERIF_OLD, SORT_SHERIF_NEW, 1)])

// 2) منصة القائد: ترتيب بالتاريخ فقط (من غير sortIndex)
T('mensat-alqaid', 'src/components/student/StudentPortal.tsx', [
  R(`  /* (2026-ز11 — طلب المستر الحرفي): «اللي ينزل الجديد يبقى في الاول واللي
     في الاخر يكون الاقدم» — الأحدث فوق والأقدم تحت */
  const orderedVideos = useMemo(function () {
    return videos.slice().sort(function (a, b) {
      var ta = new Date((a as any).createdAt || 0).getTime()
      var tb = new Date((b as any).createdAt || 0).getTime()
      return tb - ta
    })
  }, [videos])`,
    `  /* (2026-ز14 — طلب المستر): رجّعنا الترتيب الزمني — «الدرس التاني يجي بعد
     الدرس الأول»: الأقدم فوق والأحدث تحت */
  const orderedVideos = useMemo(function () {
    return videos.slice().sort(function (a, b) {
      var ta = new Date((a as any).createdAt || 0).getTime()
      var tb = new Date((b as any).createdAt || 0).getTime()
      return ta - tb
    })
  }, [videos])`, 1),
])

// 3) بلوك توست إخفاء الدرس — الصيغة الصحيحة (فيه setLessonHideOpen في النص)
const HIDE_OLD = `        toast.success(lessonHideSelected.length > 0 ? 'تم إخفاء الدرس كامل عن الطلاب المحددين — مش هيشوفوه خالص' : 'تم فك إخفاء الدرس — بقى ظاهر للكل')
        setLessonHideOpen(false)
      } else { toast.error('فشل الحفظ') }
    } catch { toast.error('خطأ في الاتصال') }`
const HIDE_NEW = `        toast.success(lessonHideSelected.length > 0 ? 'Lesson hidden from the selected students — they will not see it at all' : 'Lesson unhidden — it is visible to everyone again')
        setLessonHideOpen(false)
      } else { toast.error('Failed to save') }
    } catch { toast.error('Connection error') }`
for (const r of ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'Zicola-Math', 'shaimaa-selim-science']) {
  T(r, 'src/components/admin/AdminDashboard.tsx', [R(HIDE_OLD, HIDE_NEW, 1)])
}

// 4) منصة القائد: عنوان زرار الرفض الأقصر
T('mensat-alqaid', 'src/components/admin/AdminDashboard.tsx', [
  R('title="رفض وحذف الطالب من المنصة"', 'title="Reject & remove student from the platform"', 1),
])

// 5+6) لوحة التحدي: نصوص جوه كومنتات بنفس الكلمة — نستخدم المسافات
const TCP_FIX = [
  R('\n                لوحة الترتيب\n', '\n                Leaderboard\n', 1),
  R('\n                        إعادة فتح\n', '\n                        Reopen\n', 1),
]
for (const r of ['Maths-Genius', 'Mr-Mohamed-Sabry', 'Mr-Sherif-ElSayed', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']) {
  T(r, 'src/components/admin/TeacherChallengePanel.tsx', TCP_FIX.map(function (x) { return { old: x.old, nw: x.nw, n: x.n } }))
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
console.log('=== Z-14 fix runner ===')
console.log('files changed:', stats.ok, '| replacements applied:', stats.applied)
if (stats.miss.length) { console.log('--- MISSES (' + stats.miss.length + ') ---'); for (const m of stats.miss) console.log('  ' + m) } else { console.log('no misses — all replacements exact') }
