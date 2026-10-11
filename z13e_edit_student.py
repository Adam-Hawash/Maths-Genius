# -*- coding: utf-8 -*-
# (ز13-E) anchored edits — StudentPortal.tsx (shaimaa-selim-science)
import io, sys

P = '/home/z/repos/shaimaa-selim-science/src/components/student/StudentPortal.tsx'
src = io.open(P, encoding='utf-8').read()
orig = src

def assert1(cond, msg):
    if not cond:
        print('ASSERT FAIL: ' + msg); sys.exit(1)

# ---------- 0) Swords icon (Target already imported) ----------
assert1('Swords' not in src, 'Swords already present?')
old_icons = "  BookOpen, Target, TrendingUp, GraduationCap, ChevronLeft, ExternalLink,"
assert1(src.count(old_icons) == 1, 'lucide icons anchor')
src = src.replace(old_icons, "  BookOpen, Target, TrendingUp, GraduationCap, ChevronLeft, ExternalLink, Swords,", 1)

# ---------- 1) component imports ----------
old_imp = "import { BooksTab } from '@/components/student/BooksTab'"
assert1(src.count(old_imp) == 1, 'BooksTab import anchor')
src = src.replace(old_imp, old_imp + "\n/* (2026-ز13) ساحة التحدي + اتدرب أكتر — منقولة من Maths-Genius (واجهة إنجليزي بطلب المستر) */\nimport { BattleArena } from '@/components/student/BattleArena'\nimport { PracticeGenerator } from '@/components/student/PracticeGenerator'", 1)

# ---------- 2) hiddenGroupKeys state BEFORE activeLessonVideo ----------
st_anchor = "  const [activeLessonVideo, setActiveLessonVideo] = useState<VideoType | null>(null)"
assert1(src.count(st_anchor) == 1, 'activeLessonVideo anchor')
src = src.replace(st_anchor, "  const [hiddenGroupKeys, setHiddenGroupKeys] = useState<Set<string>>(new Set()) // (2026-ز13) الدروس المخفية كاملة عن الطالب\n" + st_anchor, 1)

# ---------- 3) fetch hidden group keys AFTER the schedules useEffect ----------
fx_anchor = u"""        setHiddenVideoIds(new Set(data.hiddenVideoIds || []))
      })
      .catch(function() {})
  }, [studentId])"""
assert1(src.count(fx_anchor) == 1, 'schedules useEffect tail anchor')
fx_insert = fx_anchor + u"""

  // (2026-ز13) الدروس المخفية كاملة عن الطالب ده
  useEffect(() => {
    if (!studentId) return
    fetch('/api/lesson-hide?studentId=' + studentId)
      .then(function (r) { return r.json() })
      .then(function (data) { setHiddenGroupKeys(new Set(data.hiddenGroupKeys || [])) })
      .catch(function () {})
  }, [studentId])"""
src = src.replace(fx_anchor, fx_insert, 1)

# ---------- 4) first forEach: drop hidden-group parts from aggregation ----------
ff_anchor = u"""      if (hiddenVideoIds.has(v.id)) return
      var k = String((v as any).groupKey || '')
      if (!k) { items.push({ type: 'single', video: v }); return }"""
assert1(src.count(ff_anchor) == 1, 'first forEach anchor')
ff_new = u"""      if (hiddenVideoIds.has(v.id)) return
      var k = String((v as any).groupKey || '')
      // (2026-ز13) الدرس المخفي كامل — أجزاؤه بتتساقط من التجميع
      if (k && hiddenGroupKeys.has(k)) return
      if (!k) { items.push({ type: 'single', video: v }); return }"""
src = src.replace(ff_anchor, ff_new, 1)

# ---------- 5) second forEach: skip hidden groups (this repo's variant of `if (!k || hiddenVideoIds.has(v.id)) return`) ----------
sf_old = "      if (!k || groupInserted[k]) return"
assert1(src.count(sf_old) == 1, 'second forEach guard anchor')
sf_new = "      if (!k || groupInserted[k] || hiddenGroupKeys.has(k)) return"
src = src.replace(sf_old, sf_new, 1)

# ---------- 6) deps array ----------
dp_old = "  }, [orderedVideos, hiddenVideoIds])"
assert1(src.count(dp_old) == 1, 'deps array anchor')
src = src.replace(dp_old, "  }, [orderedVideos, hiddenVideoIds, hiddenGroupKeys])", 1)

# ---------- 7) tabs: arena + practice after exams ----------
tb_old = "    { id: 'exams', label: t('tab_exams'), icon: FileText },"
assert1(src.count(tb_old) == 1, 'exams tab anchor')
tb_new = tb_old + u"""
    /* (2026-ز13) ساحة التحدي + اتدرب أكتر — واجهة إنجليزي (طلب المستر) */
    { id: 'arena', label: 'Arena', icon: Swords },
    { id: 'practice', label: 'Practice', icon: Target },"""
src = src.replace(tb_old, tb_new, 1)

# ---------- 8) render blocks after exams ----------
rd_old = "        {activeTab === 'exams' && <ExamsTab exams={dashboardData.exams} results={dashboardData.examResults} completedExamIds={completedExamIds} onExamSubmitted={(id) => setCompletedExamIds(prev => new Set([...prev, id]))} studentId={studentId} resultsLoaded={examResultsLoaded} />}"
assert1(src.count(rd_old) == 1, 'exams render anchor')
rd_new = rd_old + u"""
        {/* (2026-ز13) ساحة التحدي + اتدرب أكتر */}
        {activeTab === 'arena' && <BattleArena studentId={studentId} studentName={currentStudent?.name || ''} grade={grade} />}
        {activeTab === 'practice' && <PracticeGenerator grade={grade} />}"""
src = src.replace(rd_old, rd_new, 1)

assert1(src != orig, 'no changes made?')
io.open(P, 'w', encoding='utf-8').write(src)
print('STUDENT PORTAL EDITS OK: icons+imports+state+effect+filters+deps+tabs+render')
