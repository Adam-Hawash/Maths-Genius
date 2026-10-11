# -*- coding: utf-8 -*-
# (ز13-E) anchored edits — AdminDashboard.tsx (shaimaa-selim-science)
import io, sys

P = '/home/z/repos/shaimaa-selim-science/src/components/admin/AdminDashboard.tsx'
src = io.open(P, encoding='utf-8').read()
orig = src

def assert1(cond, msg):
    if not cond:
        print('ASSERT FAIL: ' + msg); sys.exit(1)

# ---------- 0) lucide icons: EyeOff + Swords ----------
assert1("EyeOff" not in src, 'EyeOff already present?')
assert1("Swords" not in src, 'Swords already present?')
old_icons = "  GraduationCap, UsersRound, PieChart, BookOpen, ChevronDown\n} from 'lucide-react'"
assert1(src.count(old_icons) == 1, 'lucide import anchor')
src = src.replace(old_icons, "  GraduationCap, UsersRound, PieChart, BookOpen, ChevronDown,\n  EyeOff, Swords\n} from 'lucide-react'", 1)

# ---------- 1) TeacherChallengePanel import ----------
old_imp = "import { ActivityPanel } from './ActivityPanel'"
assert1(src.count(old_imp) == 1, 'ActivityPanel import anchor')
assert1('TeacherChallengePanel' not in src, 'TeacherChallengePanel already imported?')
src = src.replace(old_imp, old_imp + "\n/* (2026-ز13) تحدي المستر — بنك أسئلة + فلاش كاردز + تحدي أسبوعي (منقول من Maths-Genius) */\nimport { TeacherChallengePanel } from './TeacherChallengePanel'", 1)

# ---------- 2) lesson-hide state + functions BEFORE loadExistingSchedule ----------
anchor_fn = '  const loadExistingSchedule = async (videoId: string) => {'
assert1(src.count(anchor_fn) == 1, 'loadExistingSchedule anchor')
block_state = u"""  /* (2026-ز13) إخفاء درس كامل عن طلاب */
  const [lessonHideOpen, setLessonHideOpen] = useState(false)
  const [lessonHideGroup, setLessonHideGroup] = useState<{ key: string; title: string; grade: string; parts: number } | null>(null)
  const [lessonHideStudents, setLessonHideStudents] = useState<any[]>([])
  const [lessonHideSelected, setLessonHideSelected] = useState<string[]>([])
  const [lessonHideSaving, setLessonHideSaving] = useState(false)

  const openLessonHide = async function (gKey: string, grade: string, title: string, parts: number) {
    setLessonHideGroup({ key: gKey, title: title, grade: grade, parts: parts })
    setLessonHideOpen(true)
    setLessonHideStudents([])
    try {
      var res = await fetch('/api/students?pageSize=200&grade=' + encodeURIComponent(grade))
      var data = await res.json()
      setLessonHideStudents((data.students || []).filter(function (s: any) { return s.status === 'approved' || s.status === 'paid' }))
    } catch { setLessonHideStudents([]) }
    try {
      var r2 = await fetch('/api/lesson-hide?groupKey=' + encodeURIComponent(gKey))
      var d2 = await r2.json()
      setLessonHideSelected(d2.studentIds || [])
    } catch { setLessonHideSelected([]) }
  }
  const handleLessonHideSave = async function () {
    if (!lessonHideGroup) return
    setLessonHideSaving(true)
    try {
      var res = await fetch('/api/lesson-hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupKey: lessonHideGroup.key, grade: lessonHideGroup.grade, studentIds: lessonHideSelected }),
      })
      if (res.ok) {
        toast.success(lessonHideSelected.length > 0 ? 'تم إخفاء الدرس كامل عن الطلاب المحددين — مش هيشوفوه خالص' : 'تم فك إخفاء الدرس — بقى ظاهر للكل')
        setLessonHideOpen(false)
      } else { toast.error('فشل الحفظ') }
    } catch { toast.error('خطأ في الاتصال') }
    setLessonHideSaving(false)
  }

"""
src = src.replace(anchor_fn, block_state + anchor_fn, 1)

# ---------- 3) BUTTON after «ضيف فيديو تاني للدرس ده» enclosing </Button> ----------
btn_anchor = u"""<Plus className="h-3.5 w-3.5 ml-1" />ضيف فيديو تاني للدرس ده
                      </Button>"""
