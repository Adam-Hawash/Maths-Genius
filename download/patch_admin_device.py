#!/usr/bin/env python3
# Apply device-control simplification to mr-sherif & mensat-alqaid AdminDashboard.tsx
import sys

OLD_IMPORT = """import { getDeviceCandidates, getDeviceId, getDeviceTraits, getDeviceType } from '@/lib/device'
"""

OLD_HANDLERS = """  // ===== ربط الجهاز: تحكم المستر =====
  const handleDeviceAction = async (id: string, action: 'allowAll' | 'bindOnly', currentValue: { allowAllDevices?: boolean; deviceId?: string }) => {
    try {
      var body: any = {}
      if (action === 'allowAll') body.allowAllDevices = !(currentValue.allowAllDevices === true)
      else body.resetDevice = true
      const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success(action === 'allowAll'
        ? (body.allowAllDevices ? 'تم السماح بالدخول من كل الأجهزة ✅' : 'تم قفل الحساب على جهازه الأصلي 🔒')
        : 'تم فك ربط الجهاز — أول جهاز يسجل دخول بعد كده هيبقى هو جهاز الحساب')
      loadStudents(false)
    } catch { toast.error('خطأ في تحديث إعدادات الجهاز') }
  }

  // ===== ربط الحساب بجهاز المستر الحالي =====
  // ده الحل المباشر لحالة "الحساب اتعمل من الكمبيوتر بتاعي ومش بيدخل منه":
  // المستر دس الزرار من الجهاز اللي هو عايزه → الحساب اتربط بيه **بكل بياناته**
  // (الهوية الفريدة + البصمة + مكوّنات الجهاز) → أول دخول بعدها بيفتح على طول
  const [bindingDevice, setBindingDevice] = useState<string>('')
  const handleBindCurrentDevice = async (id: string) => {
    setBindingDevice(id)
    try {
      var uuid = getDeviceId()
      var cands = getDeviceCandidates()
      var fp = ''
      for (var i = 0; i < cands.length; i++) {
        if (cands[i].indexOf('dv3_') === 0 || cands[i].indexOf('dv2_') === 0) { fp = cands[i]; break }
      }
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bindDevice: uuid || fp,
          bindDeviceFp: fp,
          bindDeviceTraits: JSON.stringify(getDeviceTraits()),
          bindDeviceType: getDeviceType(),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('تم ربط الحساب بالجهاز الحالي ✅ — ادخل بالحساب من الجهاز ده هيفتح على طول')
      loadStudents(false)
    } catch { toast.error('خطأ في ربط الجهاز — جرب تاني') }
    setBindingDevice('')
  }"""

NEW_HANDLERS = """  // ===== فك ربط الجهاز — الزرار الوحيد للمستر (منظومة الجهاز الواحد) =====
  // بعد فك الربط: أول جهاز يعمله الطالب تسجيل دخول بيبقى جهاز حسابه **للأبد**
  const handleUnbind = async (id: string) => {
    if (!window.confirm('فك ربط الجهاز؟ بعد كده أول جهاز يعمله الطالب تسجيل دخول هيبقى هو جهاز حسابه للأبد.')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resetDevice: true }) })
      if (!res.ok) throw new Error()
      toast.success('تم فك الربط — أول جهاز يسجل دخول بعد كده هيبقى هو جهاز الحساب للأبد')
      loadStudents(false)
    } catch { toast.error('خطأ في فك الربط — جرب تاني') }
  }"""

OLD_BADGE = "مقفول على جهاز الإنشاء"
NEW_BADGE = "مربوط بجهاز"

OLD_BLOCKLINE_COMMENT = "                  {/* تشخيص آخر حجب جهاز — المستر يشوف السبب بالتفصيل من غير تخمين */}"
NEW_BLOCKLINE_COMMENT = "                  {/* محاولات الدخول الممنوعة — سطر نظيف بالعربي من غير أي أكواد تقنية */}"

