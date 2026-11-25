'use client'

// ============================================================
// DevToolsGuard — ر12 بطلب المستر الحرفي:
// «انا فاتح الـ developer tools اهو، ما فيش اي حاجة حصلت.
//  انا عايز لما افتح الـ developer tools يجيب لي الـ انسبكت ده»
// ============================================================
// تشخيص ر12 (دليل حي من سكرين شوت المستر): إشارة ر10 الوحيدة (فخ
// الكونسول getter) **مكسورة في كروم الحديث** — كروم بيرسم معاينة
// الكونسول المطوية من غير ما يشغّل الـ getter، فالـ object بتاع الفخ
// بيظهر مطوي «▸ Object» في الكونسول من غير ما الإشارة تشتغل خالص
// — الكونسول بتاع المستر كان مليان Object من فخ الحارس نفسه
// (chunk المنصة 2tv1ox6drw5qz.js) ومفيش أي عدّاد ظهر.
//
// قرار ر12:
//   • الإشارة الأولى: **فخ توقّف الـ debugger** — دالة مولّدة مرة
//     واحدة وتسخّنة في الإعداد برة القياس، والقياس متزامن حوالين
//     الاستدعاء بس: من غير أدوات مفتوحة الاستدعاء no-op في نص
//     الميكروثانية حتى أضعف جهاز = مستحيل تتعدى عتبة 100ms = صفر
//     إنذارات كاذبة مضمونة، ومع أدوات مفتوحة (أي تاب
//     Console/Elements/Sources ومهما كان docking أو فحص عن بعد)
//     التنفيذ بيقف لحد ما حد يضغط Continue → الفرق بيبقى ثواني =
//     أدوات مفتوحة مؤكد 100%.
//     ليه الدالة مولّدة مش جملة ثابتة؟ لأن مينفايشن SWC بيشيل جملة
//     debugger الثابتة من البناء النهائي (اتثبت بالفحص قبل ر12)
//     — والسترينج بيرجع من المينيفايشن.
//     ومختلفة عن ر8 اللي كانت بتنذر كاذب: ر8 كانت بتكومبايل داخل
//     القياس كل تيك وكلفة الكومبايلة على موبايل ضعيف بتعدّي عتبة
//     50ms من غير أدوات — هنا الكومبايلة مرة واحدة في الإعداد
//     (تسخين) برة القياس خالص.
//     وتشتغل بس: لجلسة طالب حقيقية + مش أتمتة (navigator.webdriver)
//     + برة العدّ — أثناء العدّ منوقفش الصفحة عشان الطالب يشوف
//     العدّ ويلحق يقفل الأدوات ويسامح.
//   • الإشارة التانية (باقية من ر10): فخ الكونسول getter — بتشيل
//     كروم القديم والواحد اللي بيوسّع الـ object في الكونسول.
//   • العدّ في **حالة واحدة بس**: أدوات المطوّر مفتوحة فعلًا (ر10) —
//     فتح المنصة عادي أو فتح فيديو = صفر عدّاد صفر إنذارات.
//   • المهلة من إعداد الأدمن guard_countdown_seconds (افتراضي
//     8 ثواني — يقبل 3..120) زي ما المستر طلب.
//   • إصلاح بَج ر8: بعد المسامحة body.style.overflow بيرجع فورًا
//     مع إزالة الشاشة (ر10).
//
// عند الصفر (أدوات مفتوحة والعد خلص) — نفس قرار ر7/ر8:
//   تدمير كل الـ iframes والفيديوهات من الصفحة (منع النسخ) +
//   POST /api/security/reject-account بيرفض الحساب نهائيًا (مش مسح
//   — المستر يرجّعه من تاب الطلاب المرفوضين) + قفل الجلسات + شاشة
//   «حسابك مرفوض من المنصة» دائمة.
//
// الأدمن مستثنى (قرار ز19): جلسة أدمن بدون جلسة طالب = الحارس ما
// بيشتغلش أصلًا — المستر يفتح أدوات المطوّر براحته.
// ============================================================
import { useEffect } from 'react'
import { getDeviceCandidates, getDeviceId } from '@/lib/device'
import {
  GUARD_COUNTDOWN_KEY,
  GUARD_COUNTDOWN_DEFAULT,
} from '@/lib/video-guard'

const LOCK_KEY = 'dv_guard_locked'

