'use client'

// ============================================================
// (2026-و66) TeacherChallengePanel — إدارة «تحدي المستر» للأدمن
// ============================================================
// • GET /api/arena/challenges (بدون studentId) → {active, leaderboard, history}
//   ملاحظة: السيرفر بيخفي correctIndex عن الطلاب — الأدمن بيظهرها لو متاحة
//   في الاستجابة أو من آخر إنشاء محلي (knownCorrect).
// • إنشاء تحدي جديد (بيقفل النشط تلقائي على السيرفر) + قفل + دخول المستر
//   بنفسه + مسح دخول طالب + إعادة فتح/مسح من التاريخ.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Flame, Loader2, RotateCcw, Swords, Trash2, Trophy, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const LETTERS = ['أ', 'ب', 'ج', 'د']
const MEDALS = ['🥇', '🥈', '🥉']

interface Challenge {
  id: string
  title: string
  question: string
  options: string[]
  points: number
  durationMin: number
  active: boolean
  closesAt: string | null
  createdAt: string
  correctIndex?: number
}

interface LeaderEntry {
  rank: number
  name: string
  isTeacher: boolean
  correct: boolean
  timeMs: number
  choice: number
  createdAt: string
}

interface HistItem {
  id: string
  title: string
  active: boolean
  points: number
  createdAt: string
}

function fmtDateTime(s: string | null): string {
  if (!s) return ''
  try {
    return new Date(s).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  } catch (e) {
    return String(s).slice(0, 16)
  }
}

