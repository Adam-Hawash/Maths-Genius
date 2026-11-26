'use client'

// ============================================================
// DevToolsGuard — ر18 بطلب المستر الحرفي (إبادة فخ الـ debugger نهائيًا):
//   «أنا باجي أفتح الـ developer tools تمام بيجيب لي الـ بتاع دوت اللي هو
//    بتاع المية، نص الشاشة كده، نص الشاشة يعني برضه ببقى شايف الـ developer
//    tools، أنت كنت عاملها لي زمان بس نسيت، نص الشاشة والـ developer tools
//    بتبقى شغالة، وبعد كده مبيعدش، بيختفي على طول وبيجيب لي debugger،
//    حاجة اسمها debugger في الـ developer tools بدخل على القسم الـ source،
//    فأنا عاوز حل سريع وبرضه بكلمك باحترام بعد إذنك.»
//   التشخيص الجذري من البلاغ نفسه (تسلسل حرفي مفيش فيه غموض):
//     • علة «بيجيب لي debugger»: فخ توقّف الـ debugger نفسه هو اللي بيوقف
//       الصفحة في قسم Source كل نص ثانية — المستر شايف Paused in debugger
//       وده الفخ اللي كان بيتولّد بـ constructor('debugger') من ر12.
//     • علة «بيختفي على طول»: المسامحة في التسليح غير الفجوي كانت
//       «تيك سريع بعد توقّف = الأدوات قفلت» — Continue سريع (أقل من 100ms)
//       وهو فاتح كان بيخدع الحارس → السودة تروح وهو مفتوح والفخ يفضل
//       يسأل كل تيك من غير أي شاشة — بالحرف البلاغ.
//   قرار ر18:
//     1) صفر debugger خالص — الفخ اتمسح من آخر سطر في الكود: صفر
//        «Paused in debugger» على أي جهاز بأي وضع (docked/undocked).
//     2) المسامحة مربوطة بحالة الأدوات الحقيقية بس: الفجوة رجعت = قفل
//        فوري، والتسليح الصامت بيتحوّل تلقائيًا لتسليح فجوي لو فجوة ظهرت
//        بعده، وتسليح فحص التحميل بيتقفل بمراقبة الفجوة الخام — مفيش
//        أي مسار مسامحة بيشتغل والأدوات مفتوحة — السودة ما بتختفيش
//        «على طول» خالص.
//     3) فحص تحميل صامت جديد يغطي «الأدوات مفتوحة قبل التحميل» من غير
//        أي توقّف: الفجوة العرضية الكبيرة مع فجوة طولية صغيرة (بصمة
//        docking) من أول لحظة على ديسكتوب صافي = تسليح فوري — الزووم
//        بيكبّر الاتنين مع بعض فبيفضل صامت (درس ر10)، والسايدبار لو
//        وقع فيه إنذار لحظي بيتصلح فورًا أول ما يقفل السايدبار.
//     4) كل قرار ر15/ر16 ثابت: السودة واقفة طول ما الأدوات مفتوحة من
//        غير أي عقوبة، القفل يصلح كل حاجة فورًا، العدّ استعراضي برسالة
//        ثابتة بعد الصفر، حماية إعادة التثبيت من العبث (CSS/DOM/fullscreen)
//        + mg_guard_pause للمشغل الآمن، الأدمن مستثنى، المهلة من
//        إعداد الأدمن guard_countdown_seconds.
//   تاريخ ر16 (تحصين شاشة ر15):
//   ر16 بيقفل 4 ثغرات كانت بتسمح بهزم السودة وهو مفتوح:
//     (1) إخفاء العنصر بالـ CSS من الأدوات (display:none/visibility/opacity)
//         كان بيسمع الشاشة — كل تيك بنفحص المحسوبات وبنرجّعها فورًا
//     (2) مسح جلسة الطالب من الكونسول وهو مفتوح كان بيفك الحماية (forgive)
//         — السودة دلوقتي مش متعلقة بالجلسة خالص وبتفضل واقفة لحد قفل
//         الأدوات فعليًا وكل مسارات المسامحة شغالة بلا جلسة
//     (3) إعادة ملء الشاشة (fullscreen) بعد ظهور السودة كانت بتدفنها في
//         الـ top layer — fullscreenchange بيخرج فورًا + فحص كل تيك
//     (4) المشغل الآمن /api/player/[ticket] ما كانش بيستقبل أمر الإيقاف
//         (صيغة يوتيوب مش مفهومة له) — رسالة mg_guard_pause جديدة بتوقفه
//         من جوه + إعادة تثبيت ستايل ومكان العنصر كل تيك ضد العبث
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
//     3) (ر18) فخ الكونسول الصامت للـ undocked — مفيش أي فخ توقّف خالص:
//        getter بيتشغل لما كونسول حقيقي يوسّع/يعرض الـ object — صامت
//        تمامًا ومن غير أي «Paused in debugger» — والـ object بيتطلبى
//        مرة واحدة وقت التحميل وكل 30 ثانية بس عشان الكونسول يفضل نضيف.
//     4) فحص التحميل الصامت (ر18) بدل فحص التوقّف — البند 3 فوق.
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
    var cleanStreak = 0        /* عدّاد سكوت فخ الكونسول الصامت (ر18 — مفيش فخ توقّف خالص) */
    var loadArmed = false      /* (ر18) تسليح فحص التحميل الصامت — مسامحته بمراقبة الفجوة الخام */
    var loadW = 0              /* الفجوة الخام لحظة تسليح التحميل (عرض) */
    var loadH = 0              /* الفجوة الخام لحظة تسليح التحميل (طول) */
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

    /* (ر18) فخ الـ debugger اتمسح من آخر سطر في الكود — صفر «Paused in
       debugger» على أي جهاز وبأي وضع. كاشف الـ undocked بقى فخ
       الكونسول الصامت بس. */

    /* ===== فخ الكونسول الصامت (المكشف الوحيد المتبقي غير الفجوي) =====
       getter بيتشغل لحظة ما كونسول حقيقي يعرض/يوسّع الـ object —
       صامت تمامًا: مبيجمّدش التنفيذ ومبيظهرش أي حاجة في Sources */
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
            /* (ر16) المشغل الآمن /api/player/[ticket] مش بيستقبل صيغة يوتيوب
               — رسالة مخصصة بوقفه فعلًا من جوه (الصوت كان بيكمل ورا السودة) */
            if (f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ type: 'mg_guard_pause' }), '*')
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
      cleanStreak = 0
      loadArmed = false
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
      cleanStreak = 0
      loadArmed = false
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
        } else if (!noAutomation && isStudent) {
          /* 2) (ر18) فخ الكونسول الصامت — المكشف الوحيد المتبقي غير
             الفجوي (undocked) — من غير أي debugger خالص:
             إشارة خلال آخر 3 ثواني = كونسول بيتفحص فعلًا → شاشة فورية.
             والكونسول بيفضل نضيف قدر الإمكان: الـ object بيتطلبى مرة
             واحدة وقت التحميل وكل 30 ثانية بس (كان كل ثانيتين). */
          if (tickNo === 1 || tickNo % 60 === 0) { try { console.log(trapObj) } catch (e) {} }
          if ((Date.now() - lastSignalHit) < 3000) {
            cleanStreak = 0
            arm(false)
          }
        }
      }

      if (running) {
        /* (ر16) جلسة الطالب لو اتمسحت من الكونسول والأدوات مفتوحة — الشاشة
           تفضل واقفة: كانت دي أخطر ثغرة في ر15 (مسح مفتاح الجلسة من
           الكونسول وهو مفتوح كان بينفّذ forgive فالسودة تروح والفيديو
           يرجع «بتروح كلها بتتغير» حرفيًا). الحماية دلوقتي مش متعلقة
           بالجلسة خالص — كل مسارات المسامحة تحت شغالة من غير جلسة. */

        /* العدّ الاستعراضي خلص والأدوات لسه مفتوحة → الشاشة تفضل واقفة
           برسالة ثابتة — مفيش أي تنفيذ بعد الصفر خالص (علة «الهبل») */
        if (running && !stalled && Date.now() >= deadline) {
          stalled = true
          renderMode(true)
        }

        paintCount()
        /* (ر16) الشاشة السودة قفل حقيقي مش زخرفة — كل تيك بنفحصها
           وبنعيد تثبيتها: لو حد شالها من الـ DOM أو خبّاها بالـ CSS
           (display:none / visibility:hidden / opacity:0) أو غير مكانها
           أو عبث في ستايلها من الأدوات → بنرجّعها لحظتها. الحماية حالة
           داخلية مش متعلقة بوجود العنصر ولا بشكله. */
        var blk = document.getElementById('mg-guard-black') as HTMLElement | null
        var blkGone = !blk
        if (!blkGone) {
          try {
            var bcs = window.getComputedStyle(blk as HTMLElement)
            if (bcs.display === 'none' || bcs.visibility === 'hidden' || parseFloat(bcs.opacity || '1') < 0.5) blkGone = true
          } catch (e) { blkGone = true }
        }
        if (blkGone) {
          renderMode(stalled)
        } else {
          try {
            if (blk && blk.parentNode !== document.body) document.body.appendChild(blk)
            if (blk) blk.style.cssText = baseStyles()
          } catch (e) {}
        }
        try { if (document.body.style.overflow !== 'hidden') document.body.style.overflow = 'hidden' } catch (e) {}
        /* (ر16) إعادة ملء الشاشة وأنا واقف = محاولة دفن السودة تحت
           الـ top layer — بنخرج من الفول سكرين فورًا هنا كمان احتياط */
        try {
          var fsNow = (document as any).fullscreenElement || (document as any).webkitFullscreenElement
          if (fsNow) {
            try { if ((document as any).exitFullscreen) (document as any).exitFullscreen().catch(function () {}) } catch (e) {}
            try { if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen() } catch (e) {}
          }
        } catch (e) {}

        if (running && loadArmed) {
          /* (ر18) تسليح فحص التحميل الصامت: الأدوات لسه مفتوحة ما دام
             الفجوة الخام شبه لحظة التسليح — نزلت أكتر من 200px = قفلت
             فعلاً → إصلاح فوري. وده اللي بيمنع السودة تختفي وهو مفتوح:
             مفيش «تيك سريع» ولا Continue بيغيّر الفجوة الخام خالص. */
          try {
            var cw0 = Math.max(0, (window.outerWidth || 0) - (window.innerWidth || 0))
            var ch0 = Math.max(0, (window.outerHeight || 0) - (window.innerHeight || 0))
            if (cw0 < loadW - 200 && ch0 < loadH - 200) forgive()
          } catch (e) {}
        }

        if (running && !gapArmed && !loadArmed && gapNow()) {
          /* (ر18) التسليح كان صامتًا (كونسول) والأدوات بقى ليها فجوة
             ظاهرة → تحويل تلقائي لتسليح فجوي عشان المسامحة تبقى مربوطة
             بحالة الأدوات الحقيقية ومتطلعش غلط وهو مفتوح */
          gapArmed = true
        }
        if (gapArmed) {
          /* شبكة أمان الفجوة: التسليح من الفجوة والفجوة راحت من غير
             resize = الأدوات قفلت → إصلاح فوري (شغالة من غير جلسة — ر16)
             — والفجوة مبتختفيش بحقيقة إلا لما الأدوات تتقفل فعلًا
             — علة «بيختفي على طول» اتحلت بالجذر */
          if (!gapNow()) forgive()
        } else if (!noAutomation) {
          /* (ر18) مسامحة التسليح الصامت (كونسول undocked): سكوت الفخ
             ≥3 ثواني متواصلة = مفيش تفحص حقيقي شغال → الأدوات قفلت
             عمليًا → إصلاح فوري. مفيش أي فحص توقّف خالص. */
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

    /* ===== (ر16) إعادة ملء الشاشة وأنا مسلح = دفن للشاشة السودة في
       الـ top layer (أعلى من أي z-index) — بنخرج فورًا لحظة الحدث
       مش مستنيين التيك عشان السودة تفضل ظاهرة طول الأدوات مفتوحة ===== */
    function onFsChange() {
      if (done || !running) return
      try {
        var fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement
        if (fsEl) {
          try { if ((document as any).exitFullscreen) (document as any).exitFullscreen().catch(function () {}) } catch (e) {}
          try { if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen() } catch (e) {}
        }
      } catch (e) {}
    }
    try { document.addEventListener('fullscreenchange', onFsChange) } catch (e) {}
    try { document.addEventListener('webkitfullscreenchange', onFsChange) } catch (e) {}

    /* ===== (ر18) فحص تحميل صامت — من غير أي debugger خالص =====
       الأدوات المفتوحة قبل التحميل بتمتص في خط الأساس (درس ر10 مع
       الزووم). البصمة المميزة للتسليح الدوكي من غير فحص توقّف:
       الفجوة العرضية الكبيرة مع فجوة طولية صغيرة (بصمة docking —
       الكروم الفاضي فجوتها الطولية بس)، أو العكس للتحت — الزووم
       بيكبّر الاتنين مع بعض فبيفضل صامت تمامًا، والسايدبار لو وقع
       فيه إنذار لحظي بيتصلح فورًا أول ما يقفله (الفجوة الخام ترجع
       → مراقبة loadArmed بتعمل forgive). المسامحة هنا مربوطة
       بالفجوة الخام نفسها — مفيش أي Continue ولا توقّف في الحساب. */
    if (!noAutomation && readStudent() && desktopFine()) {
      setTimeout(function () {
        if (done || running) return
        try {
          var iw0 = window.innerWidth || 0
          var ih0 = window.innerHeight || 0
          if (iw0 < 200 || ih0 < 200) return
          var gw0 = Math.max(0, (window.outerWidth || 0) - iw0)
          var gh0 = Math.max(0, (window.outerHeight || 0) - ih0)
          if ((gw0 > 400 && gh0 < 170) || (gh0 > 400 && gw0 < 170)) {
            loadW = gw0
            loadH = gh0
            arm(false)
            loadArmed = true
          }
        } catch (e) {}
      }, 400)
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
        /* (ر16) لو الرسم بيحصل وإحنا واقفين في نص عدّ (إعادة رسم بعد ما
           حد خبّى العنصر من الأدوات) — نبدأ من المتبقي الفعلي مش من الأول */
        var secs = running && deadline ? Math.max(0, secsLeft()) : Math.max(1, Math.round(countMs / 1000))
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
      try { document.removeEventListener('fullscreenchange', onFsChange) } catch (e) {}
      try { document.removeEventListener('webkitfullscreenchange', onFsChange) } catch (e) {}
      try { clearInterval(timer) } catch (e) {}
    }
  }, [])
  return null
}
