'use client'

// ============================================================
// DevToolsGuard — ر13 بطلب المستر الحرفي:
// «يا ابني حرام عليك يا ابني مش شغالة برضه، ما فيش حاجة شغالة،
//  بتشتغل أول ما بقفل الـ يعني بكون أنا خلصت الـ
//  أنا عاوز أول ما أفتحها وأول ما أخرج يتصلح»
// ============================================================
// تشخيص ر13 (علة ر12 الحقيقية — دليل حي من سكرين شوت المستر التاني:
// «Paused in debugger» ظاهر على maths-genius.com يعني فخ ر12 واصل
// لايف فعلًا — بس السلسلة كانت مربوطة بلحظة «خروج التوقّف» مش
// بحالة الأدوات نفسها):
//   • المستر يفتح الأدوات → أول تيك بيوقف الصفحة فورًا (الانسبكت
//     بيجي في نص ثانية ✓) — لكن أثناء التوقّف مفيش أي JS بيشتغل.
//   • العدّ كان بينطلق من نفس التيك اللي التوقّف خلص فيه —
//     والتوقّف عمليًا بيخلص لحظة قفل الأدوات (كروم بيكمل التنفيذ
//     لوحده أول ما الأدوات تتقفل والصفحة متجمدة) → الشاشة السودة
//     والعدّاد كانوا بيظهروا **بعد القفل** بالحرف: «بتشتغل أول ما
//     بقفل الـ يعني بكون أنا خلصت» ✗ — وبعدها المسامحة كانت محتاجة
//     الإشارة تطفي 3 ثواني + 6 تيكات نضيفة = الشاشة بتفضل معلقة
//     من 6 لـ 9 ثواني بعد القفل.
//   • والأدهى: أثناء العدّ فخ الـ debugger كان بيتقفل خالص
//     (شرط !running) فمفيش أي طريقة نحس بالقفل غير انتظار نفس
//     النافذة الطويلة دي.
//
// قرار ر13 — الحالة كلها مربوطة بحالة الأدوات لحظة بلحظة:
//   1) فخ الـ debugger بيتنادى **كل تيك (500ms) وفي كل الحالات حتى
//      أثناء العدّ** — الأدوات مفتوحة = التنفيذ بيقف (مفتوح مؤكد
//      100%)، مقفولة = no-op في نص ميكروثانية (مقفول مؤكد 100%).
//      ده بقى هو كاشف الحالة الحي نفسه.
//   2) «أول ما أفتحها» ✓ — الانسبكت الفوري: التوقّف الأول خلال نص
//      ثانية من فتح الأدوات (وده بالظبط الـ انسبكت اللي المستر عايزه).
//   3) أول توقّف = تدمير فوري لكل الـ iframes/الفيديوهات (منع نسخ
//      اللينك من الـ DOM — أثناء التجميد نفسه ممكن حد يتصفح الـ DOM).
//   4) السودة والعدّاد بيطلعوا **فقط** لما يكون الأدوات لسه مفتوحة
//      فعلًا: توقّفان متتاليان (يعني عمل Continue وقاوم التجميد وهو
//      مفتوح) — لكن لو قفل وهو متجمّد، التيك اللي بعد القفل بيرجع
//      فوري من غير أي توقّف = مفيش سودة خالص بعد القفل.
//   5) «أول ما أخرج يتصلح» ✓ — تيكين نضيفين (~1 ثانية) بعد القفل =
//      الشاشة بتروح والتمرير بيرجع فورًا (إصلاح overflow) من غير أي
//      عقوبة — بدل 6-9 ثواني في ر12.
//   6) أثناء العدّ مع أدوات مفتوحة الصفحة بتفضل بتتجمّد كل نص ثانية
//      (العقوبة شغالة فعلًا وهو فاتح) — والصفر على ساعة الحائط
//      زي ما هو: قفل قبل الصفر = مسامحة فورية، الصفر = رفض نهائي.
//   • احتياطي: لو فخ الـ debugger تعذّر إنشاؤه (CSP مثلًا) — إشارة
//     الكونسول getter (ر10/ر12) بتفضل شغالة بنفس منطقها القديم،
//     ومبيتعملش لها log خالص لما الفخ الأساسي موجود عشان الكونسول
//     يفضل نضيف (المستر كان شايف Object مطوية من ر10/ر12).
//   • كل قرار ر10/ر12 سليم وثابت: العدّ في حالة واحدة بس (أدوات
//     مفتوحة فعلًا)، صفر إنذارات كاذبة من أي حاجة تانية، الأدمن
//     مستثنى، الأتمتة (navigator.webdriver) مستثنية، المهلة من
//     إعداد الأدمن guard_countdown_seconds (افتراضي 8 — يقبل 3..120).
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
    var pauseSeen = false    /* التيك اللي فات كان فيه توقّف حقيقي (أدوات كانت مفتوحة) */
    var cleanTicks = 0       /* تيكات نضيفة متتالية بدون أي توقّف = دليل قفل الأدوات */
    var cleanStreak = 0      /* احتياطي (!dbgFn بس) — نفس منطق ر12 */
    var deadline = 0
    var armedDurMs = 0
    var lastShown = -1
    var lastSignalHit = 0
    var tickNo = 0

    /* الأتمتة (اختبارات/براوزر روبوت) مستثنية من فخ الـ debugger —
       المتصفح الحقيقي عند الطالب أو المستر مش بيبقى webdriver أبدًا */
    var noAutomation = false
    try { noAutomation = (navigator as any).webdriver === true } catch (e) {}

    /* دالة الـ debugger مولّدة مرة واحدة وتسخّنة برة القياس —
       ليه مولّدة؟ لأن مينفايشن SWC بيشيل جملة debugger الثابتة من
       السورس (drop_debugger) — إثبات ر12: البناء خرج من غير الجملة
       خالص — لكن السترينج 'debugger' بيرجع من المينيفايشن.
       والكومبايلة مرة واحدة في الإعداد (تسخين) برة القياس خالص،
       فالاستدعاءات بعد كده no-op في نص الميكروثانية من غير أدوات */
    var dbgFn: any = null
    try { dbgFn = (function () {} as any).constructor('debugger') } catch (e) {}
    try { if (dbgFn) dbgFn() } catch (e) {}

    /* ===== الاحتياطي: فخ الكونسول (لو فخ الـ debugger مش متاح فقط) =====
       getter بيتشغل لحظة ما كونسول حقيقي يعرض/يوسّع الـ object —
       مبيتعملش له log خالص لما الفخ الأساسي موجود (ر13: الكونسول
       يفضل نضيف — المستر كان شايف Object مطوية من ر10/ر12) */
    var trapObj: any = {}
    try {
      Object.defineProperty(trapObj, 'id', {
        get: function () { lastSignalHit = Date.now(); return '' },
        configurable: true,
      })
    } catch (e) {}

    /* ===== منع النسخ: تدمير كل الـ iframes والفيديوهات من الصفحة =====
       بيتنفذ لحظة أول توقّف حقيقي (الأدوات مفتوحة مؤكد) وعند الرفض —
       عشان لينك المشغل/اليوتيوب يختفي من الـ DOM قبل ما حد يلحق ينسخه */
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

    /* ===== تسليح: سودة فورية + عدّ كامل من الأول ===== */
    function arm() {
      if (done) return
      deadline = Date.now() + countMs
      armedDurMs = countMs
      running = true
      lastShown = -1
      renderMode()
      paintCount()
    }

    /* ===== المسامحة الفورية (ر13): الشاشة بتروح والتمرير بيرجع ===== */
    function forgive() {
      running = false
      deadline = 0
      cleanTicks = 0
      removeUI()
    }

    /* ===== حلقة التشغيل (500ms) — الكاشف الحي للحالة ===== */
    var timer = setInterval(tickBody, 500)

    function tickBody() {
      if (done) return
      tickNo++

      /* ر13 — الإشارة الأولى: فخ توقّف الـ debugger (دالة مسخّنة
         مسبقًا) بيتنادى كل تيك وفي كل الحالات حتى أثناء العدّ:
         من غير أدوات مفتوحة الاستدعاء no-op فوري (مستحيل يتعدى 100ms
         حتى أضعف جهاز — الكومبايلة حصلت مرة واحدة في الإعداد برة
         القياس)، ومع أدوات مفتوحة التنفيذ بيقف لحد Continue =
         الفرق ثواني = أدوات مفتوحة مؤكد.
         شروط التشغيل: جلسة طالب + مش أتمتة. */
      var pausedNow = false
      if (!noAutomation && dbgFn && readStudent()) {
        var t0 = Date.now()
        try { dbgFn() } catch (e) {}
        if (Date.now() - t0 > 100) {
          pausedNow = true
          lastSignalHit = Date.now()
        }
      }

      /* فخ الكونسول — احتياطي فقط لما فخ الـ debugger مش متاح أصلًا
         (كل 2 ثواني من غير %c عشان الكونسول يعرض الـ object ويشغّل
         الـ getter — من غير أدوات مفتوحة = مفيش عرض = مفيش إشارة) */
      if (!dbgFn && tickNo % 4 === 0) {
        try { console.log(trapObj) } catch (e) {}
      }

      if (pausedNow) {
        /* أدوات مفتوحة مؤكد — التوقّف حصل فعليًا */
        cleanTicks = 0
        nukeMedia() /* منع النسخ: المشغل/اليوتيوب يختفي من الـ DOM فورًا */
        if (!running) {
          if (pauseSeen) {
            /* توقّفان متتاليان = الأدوات لسه مفتوحة والطالب قاوم
               التجميد بـ Continue → سودة فورية + عدّ كامل.
               لو كان قفل الأدوات وهو متجمّد، التيك ده كان بيرجع
               فوري من غير توقّف فمكانش وصلنا هنا أصلًا. */
            arm()
          }
          pauseSeen = true
        }
      } else {
        /* تيك نضيف بدون أي توقّف = الأدوات مقفولة (أو مش مفتوحة أصلًا) */
        pauseSeen = false
        if (running) {
          cleanTicks++
          /* ر13 — «أول ما أخرج يتصلح»: تيكين نضيفين (~1 ثانية) بعد
             القفل = مسامحة فورية بدل 6-9 ثواني في ر12 */
          if (cleanTicks >= 2) forgive()
        }
      }

      /* الاحتياطي — نفس منطق ر12 حرفيًا لما فخ الـ debugger مش متاح:
         إشارة كونسول خلال 3 ثواني = مفتوحة، 6 تيكات نضيفة = مسامحة */
      if (!dbgFn) {
        var signalFresh = (Date.now() - lastSignalHit) < 3000
        if (signalFresh) {
          cleanStreak = 0
          if (!running && readStudent()) arm()
        } else if (running && cleanStreak >= 6) {
          forgive()
        } else {
          cleanStreak++
        }
      }

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

    /* بداية نظيفة — مفيش أي listeners خارجية: الفخ من غير أي events
       على الصفحة — فخ الـ debugger كل تيك هو الكاشف الحي نفسه */
    return function cleanup() {
      try { clearInterval(timer) } catch (e) {}
    }
  }, [])
  return null
}