export function TeacherChallengePanel() {
  const [active, setActive] = useState<Challenge | null>(null)
  const [board, setBoard] = useState<LeaderEntry[]>([])
  const [history, setHistory] = useState<HistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [knownCorrect, setKnownCorrect] = useState<Record<string, number>>({})

  /* فورم الإنشاء */
  const [fTitle, setFTitle] = useState('')
  const [fQuestion, setFQuestion] = useState('')
  const [fOpts, setFOpts] = useState<string[]>(['', '', '', ''])
  const [fCorrect, setFCorrect] = useState(0)
  const [fPoints, setFPoints] = useState('30')
  const [fDur, setFDur] = useState('0')

  /* مفتاح العملية الشغالة (create | close | join | entry:{rank} | reopen:{id} | del:{id}) */
  const [busy, setBusy] = useState('')

  const load = useCallback(async function () {
    try {
      const res = await fetch('/api/arena/challenges')
      const data = await res.json()
      if (res.ok && data.ok) {
        setActive((data.active || null) as Challenge | null)
        setBoard((data.leaderboard || []) as LeaderEntry[])
        setHistory((data.history || []) as HistItem[])
      } else {
        toast.error(String(data.error || 'مشكلة في تحميل التحدي'))
      }
    } catch (e) {
      toast.error('مشكلة في الاتصال — جرب تاني')
    }
    setLoading(false)
  }, [])

  useEffect(function () {
    // (2026-و66) تحميل أولي — الفيتش async (كل setState بعد await)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  /* POST عام لأفعال الأدمن + رسالة نجاح اختيارية — بيرجع بيانات الاستجابة لو نجحت */
  const post = async function (payload: Record<string, unknown>, successMsg?: string): Promise<any | null> {
    try {
      const res = await fetch('/api/arena/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      let data: any = {}
      try { data = await res.json() } catch (e) { /* استجابة فاضية */ }
      if (res.ok && data.ok) {
        if (successMsg) toast.success(successMsg)
        await load()
        return data
      }
      toast.error(String(data.error || 'حصلت مشكلة — جرب تاني'))
      return null
    } catch (e) {
      toast.error('مشكلة في الاتصال — جرب تاني')
      return null
    }
  }

  /* ===== إنشاء تحدي جديد ===== */
  const create = async function () {
    const title = fTitle.trim()
    const question = fQuestion.trim()
    const filled = fOpts.map(function (o) { return o.trim() })
    const filledCount = filled.filter(function (o) { return o }).length
    if (!title || !question) {
      toast.error('اكتب عنوان وسؤال التحدي')
      return
    }
    if (filledCount < 2) {
      toast.error('لازم اختيارين على الأقل مش فاضيين')
      return
    }
    if (!filled[fCorrect]) {
      toast.error('اختار الإجابة الصح من الاختيارات المكتوبة')
      return
    }
    // السيرفر بيرفض الاختيارات الفاضية — نبعت المليانة بس ونظبط رقم الصح
    const payloadOpts: string[] = []
    let payloadCorrect = 0
    for (let i = 0; i < filled.length; i++) {
      if (!filled[i]) continue
      if (i === fCorrect) payloadCorrect = payloadOpts.length
      payloadOpts.push(filled[i])
    }
    setBusy('create')
    const resp = await post(
      {
        action: 'create',
        title: title,
        question: question,
        options: payloadOpts,
        correctIndex: payloadCorrect,
        points: Number(fPoints) || 30,
        durationMin: Number(fDur) || 0,
      },
      'نزل التحدي! التحدي القديم اتقفل تلقائي 🎯'
    )
    if (resp) {
      // نخزن الإجابة الصح للتحدي الجديد محليًا — عشان الهايلايت يظهر فورًا
      // (السيرفر بيرجع id الجديد، وcorrectIndex مش بيبعتها في GET عشان الطالب)
      if (resp.id) {
        setKnownCorrect(function (prev) {
          const next = Object.assign({}, prev)
          next[String(resp.id)] = payloadCorrect
          return next
        })
      }
      setFTitle('')
      setFQuestion('')
      setFOpts(['', '', '', ''])
      setFCorrect(0)
      setFPoints('30')
      setFDur('0')
    }
    setBusy('')
  }

  /* ===== أفعال التحدي النشط ===== */
  const closeActive = async function () {
    if (!active) return
    setBusy('close')
    await post({ action: 'close', id: active.id }, 'اتقفل التحدي ✋')
    setBusy('')
  }

  const teacherJoin = async function () {
    if (!active) return
    setBusy('join')
    await post({ action: 'teacherJoin', id: active.id }, 'نزلت في التحدي! 👨‍🏫')
    setBusy('')
  }

  /* ===== مسح دخول طالب من لوحة الترتيب ===== */
  const deleteEntry = async function (en: LeaderEntry) {
    // (2026-و66) ملاحظة: لو نسخة السيرفر مش بتبعت id في لوحة الترتيب
    // مش هنعرف تمسح — لما الـ id يتضاف هيشتغل من غير أي تعديل
    const entryId = String((en as any).id || '')
    if (!entryId) {
      toast.error('السيرفر مش بيبعت معرف الدخول — مش هنعرف نمسحه من هنا')
      return
    }
    setBusy('entry:' + en.rank)
    await post({ action: 'deleteEntry', entryId: entryId }, 'اتشال الدخول')
    setBusy('')
  }

  /* ===== أفعال التاريخ ===== */
  const reopen = async function (h: HistItem) {
    if (!window.confirm('إعادة فتح «' + h.title + '» هتقفل التحدي النشط الحالي — تكمل؟')) return
    setBusy('reopen:' + h.id)
    await post({ action: 'reopen', id: h.id }, 'اتفتح التحدي تاني 🔁')
    setBusy('')
  }

  const removeHist = async function (h: HistItem) {
    if (!window.confirm('متأكد من مسح «' + h.title + '»؟ هتمسح كل دخولات الطلبة معاه')) return
    setBusy('del:' + h.id)
    await post({ action: 'delete', id: h.id }, 'اتمسح التحدي')
    setBusy('')
  }

  /* رقم الإجابة الصح اللي الأدمن يشوفه (لو متاح) */
  const getCorrectIndex = function (ch: Challenge): number {
    if (typeof ch.correctIndex === 'number') return ch.correctIndex
    if (knownCorrect[ch.id] !== undefined) return knownCorrect[ch.id]
    return -1
  }

  if (loading) {
    return (
      <Card dir="rtl">
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          بنحمّل تحدي المستر…
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ============ الفورم: نزّل تحدي جديد ============ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Swords className="h-5 w-5 text-amber-600" />
            ➕ نزّل تحدي جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">عنوان التحدي</label>
            <Input
              value={fTitle}
              onChange={function (e) { setFTitle(e.target.value) }}
              placeholder="مثال: تحدي الأسبوع — معادلة ذكية"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">السؤال</label>
            <Textarea
              rows={3}
              value={fQuestion}
              onChange={function (e) { setFQuestion(e.target.value) }}
              placeholder="اكتب السؤال الصعب هنا…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">الاختيارات — علّم على الصح ✅</label>
            {fOpts.map(function (o, i) {
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">{LETTERS[i]}</span>
                  <Input
                    value={o}
                    onChange={function (e) {
                      const next = fOpts.slice()
                      next[i] = e.target.value
                      setFOpts(next)
                    }}
                    placeholder={i < 2 ? 'اختيار ' + LETTERS[i] + ' (مطلوب)' : 'اختيار ' + LETTERS[i] + ' (اختياري)'}
                  />
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <input
                      type="radio"
                      name="tc-correct"
                      className="accent-emerald-600"
                      checked={fCorrect === i}
                      onChange={function () { setFCorrect(i) }}
                    />
                    الصح
                  </label>
                </div>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">النقاط</label>
              <Input
                type="number"
                min={10}
                max={200}
                value={fPoints}
                onChange={function (e) { setFPoints(e.target.value) }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">المدة بالدقايق</label>
              <Input
                type="number"
                min={0}
                value={fDur}
                onChange={function (e) { setFDur(e.target.value) }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">0 = مفتوح لحد ما تقفله بنفسك</p>
            </div>
          </div>
          <Button
            onClick={create}
            disabled={busy === 'create'}
            className="w-full bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
          >
            {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            نزّل التحدي
          </Button>
          <p className="text-[11px] text-muted-foreground">
                ملاحظة: تنزيل تحدي جديد بيقفل التحدي الشغال تلقائي — والطالب اللي جاوب قبل كده مش هيتأثر
          </p>
        </CardContent>
      </Card>

      {/* ============ التحدي النشط ============ */}
      {active ? (
        <Card className="overflow-hidden p-0">
          {/* هيدر أمبر متدرج */}
          <div className="bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 px-4 py-3 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-bold">
                <Flame className="h-4 w-4" />
                {active.title}
              </h3>
              <div className="flex items-center gap-1.5">
                <Badge className="border-white/30 bg-white/20 text-white">{active.points} نقطة</Badge>
                <Badge className="border-white/30 bg-white/20 text-white">
                  {active.closesAt ? '⏳ لحد ' + fmtDateTime(active.closesAt) : '♾️ مفتوح'}
                </Badge>
              </div>
            </div>
          </div>
          <CardContent className="space-y-3 pt-4">
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{active.question}</p>

            {/* الاختيارات — الصح متعلّم بالأخضر للأدمن */}
            <div className="space-y-1.5">
              {(Array.isArray(active.options) ? active.options : []).map(function (o, i) {
                const isCorrect = i === getCorrectIndex(active as Challenge)
                return (
                  <div
                    key={i}
                    className={
                      'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ' +
                      (isCorrect
                        ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'border-border bg-card text-card-foreground')
                    }
                  >
                    <span className="w-4 shrink-0 text-center text-xs font-bold text-muted-foreground">{LETTERS[i]}</span>
                    <span className="flex-1">{o}</span>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={closeActive}
                disabled={busy === 'close'}
                className="gap-1"
              >
                {busy === 'close' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                قفل التحدي
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={teacherJoin}
                disabled={busy === 'join'}
                className="gap-1"
              >
                {busy === 'join' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5 text-amber-600" />}
                ادخل التحدي بنفسك 👨‍🏫
              </Button>
            </div>

            {/* لوحة الترتيب */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <Trophy className="h-4 w-4 text-amber-600" />
                لوحة الترتيب
                <span className="text-[11px] font-normal text-muted-foreground">(الصح الأول = الأسرع)</span>
              </div>
              {board.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">لسه حدش جاوب — شوف مين هيوصل الأول 👀</p>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto pl-1">
                  {board.map(function (en) {
                    return (
                      <div
                        key={en.rank + '-' + en.createdAt}
                        className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-sm"
                      >
                        <span className="w-7 shrink-0 text-center">{en.rank <= 3 ? MEDALS[en.rank - 1] : '#' + en.rank}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {en.name}
                          {en.isTeacher ? (
                            <Badge variant="secondary" className="mr-1.5 text-[9px]">
                              👨‍🏫 المستر
                            </Badge>
                          ) : null}
                        </span>
                        {en.correct ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        )}
                        <span className="w-12 shrink-0 text-left text-[11px] text-muted-foreground" dir="ltr">
                          {en.correct ? (en.timeMs / 1000).toFixed(1) + 's' : '—'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-600"
                          onClick={function () { deleteEntry(en) }}
                          disabled={busy === 'entry:' + en.rank}
                          aria-label="شيل الدخول"
                          title="شيل الدخول ده"
                        >
                          {busy === 'entry:' + en.rank ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            مفيش تحدي شغال دلوقتي — نزّل واحد من فوق وهيتعرض هنا 🎯
          </CardContent>
        </Card>
      )}

      {/* ============ التاريخ ============ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📜 تحديات قديمة</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">مفيش تحديات قديمة</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pl-1">
              {history.map(function (h) {
                return (
                  <div key={h.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{h.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {fmtDateTime(h.createdAt)} · {h.points} نقطة
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={function () { reopen(h) }}
                        disabled={busy === 'reopen:' + h.id}
                      >
                        {busy === 'reopen:' + h.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        إعادة فتح
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                        onClick={function () { removeHist(h) }}
                        disabled={busy === 'del:' + h.id}
                        aria-label="مسح"
                        title="مسح"
                      >
                        {busy === 'del:' + h.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
