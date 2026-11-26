'use client'

// ============================================================
// DevToolsGuard — ر14 بطلب المستر الحرفي:
// «يا ابني حرام عليك يا ابني مش شغالة برضه، ما فيش حاجة شغالة،
//  بتشتغل أول ما بقفل الـ يعني بكون أنا خلصت الـ
//  أنا عاوز أول ما أفتحها وأول ما أخرج يتصلح»
// ============================================================
// تشخيص ر14 (الدليل الحي: سكرين شوت المستر التالت «Paused in
// debugger» على maths-genius.com = فخ ر13 واصل لايف فعلًا — والعلة
// تصميمية جوّه ر13 نفسه):
//   • ر13 كان بيحاول يربط الحالة بحالة الأدوات عن طريق فخ الـ
//     debugger — لكن التوقّف معناه إن كل الـ JS متجمد: مفيش أي
//     شاشة أو عدّاد ينقدر يترسم وهو متجمّد، والتسليح كان محتاج
//     توقّفين متتاليين = المستر يدوس Continue مرتين وهو مفتوح.
//   • ولو قفل وهو متجمّد (أي مستخدم حقيقي بيقفل من غير Continue):
//     كروم بيكمل التنفيذ لوحده لحظة القفل → التوقّف بيخلص بعد
//     القفل بالحرف → الشاشة السودة تنطلق بعد القفل «بتشتغل أول ما
//     بقفل» + nukeMedia كانت بتدمر الـ iframes صامتة حتى في المسار
//     المطموس = الفيديو بيبوظ من غير سبب ظاهر.
//
// قرار ر14 — الحالة مربوطة بحالة الأدوات **نفسها** بمصدرين مستقلين:
//
//   المصدر 1 (الأساسي الجديد — فوري في الاتجاهين ومن غير أي تجميد):
//     فجوة النافذة = outerWidth/outerHeight ناقص innerWidth/
//     innerHeight فوق خط أساس بيتلقط لحظة التشغيل وبيتحدّث بأقل قيمة:
//       - الفجوة العرضية (docked يمين/شمال + responsive mode)
//         شغالة على أي جهاز — كيبورد الموبايل ما بيغيّرش العرض.
//       - الفجوة الطولية (docked تحت) على الديسكتوب الصافي فقط
//         ((hover:hover) و (pointer:fine) و maxTouchPoints===0)
//         عشان كيبورد الموبايل ما ينذرش كاذب (درس ر10).
//       - خط الأساس بيمتص الزووم من أول لحظة (طالب بزووم 150% من
//         غير أدوات = صفر إنذار) — والانتقال نفسه هو الإشارة:
//         الفجوة زادت 160px عن الأساس = أدوات اتفتحت لحظة الفتح.
//       - حدث resize بيتنادى لحظة الفتح ولحظة القفل → تسليح فوري
//         (<100ms) ومسامحة فورية — في سيناريو المستر بالحرف:
//         يفتح docked أو responsive = سودة وعدّاد فورًا من غير ولا
//         توقّف ولا Continue، يقفل = الشاشة تروح والتمرير يرجع
//         فورًا. صفر «Paused in debugger» في السيناريو ده خالص.
//
//   المصدر 2 (كاشف الحالة الحي — للـ undocked والفحص عن بعد):
//     فخ توقّف الـ debugger (دالة مولّدة مرة واحدة ومسخّنة برة
//     القياس — درس ر12: المينيفايشن بيشيل الجملة الثابتة):
//       - مفتوحة = التنفيذ بيقف (مؤكد 100%)، مقفولة = no-op في نص
//         ميكروثانية (مؤكد 100%).
//       - وهو مفتوح docked: التوقّف الأول نفسه بيسلّح فورًا (الفجوة
//         بتأكد إن الأدوات لسه مفتوحة لحظة الرجوع).
//       - وهو مفتوح undocked (مفيش فجوة): توقّفان متتاليان = تسليح
//         (التوقّف التاني دليل إنه قاوم التجميد وهو مفتوح).
//       - قفل وهو متجمّد: الرجوع بعد القفل بييجي مع فجوة = صفر →
//         **صفر شاشة بعد القفل خالص** (علة المستر الحرفية اتعالجت).
//       - أثناء العدّ: الفخ بيتنادى في التيكات الزوجية للأسلحة اللي
//         جت من undocked بس (الأسلحة اللي جت من الفجوة عدّها ناعم
//         خالص من غير أي تجميد) — والصفر على ساعة الحائط زي ما هو:
//         التجميد ما بيمدّدش ولا يوقفش العد، والقفل undocked بيتحس
//         خلال ≤1 ثانية والشاشة بتروح (مفيش عقوبة بعد القفل).
//
//   فخ الكونسول getter — احتياطي فقط لو فخ الـ debugger تعذّر
//   إنشاؤه (CSP) بنفس منطق ر13، ومن غير أي log لما الفخ موجود
//   (الكونسول يفضل نضيف — المستر كان شايف Object مطوية).
//
//   الوسائط: التسليح = إيقاف مؤقت للفيديوهات + الخروج من fullscreen
//   (الشاشة السودة فوق كل حاجة حتى الفيديو الفول سكرين) — والمسامحة
//   بترجّع الفيديو اللي كان شغال من مكانه. التدمير الكامل (nukeMedia)
//   بقال عند العقوبة النهائية بس — عكس ر13 اللي كانت بتدمر على أول
//   توقّف حتى لو المسار المطموس.
//
//   الصفر على ساعة الحائط:
//     - تسليح فيه تأكيد توقّف حقيقي (debugger/كونسول) = العقوبة
//       الصلبة زي ر7/ر8/ر13 بالحرف: تدمير الوسائط + POST
//       /api/security/reject-account + شاشة «حسابك مرفوض» دائمة.
//     - تسليح من الفجوة فقط (بدون أي تأكيد توقّف — احتمال إنذار
//       كاذب من Side Panel مثلًا) = عقوبة مرنة قابلة للاسترجاع:
//       مسح الجلسة والعودة للرئيسية — من غير رفض نهائي ولا أي سجل.
//       ولو المستخدم قفل الفجوة قبل الصفر = مسامحة فورية بصمت.
//
//   كل قرار ر10/ر12/ر13 ثابت: العدّ في حالة واحدة بس (أدوات مفتوحة
//   فعلًا)، صفر إنذارات كاذبة من أي حاجة تانية (زووم/كيبورد/فتح
//   فيديو/تهنيج)، الأدمن مستثنى، الأتمتة مستثنية من فخ التوقّف،
//   المهلة من إعداد الأدمن guard_countdown_seconds (افتراضي 8 —
//   يقبل 3..120).
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
    var running = false        /* الشاشة السودة والعدّاد شغالين */
    var gapArmed = false       /* التسليح جاي من فجوة النافذة (من غير تأكيد توقّف) */
    var confirmed = false      /* فيه تأكيد توقّف حقيقي (debugger/كونسول) في التسليح الحالي */
    var pendingPause = false   /* توقّف واحد من غير فجوة (undocked غامض) — بستنى التوقّف التاني */
    var pendingRun = false     /* أثناء العدّ undocked: توقّف طويل — بستنى تيك سريع أثبت القفل */
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

    /* ===== خط أساس الفجوة (ضد الزووم — درس ر10 وضُبط في ر14) =====
       بيتلقط لحظة التشغيل وبيتحدّث بأقل قيمة شوفناها: الزووم من أول
       لحظة بيمتص في الأساس (صفر إنذار)، والفجوة اللي بتظهر **فوق**
       الأساس أثناء الجلسة هي اللي بتدل على أدوات اتفتحت.
       الزووم اللي بيحصل في نص الجلسة ممكن يزود الفجوة مؤقتًا —
       عقوبته مرنة (الأسلحة اللي جت من الفجوة من غير تأكيد توقّف) +
       أول ما يرجّع الزووم الفجوة ترجع للأساس والمسامحة فورية.
       والأدوات المفتوحة قبل التحميل ما محتاجاش فلاغ خاص — فخ
       التوقّف بيمسكها (توقّفان متتاليان) من غير أي افتراض عن الفجوة. */
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
       من غير أدوات مفتوحة الاستدعاء no-op في نص الميكروثانية من
       غير أدوات (الكومبايلة حصلت مرة واحدة)، ومع أدوات مفتوحة
       التنفيذ بيقف لحد Continue = الفرق ثواني = مفتوحة مؤكد. */
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

    /* ===== الوسائط: إيقاف مؤقت عند التسليح + رجوع عند المسامحة =====
       عكس ر13: مفيش تدمير على أول إشارة — التدمير الكامل للعقوبة
       النهائية بس. عشان الفيديو ما يبوظش لو الإشارة طلعت مطموسة. */
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
           في مكانه والطالب يدوس شغّال عادي بعد المسامحة. */
      } catch (e) {}
      pausedVideos = []
      pausedFrames = []
    }

    /* ===== منع النسخ عند العقوبة النهائية: تدمير كل الـ iframes والفيديوهات ===== */
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

    /* ===== فخ التوقّف: بيرجّع الفرق بالمللي ثانية ===== */
    function probeDelta(): number {
      var t0 = Date.now()
      try { if (dbgFn) dbgFn() } catch (e) {}
      return Date.now() - t0
    }

    /* ===== تسليح: سودة فورية + عدّ كامل من الأول =====
       gap = من الفجوة (من غير تأكيد توقّف — عقوبته المرنة)
       probe/console = فيه تأكيد توقّف حقيقي (العقوبة الصلبة) */
    function arm(kind: 'gap' | 'probe' | 'console') {
      if (done) return
      if (!readStudent()) return
      if (!running) {
        running = true
        deadline = Date.now() + countMs
        armedDurMs = countMs
        lastShown = -1
        gapArmed = kind === 'gap'
        confirmed = kind !== 'gap'
        pendingPause = false
        pendingRun = false
        pauseMedia()
        renderMode()
        paintCount()
      } else if (kind !== 'gap') {
        /* ترقية تسليح قايم لتأكيد حقيقي — من غير إعادة عدّ */
        confirmed = true
        gapArmed = false
      }
    }

    /* ===== المسامحة الفورية: الشاشة تروح والتمرير يرجع والفيديو يكمل ===== */
    function forgive() {
      running = false
      deadline = 0
      gapArmed = false
      confirmed = false
      pendingPause = false
      pendingRun = false
      cleanStreak = 0
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
          arm('gap')
        } else if (!noAutomation && dbgFn && isStudent) {
          /* 2) كاشف الحالة الحي — لما مش شغال فقط:
             توقّف + فجوة لحظة الرجوع = docked مفتوحة → تسليح فوري
             توقّف + مفيش فجوة → undocked غامض (Continue عادي أو قفل)
               → توقّفان متتاليان = مفتوحة مؤكد → تسليح
               → تيك سريع بعد التوقّف = قفل بعد التجميد → صفر شاشة */
          var d1 = probeDelta()
          if (d1 > 100) {
            lastSignalHit = Date.now()
            if (gapNow()) arm('probe')
            else if (pendingPause) { pendingPause = false; arm('probe') }
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
            arm('console')
          }
        }
      }

      if (running) {
        paintCount()
        /* لو حد شال العنصر نفسه من الـ DOM بالأدوات — بنرجّعه فورًا */
        if (!document.getElementById('mg-guard-black')) renderMode()

        /* القفل undocked أثناء العدّ (الأسلحة اللي من الفخ فقط —
           أسلحة الفجوة عدّها ناعم خالص والقفل بيتحس من resize):
           تيك زوجي = فحص توقّف — توقّف طويل = لسه مفتوحة، تيك سريع
           بعد توقّف = قفلت → مسامحة فورية ≤1 ثانية */
        if (!gapArmed && !noAutomation && dbgFn && isStudent && tickNo % 2 === 0) {
          var d2 = probeDelta()
          if (d2 > 100) { pendingRun = true; lastSignalHit = Date.now() }
          else if (pendingRun) { pendingRun = false; forgive() }
        }

        /* شبكة أمان الفجوة: تسليح من الفجوة والفجوة راحت من غير resize */
        if (running && gapArmed && !confirmed && !gapNow()) forgive()

        /* احتياطي الكونسول وأثناء العدّ — نفس منطق ر13 */
        if (running && !dbgFn) {
          if ((Date.now() - lastSignalHit) < 3000) cleanStreak = 0
          else if (cleanStreak >= 6) { forgive() }
          else cleanStreak++
        }

        /* الصفر على ساعة الحائط — تجميد الصفحة ما بينفعش:
           تسليح فيه تأكيد توقّف حقيقي = العقوبة الصلبة (رفض نهائي)،
           تسليح من الفجوة فقط = العقوبة المرنة القابلة للاسترجاع */
        if (running && Date.now() >= deadline) {
          if (gapArmed && !confirmed) softPunish()
          else punish()
          return
        }
      }
    }

    /* ===== الحالة الفورية لحظة الفتح/القفل (resize) =====
       ده مصدر «أول ما أفتحها وأول ما أخرج يتصلح» بالحرف —
       بيتنادى لحظة docking/undocking/responsive لحظيًا */
    function onResize() {
      if (done) return
      updateBaselines()
      var g = gapNow()
      if (g) {
        if (!running) arm('gap')
      } else if (running && gapArmed && !confirmed) {
        forgive()
      }
    }
    try { window.addEventListener('resize', onResize) } catch (e) {}

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

    /* ===== العقوبة الصلبة (تأكيد توقّف حقيقي): الرفض النهائي ===== */
    function punish() {
      if (done) return
      done = true
      running = false
      try { window.removeEventListener('resize', onResize) } catch (e) {}
      try { clearInterval(timer) } catch (e) {}
      nukeMedia()
      removeUI()
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

    /* ===== العقوبة المرنة (تسليح من الفجوة فقط — بدون أي تأكيد توقّف):
       مسح الجلسة والعودة للرئيسية — قابلة للاسترجاع بالدخول عادي،
       من غير رفض نهائي ولا أي سجل — عشان إنذار كاذب محتمل (Side
       Panel مثلًا) ما يضركش طالب بريء أبدًا. ولو قفل الفجوة قبل
       الصفر = مسامحة فورية بصمت أصلًا. */
    function softPunish() {
      if (done) return
      done = true
      running = false
      try { window.removeEventListener('resize', onResize) } catch (e) {}
      try { clearInterval(timer) } catch (e) {}
      removeUI()
      resumeMedia()
      clearSessions()
      try { location.replace('/') } catch (e) {}
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

    /* بداية نظيفة */
    return function cleanup() {
      try { window.removeEventListener('resize', onResize) } catch (e) {}
      try { clearInterval(timer) } catch (e) {}
    }
  }, [])
  return null
}
