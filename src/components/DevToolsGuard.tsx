'use client'

// ============================================================
// DevToolsGuard — ر15 بطلب المستر الحرفي:
// «أول حاجة أنا لما بفتح أدوات المطورين عشان أشغل الفيديو بيجيلي
//  الصورة بتاعت الشاشة السوداء والعادي دي وبعدين بتروح كلها بتتغير
//  فبيجيلي كده وكده مبيبقاش فيه وأقدر أخد اللينك بكل سهولة،
//  بعد أما بخرج أخرج خالص لقيت العداد بيشتغل ويعمل فيديو،
//  طب ما أنا خلاص أكون خدت الحاجة، هو إيه الهبل ده؟»
// ============================================================
// تشخيص ر15 الجذري (الدليل: سكرين شوت المستر — فيديو ظاهر + Paused
// in debugger + مفيش شاشة سودة = الحارس صامت والأدوات مفتوحة):
//   • علة 1 — ثغرة «الأدوات مفتوحة قبل التحميل»: خط أساس الفجوة
//     بيتلقط لحظة التحميل، لو الأدوات مفتوحة من قبلها الفجوة بتمتص
//     في الأساس → gapNow() بيرجع صفر للأبد → الحارس صامت خالص
//     → الطالب يفتح الصفحة والأدوات مفتوحة وياخد اللينك بكل سهولة.
//   • علة 2 — «كلها بتتغير»: العدّاد لما يخلص والأدوات لسه مفتوحة
//     كان بينفّذ عقوبة (مسح جلسة + redirect للرئيسية / رفض نهائي)
//     → الشاشة تروح والصفحة تتغير وهو مفتوح → ويترجع ياخد اللينك.
//   • علة 3 — «العداد بيشتغل بعد أما بخرج»: كل الآليات كانت مربوطة
//     بمهلة زمنية على ساعة الحائط، والقفل قبل/حول لحظة الصفر كان
//     بيسيب العدّ أو العقوبة تشتغل بعد الخروج = هبل بالحرف.
//
// قرار ر15 — الحارس بقى **بوابة نضيفة** مربوطة بحالة الأدوات 1:1:
//
//   أدوات مفتوحة  → شاشة سودة فورية (<100ms) وتفضل واقفة طول ما
//                   هي مفتوحة — مفيش أي حاجة بتشيلها وهو مفتوح:
//                   مفيش redirect، مفيش مسح جلسة، مفيش رفض حساب،
//                   مفيش أي عقوبة خالص. الفيديو واقف والتمرير مقفول
//                   والطالب مش شايف أي حاجة يقدر ياخد منها لينك.
//   أدوات مقفولة  → **كل حاجة تتصلح فورًا**: الشاشة تروح، العدّ
//                   يقف ويتمسح، التمرير يرجع، الفيديو يكمّل من مكانه
//                   — ومفيش أي حاجة بتشتغل بعد القفل خالص (علة 3
//                   اتحلت بالجذر: مفيش deadline أصلاً بيحصل بعده حاجة).
//
//   العدّاد اللي على الشاشة بقى استعراضي بس (ضغط نفسي عشان يقفل
//   فورًا): يخلص → الشاشة تفضل واقفة برسالة ثابتة «المنصة واقفة
//   لحد ما تقفل أدوات المطوّر» — من غير أي تنفيذ بعد الصفر.
//
//   مصادر كشف الفتح (كلها من غير أي تجميد في مسار الفتح العادي):
//     1) فجوة النافذة outer-inner فوق خط أساس بيتحدّث بأقل قيمة
//        (الزووم من أول لحظة بيمتص في الأساس — درس ر10) + حدث
//        resize لحظي في الاتجاهين — docked يمين/شمال/تحت + responsive
//        زي سكرين شوت المستر بالحرف. الطولية على الديسكتوب الصافي
//        فقط عشان كيبورد الموبايل ما ينذرش كاذب.
//     2) **فحص التحميل الجديد** (علة 1): لو الفجوة كبيرة من أول
//        لحظة (أدوات مفتوحة قبل التحميل أو زووم) → فحص توقّف
//        الـ debugger مرتين متتاليتين وقت التحميل نفسه: توقّفان =
//        أدوات مفتوحة مؤكد → شاشة فورية. مفيش توقّف = زووم →
//        يفضل صامت تمامًا زي ر10 (صفر إنذار كاذب).
//     3) فخ توقّف الـ debugger للـ undocked (مفيش فجوة): توقّفان
//        متتاليان = مفتوحة مؤكد (المستر داس Continue وهو فاتح) —
//        وقفل وهو متجمّد: الرجوع بتيك سريع → صفر شاشة بعد القفل
//        خالص (نفس علة المستر الحرفية اتعالجت برضو).
//        أثناء التسليح غير الفجوي: تيك زوجي بيفحص — توقّف طويل =
//        لسه مفتوحة، تيك سريع بعد توقّف = قفلت → مسامحة ≤1 ثانية.
//     4) احتياطي الكونسول getter لو فخ الـ debugger تعذّر إنشاؤه
//        (CSP) بنفس منطق ر13 — ومن غير أي log لما الفخ موجود.
//
//   شروط ثابتة من ر10/ر12/ر13/ر14: الحارس لجلسات الطلاب بس،
//   الأدمن مستثنى، الأتمتة (webdriver) مستثنية من فخ التوقّف،
//   المهلة من إعداد الأدمن guard_countdown_seconds (افتراضي 8 —
//   يقبل 3..120)، صفر إنذارات كاذب من زووم/كيبورد/تهنيج.
//   وتبعًا لقرار ر15: مفيش أي كتابة على /api/security/reject-account
//   ولا أي مسح جلسات — البوابة نفسها هي الحماية (وهو مفتوح مش
//   شايف حاجة، وهو مقفول كل حاجة رجعت زي ما كانت).
// ============================================================
import { useEffect } from 'react'
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

    /* تاب متقفل نهائي من نسخ قديمة (الرفض حصل قبل ر15 في نفس التاب) —
       بنحترمه عشان قرار قديم ما يتراجعش بنفس التاب */
    try {
      var lockedVal = sessionStorage.getItem(LOCK_KEY) || ''
      if (lockedVal === 'rejected') { renderFinal('rejected'); return }
      if (lockedVal === '1') { renderFinal('locked'); return }
    } catch (e) {}

    /* ===== الإعداد: مهلة العدّ الاستعراضي من لوحة الأدمن (افتراضي 8) ===== */
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
    var running = false        /* الشاشة السودة واقفة (الأدوات مفتوحة) */
    var gapArmed = false       /* التسليح جاي من فجوة النافذة — القفل بيتحس من resize لحظيًا */
    var stalled = false        /* العدّ الاستعراضي خلص — الشاشة تفضل واقفة لحد القفل */
    var pendingPause = false   /* توقّف من غير فجوة (undocked غامض) — بنستنى التوقّف التاني */
    var pendingRun = false     /* أثناء التسليح غير الفجوي: توقّف طويل — بنستنى تيك سريع يثبت القفل */
    var cleanStreak = 0        /* احتياطي الكونسول (!dbgFn) — نفس منطق ر13 */
    var deadline = 0
    var armedDurMs = 0
    var lastShown = -1
    var lastSignalHit = 0
    var tickNo = 0

    /* الأتمتة (اختبارات/براوزر روبوت) مستثنية من فخ الـ debugger —
       المتصفح الحقيقي عند الطالب أو المستر مش بيبقى webdriver أبدًا */
    var noAutomation = false
    try { noAutomation = (navigator as any).webdriver === true } catch (e) {}

    /* ===== خط أساس الفجوة (ضد الزووم — درس ر10) =====
       بيتلقط لحظة التشغيل وبيتحدّث بأقل قيمة شوفناها: الزووم من أول
       لحظة بيمتص في الأساس (صفر إنذار)، والفجوة اللي بتظهر **فوق**
       الأساس أثناء الجلسة هي اللي بتدل على أدوات اتفتحت لحظتها. */
    var baselineW = 0
    var baselineH = 0
    try {
      baselineW = Math.max(0, (window.outerWidth || 0) - (window.innerWidth || 0))
      baselineH = Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0))
    } catch (e) {}

    function desktopFine(): boolean {
      try {
        if ((navigator as any).maxTouchPoints > 0) return false
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false
      } catch (e) { return false }
      return true
    }

    function updateBaselines() {
      try {
        var gw = Math.max(0, (window.outerWidth || 0) - (window.innerWidth || 0))
        var gh = Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0))
        if (gw < baselineW) baselineW = gw
        if (gh < baselineH) baselineH = gh
      } catch (e) {}
    }

    /* ===== كاشف الفجوة: '' = مقفولة / 'w' عرضية / 'h' طولية ===== */
    function gapNow(): string {
      try {
        var iw = window.innerWidth || 0
        var ih = window.innerHeight || 0
        /* نوافذ مقلوبة/مصغرة لحظيًا (minimize/restore) — تجاهل */
        if (iw < 200 || ih < 200) return ''
        var gw = (window.outerWidth || 0) - iw - baselineW
        var gh = (window.outerHeight || 0) - ih - baselineH
        if (gw > 160) return 'w'
        if (gh > 160 && desktopFine()) return 'h'
      } catch (e) {}
      return ''
    }

    /* دالة الـ debugger مولّدة مرة واحدة وتسخّنة برة القياس —
       ليه مولّدة؟ لأن مينفايشن SWC بيشيل جملة debugger الثابتة من
       السورس (drop_debugger) — إثبات ر12 — لكن السترينج بيرجع.
       من غير أدوات مفتوحة الاستدعاء no-op في نص الميكروثانية،
       ومع أدوات مفتوحة التنفيذ بيقف لحد Continue = الفرق ثواني. */
    var dbgFn: any = null
    try { dbgFn = (function () {} as any).constructor('debugger') } catch (e) {}

    /* ===== الاحتياطي: فخ الكونسول (لو فخ الـ debugger مش متاح فقط) =====
       getter بيتشغل لحظة ما كونسول حقيقي يعرض/يوسّع الـ object —
       مبيتعملش له log خالص لما الفخ الأساسي موجود (الكونسول نضيف) */
    var trapObj: any = {}
    try {
      Object.defineProperty(trapObj, 'id', {
        get: function () { lastSignalHit = Date.now(); return '' },
        configurable: true,
      })
    } catch (e) {}

    /* ===== الوسائط: إيقاف مؤقت عند الفتح + رجوع فوري عند القفل =====
       مفيش أي تدمير خالص في ر15 — البوابة بتوقف العرض مؤقتًا بس،
       والقفل بيرجّع كل حاجة من مكانها بالظبط. */
    var pausedVideos: Array<{ el: HTMLVideoElement; was: boolean }> = []
    var pausedFrames: HTMLIFrameElement[] = []

    function pauseMedia() {
      pausedVideos = []
      pausedFrames = []
      try {
        /* الشاشة السودة في الـ top layer مش بتفوق الفيديو الفول سكرين
           — لازم نخرج من الفول سكرين الأول */
        try {
          if ((document as any).fullscreenElement) (document as any).exitFullscreen().catch(function () {})
        } catch (e) {}
        try {
          if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen()
        } catch (e) {}
        var vd = document.querySelectorAll('video')
        for (var i = 0; i < vd.length; i++) {
          var v = vd[i] as HTMLVideoElement
          var was = false
          try { was = !v.paused && !v.ended } catch (e) {}
          try { v.pause() } catch (e) {}
          pausedVideos.push({ el: v, was: was })
        }
        var fr = document.querySelectorAll('iframe')
        for (var j = 0; j < fr.length; j++) {
          var f = fr[j] as HTMLIFrameElement
          pausedFrames.push(f)
          try {
            /* YouTube IFrame API — إيقاف الصوت ورا الشاشة السودة */
            if (f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*')
          } catch (e) {}
        }
      } catch (e) {}
    }

    function resumeMedia() {
      try {
        for (var i = 0; i < pausedVideos.length; i++) {
          var m = pausedVideos[i]
          if (m.was) { try { var p = m.el.play(); if (p && p.catch) p.catch(function () {}) } catch (e) {} }
        }
        /* ملاحظة: الـ iframes مش بنبعث لهم playVideo عمدًا — عشان ما
           نشغلش درس الطالب ما كان مقفولوش أصلًا. يوتيوب بيفضل واقف
           في مكانه والطالب يدوس شغّال عادي بعد القفل. */
      } catch (e) {}
      pausedVideos = []
      pausedFrames = []
    }

    /* ===== فخ التوقّف: بيرجّع الفرق بالمللي ثانية ===== */
    function probeDelta(): number {
      var t0 = Date.now()
      try { if (dbgFn) dbgFn() } catch (e) {}
      return Date.now() - t0
    }

    /* ===== تسليح: شاشة فورية — من غير أي عقوبة ومرتبطة بالقفل بس ===== */
    function arm(fromGap: boolean) {
      if (done) return
      if (running) return
      if (!readStudent()) return
      running = true
      gapArmed = fromGap
      deadline = Date.now() + countMs
      armedDurMs = countMs
      stalled = false
      lastShown = -1
      pendingPause = false
      pendingRun = false
      cleanStreak = 0
      pauseMedia()
      renderMode(false)
      paintCount()
    }

    /* ===== الإصلاح الفوري عند القفل: الشاشة تروح والعدّ يتمسح
       والتمرير يرجع والفيديو يكمّل — ومفيش أي حاجة بعد كده خالص ===== */
    function forgive() {
      running = false
      gapArmed = false
      stalled = false
      pendingPause = false
      pendingRun = false
      cleanStreak = 0
      deadline = 0
      lastShown = -1
      removeUI()
      resumeMedia()
    }

    /* ===== الحلقة (500ms) ===== */
    var timer = setInterval(tickBody, 500)

    function tickBody() {
      if (done) return
      tickNo++
      updateBaselines()

      var isStudent = !!readStudent()
      var gap = gapNow()

      if (!running) {
        /* 1) الفوري: فجوة فوق الأساس = أدوات مفتوحة الآن */
        if (gap) {
          arm(true)
        } else if (!noAutomation && dbgFn && isStudent) {
          /* 2) كاشف الحالة الحي — للـ undocked والأدوات المفتوحة قبل
             التحميل (الفجوة بتاعتهم ممتصة في الأساس):
             توقّف + فجوة لحظة الرجوع = docked مفتوحة → شاشة فورية
             توقّف + مفيش فجوة → undocked غامض (Continue عادي أو قفل)
               → توقّفان متتاليان = مفتوحة مؤكد → شاشة فورية
               → تيك سريع بعد التوقّف = قفل بعد التجميد → صفر شاشة */
          var d1 = probeDelta()
          if (d1 > 100) {
            lastSignalHit = Date.now()
            if (gapNow()) arm(true)
            else if (pendingPause) { pendingPause = false; arm(false) }
            else pendingPause = true
          } else if (pendingPause) {
            /* الرجوع ده بعد قفل الأدوات وهو متجمّد — المستر الحرفي:
               «أول ما أخرج يتصلح» — صفر شاشة بعد القفل خالص */
            pendingPause = false
          }
        } else if (!dbgFn && isStudent) {
          /* 3) احتياطي الكونسول — نفس منطق ر13 حرفيًا */
          if (tickNo % 4 === 0) { try { console.log(trapObj) } catch (e) {} }
          if ((Date.now() - lastSignalHit) < 3000) {
            cleanStreak = 0
            arm(false)
          }
        }
      }

      if (running) {
        /* جلسة الطالب اختفت (خروج من تاب تاني مثلًا) → مفيش حاجة نحميها
           → إصلاح فوري من غير أي شاشة */
        if (!isStudent) forgive()

        /* العدّ الاستعراضي خلص والأدوات لسه مفتوحة → الشاشة تفضل واقفة
           برسالة ثابتة — مفيش أي تنفيذ بعد الصفر خالص (علة «الهبل») */
        if (running && !stalled && Date.now() >= deadline) {
          stalled = true
          renderMode(true)
        }

        paintCount()
        /* لو حد شال العنصر نفسه من الـ DOM بالأدوات — بنرجّعه فورًا */
        if (!document.getElementById('mg-guard-black')) renderMode(stalled)

        if (gapArmed) {
          /* شبكة أمان الفجوة: التسليح من الفجوة والفجوة راحت من غير
             resize = الأدوات قفلت → إصلاح فوري */
          if (!gapNow()) forgive()
        } else if (!noAutomation && dbgFn && isStudent && tickNo % 2 === 0) {
          /* القفل undocked أثناء التسليح: تيك زوجي = فحص توقّف —
             توقّف طويل = لسه مفتوحة، تيك سريع بعد توقّف = قفلت
             → إصلاح فوري ≤1 ثانية */
          var d2 = probeDelta()
          if (d2 > 100) { pendingRun = true; lastSignalHit = Date.now() }
          else if (pendingRun) { pendingRun = false; forgive() }
        } else if (!dbgFn) {
          /* احتياطي الكونسول وأثناء التسليح — نفس منطق ر13 */
          if ((Date.now() - lastSignalHit) < 3000) cleanStreak = 0
          else if (cleanStreak >= 6) forgive()
          else cleanStreak++
        }
      }
    }

    /* ===== الحالة الفورية لحظة الفتح/القفل (resize) =====
       ده مصدر «أول ما أفتحها وأول ما أخرج يتصلح» بالحرف —
       بيتنادى لحظة docking/undocking/responsive لحظيًا */
    function onResize() {
      if (done) return
      var preW = baselineW
      var preH = baselineH
      var curW = 0
      var curH = 0
      try {
        curW = Math.max(0, (window.outerWidth || 0) - (window.innerWidth || 0))
        curH = Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0))
      } catch (e) {}
      updateBaselines()
      var g = gapNow()
      if (g) {
        if (!running) arm(true)
      } else if (running && gapArmed) {
        forgive()
      } else if (running) {
        /* تسليح من الفخ (أدوات مفتوحة قبل التحميل — الفجوة كانت ممتصة
           في الأساس) والفجوة الحالية نزلت كتير تحت الأساس اللي شفناه
           قبل كده = الأدوات قفلت → إصلاح فوري بدل انتظار فحص التيك */
        try {
          if ((preW > 100 && curW < preW - 50) || (preH > 100 && curH < preH - 50)) forgive()
        } catch (e) {}
      }
    }
    try { window.addEventListener('resize', onResize) } catch (e) {}

    /* ===== فحص التحميل الجديد (علة سكرين شوت المستر) =====
       الأدوات المفتوحة **قبل** تحميل الصفحة كانت بتمتص في خط الأساس
       والحارس بيفضل صامت خالص والطالب ياخد اللينك بسهولة.
       الحل: لو الفجوة كبيرة من أول لحظة (يا أدوات مفتوحة يا زووم)
       → فحص توقّف مرتين متتاليتين وقت التحميل: توقّفان = أدوات
       مفتوحة مؤكد → شاشة فورية. مفيش توقّف = زووم → صمت تمام
       زي ر10. ولو قفل بدل ما يدوس Continue → الرجوع تيك سريع
       → صفر شاشة بعد القفل خالص. */
    if (!noAutomation && dbgFn && readStudent()) {
      setTimeout(function () {
        if (done || running) return
        var d0 = probeDelta()
        if (d0 <= 100) return /* زووم/عادي — صمت تمام */
        lastSignalHit = Date.now()
        /* لسه مفتوحة وقت الرجوع؟ فحص تاني فوري — لو مفتوحة هيتوقّف تاني */
        var d0b = probeDelta()
        if (d0b > 100) {
          lastSignalHit = Date.now()
          arm(false)
        } else if (gapNow()) {
          arm(true)
        }
        /* غير كده: قفل بدل ما يدوس Continue — صفر شاشة */
      }, 350)
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
      if (!running || done || stalled) return
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
        /* التمرير بيرجع فورًا مع إزالة الشاشة — «أول ما أخرج يتصلح» */
        document.body.style.overflow = ''
      } catch (e) {}
    }

    function baseStyles(): string {
      return 'position:fixed;inset:0;z-index:2147483647;background:#000;display:flex;align-items:center;justify-content:center;direction:rtl;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#fff;text-align:center;padding:24px'
    }

    function renderMode(stalledMode: boolean) {
      if (done) return
      removeUI()
      var o = document.createElement('div')
      o.id = 'mg-guard-black'
      o.setAttribute('role', 'alert')
      o.setAttribute('aria-live', 'assertive')
      o.style.cssText = baseStyles()
      if (stalledMode) {
        /* العدّ خلص والأدوات لسه مفتوحة — الشاشة تفضل واقفة لحد القفل
           من غير أي عقوبة ولا redirect ولا مسح جلسة */
        o.innerHTML =
          '<div style="max-width:560px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
          '<div style="font-size:60px;line-height:1">🛡️</div>' +
          '<div style="font-size:24px;font-weight:900;letter-spacing:.5px">المنصة واقفة لحد ما تقفل أدوات المطوّر</div>' +
          '<div style="font-size:15px;color:#d4d4d8;line-height:1.9">اقفل أدوات المطوّر من علامة <b style="color:#fbbf24">×</b> أو زرار <b style="color:#fbbf24">F12</b><br/>وأول ما تقفلها هترجع للمنصة عادي وتكمل من مكانك <b style="color:#4ade80">فورًا</b></div>' +
          '<div style="font-size:12px;color:#71717a">المنصة بتحمي مجهود المستر وحق الطلاب اللي دفعوا</div>' +
          '</div>'
      } else {
        var secs = Math.max(1, Math.round(countMs / 1000))
        o.innerHTML =
          '<div style="max-width:560px;display:flex;flex-direction:column;align-items:center;gap:16px">' +
          '<div style="font-size:60px;line-height:1">🛡️</div>' +
          '<div style="font-size:24px;font-weight:900;letter-spacing:.5px">أدوات المطوّر ممنوعة على المنصة</div>' +
          '<div style="font-size:15px;color:#d4d4d8;line-height:1.9">اقفل أدوات المطوّر <b style="color:#fbbf24">دلوقتي</b> عشان تكمل عادي<br/>وأول ما تقفلها كل حاجة هترجع <b style="color:#4ade80">فورًا</b></div>' +
          '<div id="mg-num" style="font-size:92px;font-weight:900;color:#f87171;font-variant-numeric:tabular-nums;line-height:1">' + secs + '</div>' +
          '<div style="width:100%;max-width:340px;height:8px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden">' +
          '<div id="mg-bar" style="height:100%;width:100%;background:#f87171;border-radius:99px;transition:width .5s linear"></div>' +
          '</div>' +
          '<div style="font-size:12px;color:#71717a">المنصة بتحمي مجهود المستر وحق الطلاب اللي دفعوا</div>' +
          '</div>'
      }
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

    /* بداية نظيفة */
    return function cleanup() {
      try { window.removeEventListener('resize', onResize) } catch (e) {}
      try { clearInterval(timer) } catch (e) {}
    }
  }, [])
  return null
}
