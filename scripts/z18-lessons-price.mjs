// Z-18: lesson-level pricing → 5 remaining platforms (strict anchors + counts)
import fs from 'fs'
const REPOS = ['Mr-Sherif-ElSayed', 'Mr-Mohamed-Sabry', 'Zicola-Math', 'shaimaa-selim-science', 'mensat-alqaid']
const B = '/home/z/repos'
let total = 0, miss = 0

function rep(content, oldS, newS, expected, label, file) {
  const n = content.split(oldS).length - 1
  if (n !== expected) { console.log(`  MISS [${file}] ${label}: ${n}/${expected}`); miss++; return content }
  total++
  return content.split(oldS).join(newS)
}

// ---- 1. lesson-price API (copy verbatim from M-G) ----
const apiSrc = fs.readFileSync(`${B}/Maths-Genius/src/app/api/videos/lesson-price/route.ts`, 'utf8')
for (const r of REPOS) {
  const dir = `${B}/${r}/src/app/api/videos/lesson-price`
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(`${dir}/route.ts`, apiSrc)
  console.log(`${r}: lesson-price API ✓`)
}

for (const r of REPOS) {
  console.log(`\n=== ${r} ===`)

  // ---- 2. payments approval → whole group ----
  const pp = `${B}/${r}/src/app/api/payments/[id]/route.ts`
  let pay = fs.readFileSync(pp, 'utf8')
  if (!pay.includes('(ز18)')) {
    pay = rep(pay,
`    if (status === 'approved' && payment.videoId) {
      try {
        await db.videoAccess.upsert({
          where: {
            videoId_studentId: {
              videoId: payment.videoId,
              studentId: payment.studentId,
            },
          },
          create: {
            videoId: payment.videoId,
            studentId: payment.studentId,
            grantedBy: adminId,
          },
          update: {},
        })
      } catch (err) {
        console.error('Error granting video access:', err)
      }`,
`    if (status === 'approved' && payment.videoId) {
      try {
        /* (ز18) الدفع للدرس كله: لو الفيديو جزء من درس متعدد الأجزاء (groupKey)
           الموافقة بتفتح كل أجزاء الدرس — الطالب بيدفع مرة واحدة للدرس */
        var paidVideo = await db.video.findUnique({ where: { id: payment.videoId } })
        var accessTargets: { id: string }[] = [{ id: payment.videoId }]
        if (paidVideo && paidVideo.groupKey) {
          var groupParts = await db.video.findMany({ where: { groupKey: paidVideo.groupKey, grade: paidVideo.grade }, select: { id: true } })
          if (groupParts && groupParts.length > 0) accessTargets = groupParts
        }
        for (var ti = 0; ti < accessTargets.length; ti++) {
          await db.videoAccess.upsert({
            where: {
              videoId_studentId: {
                videoId: accessTargets[ti].id,
                studentId: payment.studentId,
              },
            },
            create: {
              videoId: accessTargets[ti].id,
              studentId: payment.studentId,
              grantedBy: adminId,
            },
            update: {},
          })
        }
      } catch (err) {
        console.error('Error granting video access:', err)
      }`, 1, 'approve group unlock', 'payments/[id]')
    fs.writeFileSync(pp, pay)
  } else console.log('  payments: already patched')

  // ---- 3. AdminDashboard (3 hunks) ----
  const ap = `${B}/${r}/src/components/admin/AdminDashboard.tsx`
  let adm = fs.readFileSync(ap, 'utf8')
  if (!adm.includes('(ز18)')) {
    adm = rep(adm,
`  const [lessonHideSaving, setLessonHideSaving] = useState(false)`,
`  const [lessonHideSaving, setLessonHideSaving] = useState(false)
  /* (ز18) Lesson price — set one price for the whole lesson (all its parts) */
  const [lessonPriceOpen, setLessonPriceOpen] = useState(false)
  const [lessonPriceGroup, setLessonPriceGroup] = useState<{ key: string; title: string; grade: string; price: number } | null>(null)
  const [lessonPriceValue, setLessonPriceValue] = useState('')
  const [lessonPriceSaving, setLessonPriceSaving] = useState(false)

  const openLessonPrice = function (key: string, grade: string, title: string, price: number) {
    setLessonPriceGroup({ key: key, grade: grade, title: title, price: price })
    setLessonPriceValue(price > 0 ? String(price) : '')
    setLessonPriceOpen(true)
  }

  const handleLessonPriceSave = async function () {
    if (!lessonPriceGroup) return
    setLessonPriceSaving(true)
    try {
      var res = await fetch('/api/videos/lesson-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupKey: lessonPriceGroup.key, grade: lessonPriceGroup.grade, price: Number(lessonPriceValue) || 0 }),
      })
      var data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'failed')
      toast.success('✓ Lesson price saved: ' + (Number(lessonPriceValue) || 0) + ' EGP — applied to all parts of the lesson')
      setLessonPriceOpen(false)
      loadVideos(false)
    } catch (e) {
      toast.error('Could not save the lesson price — try again')
    } finally {
      setLessonPriceSaving(false)
    }
  }`, 1, 'A1 state+handlers', 'AdminDashboard')

    adm = rep(adm,
`                        <Plus className="h-3.5 w-3.5 ml-1" />ضيف فيديو تاني للدرس ده
                      </Button>`,
`                        <Plus className="h-3.5 w-3.5 ml-1" />ضيف فيديو تاني للدرس ده
                      </Button>
                      {/* (ز18) سعر الدرس كله — مرة واحدة على كل الأجزاء */}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={function () { openLessonPrice(g.key, g.grade, g.title, g.price) }} title="Set one price for the whole lesson — paying once unlocks ALL its parts">
                        💰 سعر الدرس كله
                      </Button>`, 1, 'A2 group button', 'AdminDashboard')

    adm = rep(adm,
`          </div>
        </div>
      )}

      {/* (2026-و29) نافذة جدولة المجموعات — كل مجموعة بميعادها، والفيديو مخفي قبل الميعاد بدون عداد */}`,
`          </div>
        </div>
      )}

      {/* (ز18) Lesson price dialog — one price for the whole lesson */}
      {lessonPriceOpen && lessonPriceGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={function () { setLessonPriceOpen(false) }}>
          <div className="bg-card border border-border rounded-xl p-5 shadow-2xl w-full max-w-sm" onClick={function (e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm">💰 Lesson price: {lessonPriceGroup.title}</h3>
                <p className="text-[10px] text-muted-foreground">The price applies to the whole lesson ({lessonPriceGroup.grade}) — paying once unlocks ALL its parts. 0 = free.</p>
              </div>
              <button type="button" onClick={function () { setLessonPriceOpen(false) }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="mb-3">
              <Label className="text-xs font-semibold">Price (EGP)</Label>
              <Input type="number" min="0" step="1" value={lessonPriceValue} onChange={function (e) { setLessonPriceValue(e.target.value) }} placeholder="e.g. 50" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLessonPriceSave} disabled={lessonPriceSaving} className="flex-1">
                {lessonPriceSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button variant="outline" onClick={function () { setLessonPriceOpen(false) }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* (2026-و29) نافذة جدولة المجموعات — كل مجموعة بميعادها، والفيديو مخفي قبل الميعاد بدون عداد */}`, 1, 'A3 dialog', 'AdminDashboard')
    fs.writeFileSync(ap, adm)
  } else console.log('  AdminDashboard: already patched')

  // ---- 4. StudentPortal (5 hunks) ----
  const sp = `${B}/${r}/src/components/student/StudentPortal.tsx`
  let por = fs.readFileSync(sp, 'utf8')
  if (!por.includes('ز18')) {
    por = rep(por,
`    const anyNeedPay = g.parts.some(function (p) { return (p.price || 0) > 0 && !approvedVideoIds.has(p.id) })`,
`    const anyNeedPay = g.parts.some(function (p) { return (p.price || 0) > 0 && !approvedVideoIds.has(p.id) })
    /* (ز18) سعر الدرس كله — أول تسديد بيفتح كل الأجزاء، والسعر ظاهر لطلاب المجانية */
    const groupPaidZ18 = g.parts.some(function (p) { return approvedVideoIds.has(p.id) })
    const lessonLockedZ18 = anyNeedPay && !groupPaidZ18
    const pricedPartZ18 = g.parts.find(function (p) { return (p.price || 0) > 0 })`, 1, 'P1 group vars', 'StudentPortal')

    por = rep(por,
`+ (anyNeedPay ? 'opacity-40 blur-sm' : '')`,
`+ (lessonLockedZ18 ? 'opacity-40 blur-sm' : '')`, 1, 'P2 blur', 'StudentPortal')

    por = rep(por,
`            <Badge className="bg-primary text-white text-[10px] gap-1">
              <MonitorPlay className="h-3 w-3" /> {g.parts.length} فيديوهات
            </Badge>`,
`            <Badge className="bg-primary text-white text-[10px] gap-1">
              <MonitorPlay className="h-3 w-3" /> {g.parts.length} فيديوهات
            </Badge>
            {/* (ز18) سعر الدرس كله يظهر لطلاب المجانية */}
            {lessonLockedZ18 && pricedPartZ18 && (
              <Badge className="bg-amber-500 text-white text-[10px] gap-1 font-bold">💰 الدرس كامل {pricedPartZ18.price} ج.م</Badge>
            )}`, 1, 'P3 badge', 'StudentPortal')

    por = rep(por,
`          <Button size="sm" className="mt-2 w-full h-9 text-xs" onClick={function () { setActiveLessonGroup({ title: g.title, parts: g.parts }) }}>
            فتح صفحة الدرس ({g.parts.length} أجزاء)
          </Button>`,
`          {lessonLockedZ18 && pricedPartZ18 ? (
            /* (ز18) الدفع للدرس كله — مرة واحدة بتفتح كل الأجزاء */
            <Button size="sm" className="mt-2 w-full h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={function () { setPendingPaymentVideo({ id: pricedPartZ18.id, title: 'الدرس كامل: ' + g.title, price: Number(pricedPartZ18.price) || 0, grade: g.grade || grade }); setView('student-payment') }}>
              💰 ادفع الآن وافتح الدرس كله ({pricedPartZ18.price} ج.م)
            </Button>
          ) : (
            <Button size="sm" className="mt-2 w-full h-9 text-xs" onClick={function () { setActiveLessonGroup({ title: g.title, parts: g.parts }) }}>
              فتح صفحة الدرس ({g.parts.length} أجزاء)
            </Button>
          )}`, 1, 'P4 pay button', 'StudentPortal')

    por = rep(por,
`                const payLockedP = (p.price || 0) > 0 && !approvedVideoIds.has(p.id)`,
`                /* (ز18) الدرس اتسدد جزء منه؟ الكل بيفتح — الدفع بيتم للدرس كله */
                const groupAnyApprovedZ18 = activeLessonGroup.parts.some(function (pp: any) { return approvedVideoIds.has(pp.id) })
                const payLockedP = !groupAnyApprovedZ18 && (p.price || 0) > 0 && !approvedVideoIds.has(p.id)`, 1, 'P5 group-aware lock', 'StudentPortal')

    por = rep(por,
`                        <Button size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white" onClick={function () { setPendingPaymentVideo({ id: p.id, title: p.title, price: p.price || 0, grade: p.grade || grade }); setView('student-payment') }}>ادفع الآن</Button>`,
`                        <Button size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white" onClick={function () { setPendingPaymentVideo({ id: p.id, title: 'الدرس كامل: ' + (activeLessonGroup.title || p.title), price: p.price || 0, grade: p.grade || grade }); setView('student-payment') }}>ادفع وافتح الدرس كله</Button>`, 1, 'P6 part pay title', 'StudentPortal')

    fs.writeFileSync(sp, por)
  } else console.log('  StudentPortal: already patched')
}
console.log(`\nTOTAL: ${total} applied, ${miss} MISSES`)