OLD_BLOCKLINE = """                    <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed" title={(s as any).lastDeviceBlock.details}>
                      ⛔ آخر حجب ({new Date((s as any).lastDeviceBlock.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}): {(s as any).lastDeviceBlock.details.replace('محاولة دخول من جهاز غريب — ', '').slice(0, 160)}
                    </p>"""
NEW_BLOCKLINE = """                    <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
                      ⛔ في محاولات دخول من جهاز تاني اترفضت — آخر محاولة: {new Date((s as any).lastDeviceBlock.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>"""

OLD_BUTTONS = """                  {/* زرار السماح — واضح باسمه عشان المستر يلاقيه بسهولة */}
                  <Button size="sm" variant="outline" className={(s as any).allowAllDevices === true ? 'h-8 px-2.5 text-xs border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400' : 'h-8 px-2.5 text-xs border-primary/50 text-primary hover:bg-primary/10'} onClick={() => handleDeviceAction(s.id, 'allowAll', { allowAllDevices: (s as any).allowAllDevices })} title={(s as any).allowAllDevices === true ? 'إلغاء السماح — رجّع الحساب على جهازه الأصلي بس' : 'سماح — الطالب يقدر يفتح حسابه من جهاز جديد (أول دخول بعد السماح يربط الحساب بالجهاز ده ويقفله)'}><Smartphone className="h-3.5 w-3.5" />{(s as any).allowAllDevices === true ? 'إلغاء السماح' : 'سماح / نقل جهاز'}</Button>
                  {/* ربط الجهاز الحالي — الحل المباشر: الحساب يتربط بالجهاز اللي المستر واقف عليه دلوقتي */}
                  {(s as any).allowAllDevices !== true && (
                    <Button size="sm" variant="outline" disabled={bindingDevice === s.id} className="h-8 px-2.5 text-xs border-violet-400 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400" onClick={() => handleBindCurrentDevice(s.id)} title="ربط الحساب بالجهاز اللي انت فاتح منه لوحة التحكم دلوقتي — بعد كده الدخول من الجهاز ده هيفتح على طول">
                      <Monitor className="h-3.5 w-3.5" />{bindingDevice === s.id ? 'جاري الربط…' : 'اربط جهازي الحالي'}
                    </Button>
                  )}
                  {(s as any).deviceId && (s as any).allowAllDevices !== true && (
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400" onClick={() => handleDeviceAction(s.id, 'bindOnly', {})} title="فك ربط الجهاز — أول جهاز يسجل دخول بعد كده هيبقى هو جهاز الحساب الجديد"><RotateCcw className="h-3.5 w-3.5" />فك الربط</Button>
                  )}"""

NEW_BUTTONS = """                  {/* فك الربط — التحكم الوحيد: بعد الفك أول جهاز يدخل بيبقى جهاز الحساب للأبد */}
                  {((s as any).deviceId || (s as any).creationDeviceId) && (s as any).allowAllDevices !== true && (
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400" onClick={() => handleUnbind(s.id)} title="فك ربط الجهاز — أول جهاز يسجل دخول بعد كده هيبقى هو جهاز الحساب الجديد للأبد"><RotateCcw className="h-3.5 w-3.5" />فك الربط</Button>
                  )}"""

REPLACEMENTS = [
    ("import line", OLD_IMPORT, ""),
    ("handlers", OLD_HANDLERS, NEW_HANDLERS),
    ("badge", OLD_BADGE, NEW_BADGE),
    ("blockline comment", OLD_BLOCKLINE_COMMENT, NEW_BLOCKLINE_COMMENT),
    ("blockline", OLD_BLOCKLINE, NEW_BLOCKLINE),
    ("buttons", OLD_BUTTONS, NEW_BUTTONS),
]

def main(paths):
    ok = True
    for path in paths:
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
        for name, old, new in REPLACEMENTS:
            n = src.count(old)
            if n != 1:
                print(f"[FAIL] {path}: '{name}' found {n} times (expected 1)")
                ok = False
                continue
            src = src.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f"[OK] {path} patched")
    sys.exit(0 if ok else 1)

if __name__ == '__main__':
    main(sys.argv[1:])