export function DevToolsGuard() {
  useEffect(function () {
    if (typeof window === 'undefined') return

    /* ===== جلسات ===== */
    function hasAdminKey(): boolean {
      try {
        for (var li = 0; li < localStorage.length; li++) {
          var lk = localStorage.key(li) || ''
          if (/admin/i.test(lk)) return true
        }
      } catch (e) {}
      return false
    }

    function readStudent(): { id: string } | null {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || ''
          if (/admin/i.test(k)) continue
          if (k === 'ln' || /student/i.test(k)) {
            var raw = localStorage.getItem(k) || ''
            if (raw && raw.charAt(0) === '{') {
              var o = JSON.parse(raw)
              if (o && o.id) return { id: String(o.id) }
            }
          }
        }
      } catch (e) {}
      return null
    }

    /* الأدمن مستثنى بس لو مفيش جلسة طالب على نفس المتصفح — لو الطالب
       مسجّل، الحارس شغال عادي (حماية الحساب أهم) */
    if (hasAdminKey() && !readStudent()) return

    /* تاب متقفل نهائي (الرفض حصل قبل كده في نفس التاب) */
    try {
      var lockedVal = sessionStorage.getItem(LOCK_KEY) || ''
      if (lockedVal === 'rejected') { renderFinal('rejected'); return }
      if (lockedVal === '1') { renderFinal('locked'); return }
    } catch (e) {}

    /* ===== الإعداد: مهلة العدّ من لوحة الأدمن (افتراضي 8 ثواني) ===== */
    var countMs = GUARD_COUNTDOWN_DEFAULT * 1000
    try {
      fetch('/api/site-config')
        .then(function (r) { return r.json() })
        .then(function (arr: any) {
          if (!Array.isArray(arr)) return
          for (var i = 0; i < arr.length; i++) {
            var c = arr[i]
            if (c && c.key === GUARD_COUNTDOWN_KEY && c.value !== '' && c.value != null) {
              var n = parseInt(String(c.value), 10)
              if (isNaN(n)) return
              if (n < 3) n = 3
              if (n > 120) n = 120
              countMs = n * 1000
            }
          }
        })
        .catch(function () {})
    } catch (e) {}

    /* ===== الحالة ===== */
    var done = false
    var running = false
    var dtOpen = false
    var deadline = 0
    var armedDurMs = 0
    var lastShown = -1
    var lastSignalHit = 0
    var cleanStreak = 0
    var tickNo = 0

    /* الأتمتة (اختبارات/براوزر روبوت) مستثنية من فخ الـ debugger —
       المتصفح الحقيقي عند الطالب أو المستر مش بيبقى webdriver أبدًا */
    var noAutomation = false
    try { noAutomation = (navigator as any).webdriver === true } catch (e) {}

    /* دالة الـ debugger مولّدة مرة واحدة وتسخّنة برة القياس —
       ليه مولّدة؟ لأن مينفايشن SWC بيشيل جملة debugger الثابتة من
       السورس (drop_debugger) — إثبات ر12: البناء خرج من غير الجملة
       خالص — لكن السترينج 'debugger' بيرجع من المينيفايشن.
       ومختلفة عن ر8 اللي كانت بتنذر كاذب: ر8 كانت بتكومبايل داخل
       القياس كل تيك وكلفة الكومبايلة على موبايل ضعيف بتعدّي العتبة
       — هنا الكومبايلة بتتم مرة واحدة في الإعداد (تسخين) برة القياس
       خالص، فالاستدعاءات بعد كده no-op في نص الميكروثانية */
    var dbgFn: any = null
    try { dbgFn = (function () {} as any).constructor('debugger') } catch (e) {}
    try { if (dbgFn) dbgFn() } catch (e) {}

    /* ===== الإشارة التانية: فخ الكونسول =====
       getter بيتشغل لحظة ما كونسول حقيقي يعرض/يوسّع الـ object —
       بتشيل كروم القديم؛ كروم الحديث بيعرض المطوي من غير تشغيل
       getter (عشان كده الإشارة الأولى debugger هي الأساس) */
    var trapObj: any = {}
    try {
      Object.defineProperty(trapObj, 'id', {
        get: function () { lastSignalHit = Date.now(); return '' },
        configurable: true,
      })
    } catch (e) {}

    /* ===== منع النسخ: تدمير كل الـ iframes والفيديوهات من الصفحة =====
       بيتنفذ لحظة تأكيد فتح أدوات المطوّر وعند الرفض — عشان لينك
       المشغل/اليوتيوب يختفي من الـ DOM قبل ما حد يلحق ينسخه */
    function nukeMedia() {
      try {
        var fr = document.querySelectorAll('iframe')
        for (var i = 0; i < fr.length; i++) {
          var f = fr[i] as HTMLIFrameElement
          try { f.src = 'about:blank' } catch (e) {}
          try { if (f.parentNode) f.parentNode.removeChild(f) } catch (e) {}
        }
        var vd = document.querySelectorAll('video')
        for (var j = 0; j < vd.length; j++) {
          try { (vd[j] as HTMLVideoElement).pause() } catch (e) {}
          try { vd[j].removeAttribute('src') } catch (e) {}
          try { (vd[j] as HTMLVideoElement).load() } catch (e) {}
        }
      } catch (e) {}
    }

    /* ===== آلة الحالة — العدّ على ساعة الحائط ===== */
    function recompute() {
      if (done) return
      if (!dtOpen) {
        if (running) {
          /* المسامحة — أدوات المطوّر اتقفلت قبل الصفر: الشاشة بتروح
             والصفحة بترجع تتمرر عادي (إصلاح بَج الـ overflow) */
          running = false
          deadline = 0
          removeUI()
        }
        return
      }
      if (!running) {
        /* أول ما الأدوات تتأكد مفتوحة: سودة فورية + عدّ كامل من الأول */
        deadline = Date.now() + countMs
        armedDurMs = countMs
        running = true
        nukeMedia() /* منع النسخ: المشغل/اليوتيوب يختفي من الـ DOM فورًا */
        renderMode()
        lastShown = -1
        paintCount()
      }
    }

    /* ===== حلقة التشغيل (500ms) ===== */
    var timer = setInterval(tickBody, 500)

    function tickBody() {
      if (done) return
      tickNo++

      /* ر12 — الإشارة الأولى: فخ توقّف الـ debugger (دالة مسخّنة
         مسبقًا). القياس متزامن حوالين الاستدعاء بس: من غير أدوات
         مفتوحة الاستدعاء no-op فوري (مستحيل يتعدى 100ms حتى أضعف
         جهاز — الكومبايلة حصلت مرة واحدة في الإعداد برة القياس)،
         ومع أدوات مفتوحة التنفيذ بيقف لحد Continue = الفرق ثواني =
         أدوات مفتوحة مؤكد.
         شروط التشغيل: جلسة طالب + مش أتمتة + برة العدّ (أثناء العدّ
         منوقفش الصفحة عشان الطالب يشوف العدّ ويلحق يقفل ويسامح). */
      if (!running && !noAutomation && dbgFn && readStudent()) {
        var t0 = Date.now()
        try { dbgFn() } catch (e) {}
        if (Date.now() - t0 > 100) lastSignalHit = Date.now()
      }

      /* فخ الكونسول — log عادي كل ثانيتين من غير %c عشان الكونسول
         يعرض الـ object ويشغّل الـ getter (من غير أدوات مفتوحة =
         مفيش عرض = مفيش إشارة = مفيش إنذار) */
      if (tickNo % 4 === 0) {
        try { console.log(trapObj) } catch (e) {}
      }

      var signalFresh = (Date.now() - lastSignalHit) < 3000
      if (signalFresh) {
        cleanStreak = 0
        if (!dtOpen) {
          if (readStudent()) { dtOpen = true; recompute() }
        }
      } else if (dtOpen && cleanStreak >= 6) {
        /* الأدوات اتقفلت 3 ثواني نضيفة = مسامحة (طلب المستر الحرفي) */
        dtOpen = false
        recompute()
      } else if (!signalFresh) {
        cleanStreak++
      }

      recompute()

      if (running) {
        paintCount()
        /* لو حد شال العنصر نفسه من الـ DOM بالأدوات — بنرجّعه فورًا */
        if (!document.getElementById('mg-guard-black')) renderMode()
        /* الصفر على ساعة الحائط — تجميد الصفحة ما بينفعش */
        if (Date.now() >= deadline) { punish(); return }
      }
    }

    /* ===== الرسم ===== */
    var numEl: HTMLElement | null = null
    var barEl: HTMLElement | null = null

    function secsLeft(): number {
      var left = Math.ceil((deadline - Date.now()) / 1000)
      if (left < 0) left = 0
      return left
    }

    function paintCount() {
      if (!running || done) return
      var left = secsLeft()
      if (left === lastShown) return
      lastShown = left
      if (numEl) numEl.textContent = String(left)
      if (barEl) {
        var pct = armedDurMs > 0 ? Math.max(0, ((deadline - Date.now()) * 100) / armedDurMs) : 0
        if (pct > 100) pct = 100
        barEl.style.width = pct + '%'
      }
    }

    function removeUI() {
      try {
        var b = document.getElementById('mg-guard-black')
        if (b && b.parentNode) b.parentNode.removeChild(b)
      } catch (e) {}
      numEl = null
      barEl = null
      try {
        /* إصلاح بَج ر8: التمرير بيرجع فورًا مع إزالة الشاشة */
        document.body.style.overflow = ''
      } catch (e) {}
    }

    function baseStyles(): string {
      return 'position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#fff;text-align:center;padding:24px'
    }

    function renderMode() {
      if (done) return
      removeUI()
      var secs = Math.max(1, Math.round(countMs / 1000))
      var o = document.createElement('div')
      o.id = 'mg-guard-black'
      o.setAttribute('role', 'alert')
      o.setAttribute('aria-live', 'assertive')
      o.style.cssText = baseStyles()
      o.innerHTML =
        '<div style="max-width:560px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
        '<div style="font-size:60px;line-height:1">🛡️</div>' +
        '<div style="font-size:24px;font-weight:900;letter-spacing:.5px">أدوات المطوّر ممنوعة على المنصة</div>' +
        '<div style="font-size:15px;color:#d4d4d8;line-height:1.9">عندك <b style="color:#fbbf24">' + secs + ' ثواني</b> بس — اقفل أدوات المطوّر فورًا<br/>' +
        '<b style="color:#f87171">إلا هتخرج من المنصة وحسابك هيترفض نهائيًا</b> ومش هتقدر تدخل تاني</div>' +
        '<div id="mg-num" style="font-size:92px;font-weight:900;color:#f87171;font-variant-numeric:tabular-nums;line-height:1">' + secs + '</div>' +
        '<div style="width:100%;max-width:340px;height:8px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden">' +
        '<div id="mg-bar" style="height:100%;width:100%;background:#f87171;border-radius:99px;transition:width .5s linear"></div>' +
        '</div>' +
        '<div style="font-size:12px;color:#71717a">المنصة بتحمي مجهود المستر وحق الطلاب اللي دفعوا</div>' +
        '</div>'
      document.body.appendChild(o)
      try { document.body.style.overflow = 'hidden' } catch (e) {}
      numEl = o.querySelector('#mg-num')
      barEl = o.querySelector('#mg-bar')
    }

    function renderFinal(kind: 'rejected' | 'locked') {
      done = true
      running = false
      removeUI()
      try { document.body.style.overflow = 'hidden' } catch (e) {}
      var o = document.getElementById('mg-guard-final') as HTMLElement | null
      if (!o) {
        o = document.createElement('div')
        o.id = 'mg-guard-final'
        o.setAttribute('role', 'alert')
        o.style.cssText = baseStyles()
        document.body.appendChild(o)
      }
      o.innerHTML =
        '<div style="max-width:560px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
        '<div style="font-size:64px;line-height:1">' + (kind === 'rejected' ? '🚫' : '🛡️') + '</div>' +
        (kind === 'rejected'
          ? '<div style="font-size:28px;font-weight:900">حسابك مرفوض من المنصة</div>' +
            '<div style="font-size:14px;color:#d4d4d8;line-height:1.9">اتقفل كل حاجة — مش هتقدر تدخل على المنصة تاني<br/>إلا لما المستر يعيد تفعيل حسابك من صفحة الأدمن.<br/><b style="color:#fbbf24">لو ده حصل بالغلط — كلم المستر وهو هيرجّعك.</b></div>'
          : '<div style="font-size:26px;font-weight:900">اتقفل الدخول للمنصة</div>' +
            '<div style="font-size:14px;color:#d4d4d8;line-height:1.9">أدوات المطوّر ممنوعة تمامًا على المنصة.</div>') +
        '</div>'
    }

    /* ===== العقوبة: الرفض النهائي (مش مسح — المستر يرجّعه من الأدمن) ===== */
    function punish() {
      if (done) return
      done = true
      running = false
      nukeMedia()
      removeUI()
      try { clearInterval(timer) } catch (e) {}
      var st = readStudent()
      if (st && st.id) {
        try { sessionStorage.setItem(LOCK_KEY, 'rejected') } catch (e) {}
        renderFinal('rejected')
        var payload: any = {
          studentId: st.id,
          reason: 'devtools',
        }
        try {
          payload.deviceId = getDeviceId()
          payload.candidates = getDeviceCandidates()
        } catch (e) {}
        try {
          fetch('/api/security/reject-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(function () {})
        } catch (e) {}
        setTimeout(function () {
          try { clearSessions() } catch (e) {}
          try { location.replace('/') } catch (e) {}
        }, 900)
      } else {
        try { sessionStorage.setItem(LOCK_KEY, '1') } catch (e) {}
        clearSessions()
        renderFinal('locked')
      }
    }

    function clearSessions() {
      try {
        var kill: string[] = []
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || ''
          if (k === 'ln' || /student|parent/i.test(k)) kill.push(k)
        }
        for (var j = 0; j < kill.length; j++) localStorage.removeItem(kill[j])
      } catch (e) {}
    }

    /* بداية نظيفة — مفيش أي listeners خارجية: الإشارتين فخ الـ debugger
       الثابت وفخ الكونسول — الاتنين من غير أي events على الصفحة */
    return function cleanup() {
      try { clearInterval(timer) } catch (e) {}
    }
  }, [])
  return null
}
