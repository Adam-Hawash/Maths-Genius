// Z-18 fixes: Zicola variants + القائد broken-dialog removal
import fs from 'fs'
const B = '/home/z/repos'
let total = 0, miss = 0
function rep(content, oldS, newS, expected, label, file) {
  const n = content.split(oldS).length - 1
  if (n !== expected) { console.log(`  MISS [${file}] ${label}: ${n}/${expected}`); miss++; return content }
  total++
  return content.split(oldS).join(newS)
}

// ===== Zicola-Math =====
console.log('=== Zicola-Math ===')
{
  const ap = `${B}/Zicola-Math/src/components/admin/AdminDashboard.tsx`
  let adm = fs.readFileSync(ap, 'utf8')
  adm = rep(adm,
`                        <Layers className="h-3.5 w-3.5 mr-1" />{isGrouped ? 'ضيف فيديو تاني للدرس ده' : 'درس بفيديوهات متعددة؟'}
                      </Button>`,
`                        <Layers className="h-3.5 w-3.5 mr-1" />{isGrouped ? 'ضيف فيديو تاني للدرس ده' : 'درس بفيديوهات متعددة؟'}
                      </Button>
                      {/* (ز18) سعر الدرس كله — مرة واحدة على كل الأجزاء */}
                      <Button size="sm" variant="ghost" className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs h-7" onClick={function () { openLessonPrice(gKey, v.grade, v.title, gParts[0] ? Number(gParts[0].price || 0) : 0) }} title="Set one price for the whole lesson — paying once unlocks ALL its parts">
                        💰 سعر الدرس كله
                      </Button>`, 1, 'ZA2 admin button', 'AdminDashboard')
  fs.writeFileSync(ap, adm)

  const sp = `${B}/Zicola-Math/src/components/student/StudentPortal.tsx`
  let por = fs.readFileSync(sp, 'utf8')
  if (!por.includes('ز18')) {
    // group card: any part approved = lesson paid
    por = rep(por,
`            const gNeedsPay = gHasPrice && !approvedVideoIds.has(first.id)`,
`            /* (ز18) أي جزء متسدد = الدرس كله متسدد */
            const gNeedsPay = gHasPrice && !gParts.some(function (pp) { return approvedVideoIds.has(pp.id) })`, 1, 'Z1 card group-aware', 'StudentPortal')
    // modal parts: group-aware
    por = rep(por,
`            const needsPay = (p.price || 0) > 0 && !approvedVideoIds.has(p.id)`,
`            /* (ز18) أول تسديد بيفتح الدرس كله — أي جزء متسدد يفتح الباقي */
            const groupAnyPaidZ18 = parts.some(function (pp) { return approvedVideoIds.has(pp.id) })
            const needsPay = !groupAnyPaidZ18 && (p.price || 0) > 0 && !approvedVideoIds.has(p.id)`, 1, 'Z2 modal group-aware', 'StudentPortal')
    // modal pay → lesson-level
    por = rep(por,
`          onPayPart={function (p) {
            setPendingPaymentVideo({ id: p.id, title: p.title, price: p.price || 0, grade: grade })
            setView('student-payment')
          }}`,
`          onPayPart={function (p) {
            /* (ز18) الدفع بيفتح الدرس كله */
            setPendingPaymentVideo({ id: p.id, title: 'الدرس كامل: ' + p.title, price: p.price || 0, grade: grade })
            setView('student-payment')
          }}`, 1, 'Z3 pay lesson-level', 'StudentPortal')
    fs.writeFileSync(sp, por)
  } else console.log('  portal already patched')
}

// ===== mensat-alqaid: remove broken A3 dialog (no group UI exists there) =====
console.log('=== mensat-alqaid ===')
{
  const ap = `${B}/mensat-alqaid/src/components/admin/AdminDashboard.tsx`
  let adm = fs.readFileSync(ap, 'utf8')
  const DIALOG = `
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
`
  adm = rep(adm, DIALOG, `\n`, 1, 'Q1 remove broken dialog', 'AdminDashboard')
  fs.writeFileSync(ap, adm)
  console.log('  القائد: single-video pricing already live (line 794 overlay) — no groups in this platform')
}
console.log(`\nTOTAL: ${total}, MISSES: ${miss}`)