assert1(src.count(btn_anchor) == 1, 'add-another-video button anchor')
btn_insert = u"""<Plus className="h-3.5 w-3.5 ml-1" />ضيف فيديو تاني للدرس ده
                      </Button>
                      {/* (2026-ز13) إخفاء الدرس كله (كل فيديوهاته) عن طلاب محددين */}
                      {g.key ? (
                        <Button size="sm" variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-7" onClick={() => openLessonHide(g.key, g.grade, g.title, g.parts.length)} title="إخفاء الدرس كله (كل فيديوهاته) عن طلاب محددين">
                          <EyeOff className="h-3.5 w-3.5 mr-1" />إخفاء الدرس كامل عن طلاب
                        </Button>
                      ) : null}"""
src = src.replace(btn_anchor, btn_insert, 1)

# ---------- 4) DIALOG after schedule dialog closing anchor ----------
dlg_anchor = u"""              <Button variant="outline" onClick={() => setScheduleOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}"""
assert1(src.count(dlg_anchor) == 1, 'schedule dialog closing anchor')
dlg_insert = u"""              <Button variant="outline" onClick={() => setScheduleOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      {/* (2026-ز13) إخفاء درس كامل عن طلاب — كل فيديوهات الدرس بتختفي */}
      {lessonHideOpen && lessonHideGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setLessonHideOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={function (e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm">إخفاء الدرس: {lessonHideGroup.title}</h3>
                <p className="text-[10px] text-muted-foreground">الدرس كله ({lessonHideGroup.parts} فيديو) هيختفي من الطلاب المحددين — مش هيشوفوه خالص لحد ما تفك الإخفاء</p>
              </div>
              <button type="button" onClick={() => setLessonHideOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-3">
              <Label className="text-xs font-semibold text-red-600">طلاب صف {lessonHideGroup.grade} — المحددين مخفيين عنهم ({lessonHideSelected.length})</Label>
              <div className="max-h-[220px] overflow-y-auto border rounded-md p-2 space-y-1 mt-2">
                {lessonHideStudents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">مفيش طلاب في الصف ده</p>
                ) : (
                  lessonHideStudents.map(function (s) {
                    var isSel = lessonHideSelected.includes(s.id)
                    return (
                      <button key={'lh-' + s.id} type="button"
                        onClick={function () { if (isSel) { setLessonHideSelected(lessonHideSelected.filter(function (id) { return id !== s.id })) } else { setLessonHideSelected([...lessonHideSelected, s.id]) } }}
                        className={"w-full flex items-center gap-2 p-2 rounded-md text-xs transition-colors " + (isSel ? 'bg-red-50 dark:bg-red-900/20 border border-red-500/30' : 'bg-muted/30 hover:bg-muted/50')}>
                        <div className={"h-4 w-4 rounded border-2 flex items-center justify-center " + (isSel ? 'border-red-500 bg-red-500' : 'border-muted-foreground/30')}>
                          {isSel && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium">{s.name}</span>
                      </button>
                    )
                  })
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">اللي مختارينهم بيتخفي عنهم الدرس بأكله — سيبهم فاضيين ودوس حفظ لو عايز تفك الإخفاء</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLessonHideSave} disabled={lessonHideSaving} className="flex-1">
                {lessonHideSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={() => setLessonHideOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}"""
src = src.replace(dlg_anchor, dlg_insert, 1)

# ---------- 5) admin tab trigger (after item-analytics) ----------
trg_anchor = u"""<TabsTrigger value="item-analytics" className="text-xs sm:text-sm gap-1 text-violet-600 dark:text-violet-400"><PieChart className="h-4 w-4" /><span className="hidden sm:inline">{T('تحليلات الأسئلة', 'Item Analytics')}</span></TabsTrigger>"""
assert1(src.count(trg_anchor) == 1, 'item-analytics trigger anchor')
src = src.replace(trg_anchor, trg_anchor + u"""
            {/* (2026-ز13) تحدي المستر — بنك أسئلة + فلاش كاردز + تحدي أسبوعي */}
            <TabsTrigger value="teacher-challenge" className="text-xs sm:text-sm gap-1 text-amber-600 dark:text-amber-400"><Swords className="h-4 w-4" /><span className="hidden sm:inline">{T('تحدي المستر', 'Challenge')}</span></TabsTrigger>""", 1)

# ---------- 6) TabsContent (after item-analytics content) ----------
cnt_anchor = u"""<TabsContent value="item-analytics"><AdminItemAnalytics /></TabsContent>"""
assert1(src.count(cnt_anchor) == 1, 'item-analytics content anchor')
src = src.replace(cnt_anchor, cnt_anchor + u"""
          {/* (2026-ز13) تحدي المستر — سؤال أسبوعي + بنك + فلاش كاردز */}
          <TabsContent value="teacher-challenge"><TeacherChallengePanel /></TabsContent>""", 1)

assert1(src != orig, 'no changes made?')
io.open(P, 'w', encoding='utf-8').write(src)
print('ADMIN EDITS OK: icons+import+state+button+dialog+tab+content')
