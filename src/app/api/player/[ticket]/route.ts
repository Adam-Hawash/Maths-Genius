// ============================================================
// /api/player/[ticket] — مشغّل الفيديو المحمي (صفحة كاملة)
// ============================================================
// التذكرة: واحدة الاستخدام + صلاحية دقيقتين — من غيرها مفيش تشغيل.
// الصفحة دي هي الوحيدة اللي بتشوف معرف اليوتيوب/الملف — وعلى السيرفر:
//  1) معرف اليوتيوب مبيدخلش الصفحة كنص صريح — بيتشفّر (XOR + Base64)
//     وبيتفك في الذاكرة لحظة التشغيل بس، فمفيش ID في مصدر الصفحة
//     ولا في الـ DOM ولا في أي console.log.
//  2) الملفات المرفوعة بتتخدم بتوكن موقّع قصير العمر مرتبط بالطالب.
//  3) ووترمارك (مواصفات المستر النهائية 2026-ز): مفيش أي شِپات على الحواف خالص —
//     ووترمارك كبير واحد في نص الخلفية على سطرين (الاسم الثنائي + الرقم تحته)
//     **ثابت تمامًا من غير أي نبض** (طلب المستر حرفيًا: "خليها ثابتة ما
//     تغيرهاش — الشفافية بتاعتها حلوة") + بيرجع يرسم لوحه نفسه لو اتمسح
//     + شغال جوه ملء الشاشة.
//     وكارتين (الاسم الكامل + الرقم): واحد فوق الناحية الشمال (جديد) وواحد
//     ثابت في **الزاوية تحت على اليمين**.
//  4) حماية فحص: كليك يمين مقفول + F12/Ctrl+U/Ctrl+S + Ctrl+Shift+I/J/C/K
//     + **كل زرار F1 لـ F12 وفيهم F10 صراحةً (event.key === 'F10' — طلب
//     المستر الحرفي 2026-م: "explicitly intercept and prevent the F10 key")**
//     بتنبيه لطيف + لو أدوات المطور اتفتحت الفيديو بيوقف مؤقتًا.
//  5) التقدم بيتقال للأب بـ postMessage كل 5 ثواني (مفيش أي لينك).
//  6) حماية الفيديو من يوتيوب (طلب المستر 2026-و): اسم قناة يوتيوب/العنوان/
//     زرار الشير/اللينك — مستحيل يبانوا ولا حد يقدر يدوس عليهم:
//     **درع علوي دايمًا شغال** (مش بس وقت الوقف) + باتش اللوجو + طبقة التقاط
//     النقرات (مفيش أي ضغطة توصل لليوتيوب أصلًا) — من غير أي قص للفيديو.
//  7) الجودة (القرار النهائي 2026-ن — بعد ما كل حلول الـ API فشلت فعلًا):
//     يوتيوب أبطلت كل دوال الجودة في الـ IFrame API (setPlaybackQualityRange /
//     suggestedQuality) — بيتجاهلوها خالص وgetPlaybackQuality بيرجع 360p كذب
//     (ده سبب «مختار 1080 وبتثبت على 360»). الحل الوحيد اللي بيبدّل التيار
//     **فعليًا** في 2026: كنترولز يوتيوب الأصلية نفسها (controls=1) — قائمة
//     ⚙ بتاعتها هي اللي بتطلب التيار بالمستوى المختار ويوتيوب بيرد ويبدّل
//     فعلًا. عشان كده **الوضع البديل المضمون بقى هو المشغل الأساسي والوحيد
//     لليوتيوب**: مشغل يوتيوب الأصلي بكامل حماياتنا فوقه (الوترمارك + الدروع
//     + درع الكابشن + ملء الشاشة بتاعنا بالوترمارك) + الـ JS API للحاجات
//     اللي لسه شغالة بس (التقدم/التكملة/إبادة الكابشن) — مفيش أي قائمة
//     جودة وهمية من عندنا خالص.
//  8) الكابشن/الترجمة (القرار النهائي — طلب المستر الحرفي: «تشيل زرار
//     الكابشن وتشيل الكابشن أصلاً — اعمل للكابشن بلوك.. مش عايز أي كتابة
//     تظهر تحت الفيديو»): مفيش زرار CC في أي مشغل خالص + cc_load_policy=0
//     + hl=ar + cc_lang_pref=ar + إبادة موديول الترجمة دوريًا (بتقتل ترجمة
//     ASR التلقائية كمان) + **درع الكابشن (capShield)**: شريط بلور داكن
//     فوق منطقة الترجمة — أي سطر يحاول يظهر بيبقى مش مقروء أصلًا.
//     زرار C اتشال من الكيبورد (كان بيفتح الترجمة — الترجمة دلوقتي ممنوعة
//     نهائيًا ومفيش أي طريقة لفتحها).
//  9) التشغيل المضمون: مراقب متدرج (playVideo → loadVideoById → صامت)
//     + تحميل API يوتيوب بإعادة محاولة + تسجيل طلب التشغيل قبل جهوزية الـ API
//     + تكملة مشاهدة آمنة (من غير حلقة النهاية).
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getYouTubeId, mediaIdFromPath, signVideoToken, ensurePlayTicketTable } from '@/lib/video-guard'

export const dynamic = 'force-dynamic'

function htmlEscape(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// XOR + Base64 — تشفير خفيف يمنع ظهور الـ ID كنص مقروء في المصدر
function obfuscate(plain: string): { k: string; b: string } {
  const key = crypto.randomBytes(12).toString('base64url')
  const kb = Buffer.from(key)
  const pb = Buffer.from(plain)
  const out = Buffer.alloc(pb.length)
  for (let i = 0; i < pb.length; i++) out[i] = pb[i] ^ kb[i % kb.length]
  return { k: key, b: out.toString('base64') }
}

function pageError(msg: string, status: number) {
  return new NextResponse(
    '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>body{margin:0;background:#0b0b0f;color:#e5e7eb;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;box-sizing:border-box}p{font-size:15px;line-height:1.9;max-width:420px}</style></head>' +
    '<body><p>' + htmlEscape(msg) + '</p></body></html>',
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, private' } }
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ ticket: string }> }) {
  try {
    const { ticket } = await params
    const { searchParams } = new URL(request.url)
    const resume = parseFloat(searchParams.get('resume') || '0') || 0

    if (!ticket) return pageError('تذكرة التشغيل ناقصة — اقفل المشغل وافتح الفيديو من الأول.', 400)

    // self-heal: لو جدول التذاكر ناقص بنعمله الأول عشان الاستعلام ميطقعش
    await ensurePlayTicketTable()
    let row: any = null
    try {
      row = await db.playTicket.findUnique({ where: { id: ticket } })
    } catch (e) {
      // محاولة أخيرة بعد التأكد من الجدول (بقوة — لو اتمسح والموقع شغال)
      await ensurePlayTicketTable(true)
      try { row = await db.playTicket.findUnique({ where: { id: ticket } }) } catch (e2) { row = null }
    }
    if (!row) return pageError('تذكرة التشغيل مش موجودة — اقفل المشغل وافتح الفيديو من الأول.', 403)
    // ===== (2026-ط) علاج جذري لـ"الفيديو مش بيفتح خالص" =====
    // كانت التذكرة بتُستهلك من أول تحميل (single-use) — أي preFetch أو Retry
    // أو إعادة تحميل للـ iframe قبل ما المشغل يرندر بيحرق التذكرة، والطالب
    // يشوف "التذكرة اتاستخدمت" للأبد من غير أي حل. دلوقتي: التذكرة صالحة
    // طوال دقيقتين مهما اتفتحت — الحماية زي ما هي (التذكرة مخصصة للطالب
    // وبتنتهي تلقائيًا ومفيش أي معرف فيديو بيظهر نتيجة كده)
    if (new Date(row.expiresAt).getTime() < Date.now()) return pageError('تذكرة التشغيل خلصت صلاحيتها — اقفل المشغل وافتح الفيديو من الأول وهيفتح عادي.', 403)

    // ===== فيديوهات المعرض (gal_...) =====
    if (row.videoId && row.videoId.indexOf('gal_') === 0) {
      const galId = row.videoId.slice(4)
      let g: any = null
      try { g = await db.galleryImage.findUnique({ where: { id: galId } }) } catch (e) {}
      if (!g || !(g as any).videoUrl) return pageError('الفيديو غير موجود.', 404)
      const gYt = getYouTubeId(g.videoUrl || '')
      if (!gYt && !/\.(mp4|webm|mov|ogg)(\?|$)/i.test(g.videoUrl || '')) return pageError('الفيديو ده مفيهوش مصدر تشغيل صالح.', 415)
      var gCfg: Record<string, unknown> = {
        videoId: 'gal_' + galId,
        kind: gYt ? 'youtube' : 'file',
        resume: 0,
        wm: { enabled: false, opacity: 0, interval: 14, name: '', phone: '' },
      }
      if (gYt) { const gob = obfuscate(gYt); gCfg.blob = gob.b; gCfg.key = gob.k }
      else gCfg.fileUrl = g.videoUrl
      const gJson = JSON.stringify(gCfg).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
      return new NextResponse(PLAYER_PAGE.replace('__CFG__', gJson).replace('__TITLE__', htmlEscape(g.title || 'فيديو')), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, private, max-age=0',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'no-referrer',
        },
      })
    }

    const video = await db.video.findUnique({ where: { id: row.videoId } })
    if (!video) return pageError('الفيديو غير موجود.', 404)

    // إعدادات الووترمارك من لوحة الأدمن (SiteConfig)
    var wmEnabled = '1', wmOpacity = 55, wmInterval = 14
    try {
      const cfgs = await db.siteConfig.findMany({ where: { key: { in: ['wm_enabled', 'wm_opacity', 'wm_interval'] } } })
      for (var i = 0; i < cfgs.length; i++) {
        if (cfgs[i].key === 'wm_enabled') wmEnabled = cfgs[i].value === '0' ? '0' : '1'
        if (cfgs[i].key === 'wm_opacity') wmOpacity = Math.max(15, Math.min(95, parseInt(cfgs[i].value || '55') || 55))
        if (cfgs[i].key === 'wm_interval') wmInterval = Math.max(4, Math.min(60, parseInt(cfgs[i].value || '14') || 14))
      }
    } catch (e) {}

    // بيانات الطالب للوترمارك (الرقم المسجل بيه هو الأبرز)
    var wmName = '', wmPhone = ''
    if (row.studentId) {
      try {
        const st = await db.student.findUnique({ where: { id: row.studentId } })
        if (st) { wmName = st.name || ''; wmPhone = st.phone || '' }
      } catch (e) {}
    }

    const ytId = getYouTubeId(video.url || '')
    const mediaId = mediaIdFromPath(video.filePath || '')
    const videoIdEsc = htmlEscape(video.id)
    const titleEsc = htmlEscape(video.title || '')

    // مفيش طريقة تشغيل معروفة → صفحة خطأ
    if (!ytId && !mediaId) return pageError('الفيديو ده مفيهوش مصدر تشغيل صالح.', 415)

    // إعدادات المشغل كـ JSON آمن جوه script
    const cfg: Record<string, unknown> = {
      videoId: video.id,
      kind: ytId ? 'youtube' : 'file',
      resume: resume,
      wm: {
        enabled: wmEnabled === '1',
        opacity: wmOpacity / 100,
        interval: wmInterval,
        name: wmName,
        phone: wmPhone,
      },
    }
    if (ytId) {
      const ob = obfuscate(ytId)
      // الـ ID مش موجود كنص صريح — مقسوم مشفّر XOR
      cfg.blob = ob.b
      cfg.key = ob.k
    } else if (mediaId) {
      // توكن موقّع ساعتين مرتبط بالطالب — مكانش هيظهر غير جوه صفحة المشغل
      cfg.fileUrl = '/api/files/' + mediaId + '?token=' + signVideoToken(mediaId, row.studentId || 'anon') + '&req=' + encodeURIComponent(row.studentId || 'anon')
    }
    const cfgJson = JSON.stringify(cfg).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

    const html = PLAYER_PAGE.replace('__CFG__', cfgJson).replace('__TITLE__', titleEsc)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, private, max-age=0',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'no-referrer',
      },
    })
  } catch (error: any) {
    console.error('player route error:', error)
    return pageError('حصل خطأ في تشغيل الفيديو — جرب تاني.', 500)
  }
}

/* ============================================================
   صفحة المشغل — قالب واحد فيه كل الحماية والوترمارك
   ============================================================ */
const PLAYER_PAGE = `<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="referrer" content="no-referrer">
<title>__TITLE__</title>
<style>
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;padding:0;width:100%;height:100%;background:#000;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
  #stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000}
  #wrap{position:relative;width:100%;max-width:100vw;background:#000;overflow:hidden}
  #wrap.fs{width:100vw;height:100vh;max-width:none}
  #yt,#fileVid{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
  /* ===== الووترمارك (المواصفات الجديدة 2026-ح — طلب المستر الحرفي) =====
     • **4 ووترمارك صغيرة ثابتة** ظاهرة على طول:
       واحدة فوق في النص + اتنين في نص الفيديو (يمين وشمال)
       + واحدة تحت خالص في نص الفيديو
     • الووترمارك الكبيرة الشفافة في النص: **بتظهر 10 ثواني وبتختفي 20 ثانية**
       (دورة 30 ثانية بتكرر لوحدها — keyframes wmBlink30) */
  .wm{position:absolute;inset:0;z-index:40;pointer-events:none;user-select:none;overflow:hidden}
  @keyframes wmBlink30{0%{opacity:0}1.5%{opacity:var(--wmo,.5)}31.5%{opacity:var(--wmo,.5)}33.5%{opacity:0}98.5%{opacity:0}100%{opacity:var(--wmo,.5)}}
  /* الووترمارك الكبير في النص — سطرين: الاسم الثنائي + الرقم تحته
     **بتظهر 10 ثواني وبتختفي 20 ثانية** (دورة 30 ثانية) */
  #wmBig{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:41;direction:rtl;
    text-align:center;max-width:94%;--wmo:.5;opacity:0;
    animation:wmBlink30 30s linear infinite;
    font-weight:900;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
    font-size:clamp(20px,5.6vw,72px);line-height:1.25;
    unicode-bidi:plaintext;letter-spacing:0}
  #wmBig .b1{display:block;color:rgba(0,0,0,.10);white-space:nowrap;
    -webkit-text-stroke:1.3px rgba(0,0,0,.42);paint-order:stroke fill;
    text-shadow:0 0 16px rgba(255,255,255,.16)}
  /* الرقم تحت الاسم في سطر لوحده — أصغر بس واضح ومقروء (لازم الرقم يظهر) */
  #wmBig .b2{display:block;font-size:.5em;direction:ltr;unicode-bidi:plaintext;
    margin-top:.14em;letter-spacing:0;white-space:nowrap;color:rgba(0,0,0,.10);
    -webkit-text-stroke:1px rgba(0,0,0,.40);paint-order:stroke fill;
    text-shadow:0 0 12px rgba(255,255,255,.16)}
  /* ===== الكروت الثابتة (تعديل 2026-ز بطلب المستر) =====
     • كارت جديد فوق الشمال: **عريض بس مش طويل** — بيغطي علامة القناة
       (عنوان يوتيوب/اسم القناة) اللي بتظهر فوق الشمال
     • كروت نص اليمين والشمال: **أصغر بكتير** — شكل ووترمارك هادي مش كروت كبيرة */
  /* 0) فوق الشمال — عريض قصير بيغطي علامة القناة (طلب المستر 2026-ز) */
  .wmCardTL{position:absolute;z-index:47;top:2.6%;left:1.8%}
  .wmCardTL .in{display:flex;align-items:center;justify-content:center;gap:9px;min-width:min(52%,560px);max-width:82%;
    background:rgba(0,0,0,.82);border:1px solid rgba(255,255,255,.26);color:#fff;border-radius:10px;
    padding:5px 14px;direction:rtl;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.45)}
  .wmCardTL .nm{font-size:clamp(10px,1.25vw,14px);font-weight:800;unicode-bidi:plaintext;letter-spacing:0;
    text-shadow:0 1px 2px rgba(0,0,0,.8);white-space:nowrap}
  .wmCardTL .sep{opacity:.6;font-size:clamp(9px,1vw,12px)}
  .wmCardTL .ph{font-size:clamp(9px,1.05vw,12px);font-weight:700;direction:ltr;unicode-bidi:plaintext;letter-spacing:0;opacity:.9;white-space:nowrap}
  /* 1) فوق في النص */
  .wmCardTC{position:absolute;z-index:46;top:2.8%;left:50%;transform:translateX(-50%)}
  /* 2) نص الفيديو على اليمين — **مصغّرة** (2026-ز) */
  .wmCardMR{position:absolute;z-index:46;top:50%;right:1.8%;transform:translateY(-50%);opacity:.88}
  /* 3) نص الفيديو على الشمال — **مصغّرة** (2026-ز) */
  .wmCardML{position:absolute;z-index:46;top:50%;left:1.8%;transform:translateY(-50%);opacity:.88}
  /* 4) تحت خالص في النص — فوق شريط الكنترولز بشوية */
  .wmCardBC{position:absolute;z-index:46;bottom:70px;left:50%;transform:translateX(-50%)}
  .wmCardTC .in,.wmCardBC .in{display:inline-block;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.28);
    color:#fff;border-radius:14px;padding:7px 18px;text-align:center;direction:rtl;
    box-shadow:0 8px 26px rgba(0,0,0,.55)}
  /* كروت اليمين/الشمال المصغّرة — شكل ووترمارك صغير شفاف (2026-ز) */
  .wmCardMR .in,.wmCardML .in{display:inline-block;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.16);
    color:rgba(255,255,255,.92);border-radius:999px;padding:2px 10px;text-align:center;direction:rtl;
    box-shadow:none}
  .wmCardTC .nm,.wmCardBC .nm{display:block;font-size:clamp(11px,1.5vw,15px);font-weight:800;unicode-bidi:plaintext;letter-spacing:0;white-space:nowrap;
    text-shadow:0 1px 2px rgba(0,0,0,.8)}
  .wmCardTC .ph,.wmCardBC .ph{display:block;font-size:clamp(9.5px,1.2vw,12px);font-weight:700;direction:ltr;unicode-bidi:plaintext;letter-spacing:0;opacity:.85;margin-top:2px}
  .wmCardMR .nm,.wmCardML .nm{display:block;font-size:clamp(8px,0.95vw,11px);font-weight:700;unicode-bidi:plaintext;letter-spacing:0;white-space:nowrap;
    text-shadow:0 1px 2px rgba(0,0,0,.8)}
  .wmCardMR .ph,.wmCardML .ph{display:block;font-size:clamp(7px,0.8vw,9.5px);font-weight:700;direction:ltr;unicode-bidi:plaintext;letter-spacing:0;opacity:.85;margin-top:1px}
  /* درع فوق — **دايمًا شغال** (مش بس وقت الوقف): بيغطي عنوان يوتيوب/اسم القناة/
     زرار الشير اللي بيظهروا وقت الوقف أو بعد التحوال — بديل القص:
     الفيديو كامل 100% والواجهة مستحيل تبان ولا حد يقدر يدوس عليها */
  #topShield{position:absolute;top:0;left:0;right:0;height:60px;z-index:22;pointer-events:auto;
    background:linear-gradient(to bottom,rgba(0,0,0,.92),rgba(0,0,0,.55) 55%,rgba(0,0,0,0))}
  #fsBtn{position:absolute;bottom:10px;left:10px;z-index:50;width:40px;height:40px;border-radius:10px;border:0;cursor:pointer;
    background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;opacity:.75}
  #fsBtn:hover{opacity:1;background:rgba(0,0,0,.75)}
  /* ===== كنترولز بتاعتنا (بدون أي شكل يوتيوب) ===== */
  #tapLayer{position:absolute;inset:0;z-index:20;background:transparent}
  /* (الكنترولز بقيت بتاعة يوتيوب الأصلية — مفيش شريط تحكم من عندنا:
     قائمة ⚙ الأصلية هي الوحيدة اللي بتغير الجودة فعلًا) */
  /* ===== درع الكابشن (2026-ن — «اعمل للكابشن بلوك») =====
     شريط بلور داكن فوق منطقة الترجمة (أعلى شريط الكنترولز) — أي سطر
     كابشن يحاول يظهر بيتشتت بالبلور وبقى مش مقروء خالص.
     الـ mask بيخلي الحافة العلوية متلاشية بسلاسة — شكله طبيعي مش ملحوظ */
  #capShield{position:absolute;bottom:0;left:0;right:0;z-index:24;height:22%;max-height:140px;pointer-events:none;
    background:linear-gradient(to top,rgba(0,0,0,.55),rgba(0,0,0,.30) 45%,rgba(0,0,0,0) 100%);
    -webkit-backdrop-filter:blur(22px);backdrop-filter:blur(22px);
    -webkit-mask-image:linear-gradient(to top,#000 40%,transparent 100%);mask-image:linear-gradient(to top,#000 40%,transparent 100%)}
  /* زرار ملء الشاشة للمشغل الأصلي — فوق الشمال (ملء الشاشة الأصلي
     ليوتيوب مقفول fs:0 عشان الووترمارك ودرع الكابشن يفضلوا شغالين) */
  #fsBtnYt{position:absolute;bottom:60px;left:10px;z-index:50;width:40px;height:40px;border-radius:10px;border:0;cursor:pointer;
    background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;opacity:.8}
  #fsBtnYt:hover{opacity:1;background:rgba(0,0,0,.75)}
  #startOv{position:absolute;inset:0;z-index:35;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(2,2,8,.96);cursor:pointer}
  #startOv .big{width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;color:#fff}
  #startOv p{color:#fff;font-size:14px;font-weight:700;margin:0;font-family:system-ui,sans-serif}
  #endOv{position:absolute;inset:0;z-index:36;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(2,2,8,.94)}
  #endOv p{color:#fff;font-size:16px;font-weight:800;margin:0;font-family:system-ui,sans-serif}
  #endOv button{padding:10px 20px;border-radius:10px;border:0;background:rgba(255,255,255,.16);color:#fff;font-weight:700;font-size:14px;cursor:pointer}
  /* باتش مكان لوجو/لينك يوتيوب — **فوق شريط الكنترولز** (مش عليه) عشان
     ميغطيش زرار التشغيل في الواجهة الأصلية — بلور + تعتيم خفيف */
  #logoPatch{position:absolute;bottom:60px;right:8px;z-index:26;width:120px;height:38px;border-radius:10px;background:rgba(0,0,0,.55);
    backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);pointer-events:none;display:flex;align-items:center;justify-content:center}
  /* باتش الركن العلوي (فوق يمين) — بيغطي Share/Watch on YouTube بتوع يوتيوب */
  #topRightPatch{position:absolute;top:8px;right:8px;z-index:26;min-width:90px;height:38px;border-radius:10px;background:rgba(0,0,0,.55);
    backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);pointer-events:none;display:flex;align-items:center;justify-content:center;padding:0 12px}
  #logoPatch span,#topRightPatch span{color:rgba(255,255,255,.85);font-size:10.5px;font-weight:700;font-family:system-ui,sans-serif;direction:rtl;white-space:nowrap}
  /* ===== حماية الفحص ===== */
  #devshield{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(5,5,10,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
  #devshield .box{text-align:center;color:#e5e7eb;direction:rtl;padding:24px}
  #devshield .box .ic{font-size:44px;margin-bottom:10px}
  #devshield .box p{font-size:16px;font-weight:700;line-height:2;margin:0}
  #devshield .box small{display:block;margin-top:6px;color:#9ca3af;font-size:12px}
  #toast{position:fixed;top:18px;right:50%;transform:translateX(50%);z-index:10000;background:rgba(20,20,28,.95);color:#fff;
    border:1px solid rgba(255,255,255,.18);padding:10px 18px;border-radius:12px;font-size:13px;font-weight:600;direction:rtl;
    opacity:0;pointer-events:none;transition:opacity .25s;box-shadow:0 6px 24px rgba(0,0,0,.5)}
  #toast.show{opacity:1}
</style>
</head>
<body>
<div id="stage"><div id="wrap"></div></div>
<div id="devshield"><div class="box"><div class="ic">🛡️</div><p>وضع الفحص مش مسموح هنا</p><small>اقفل أدوات المطوّر عشان تكمل مشاهدة الفيديو</small></div></div>
<div id="toast"></div>
<script>
'use strict';
var CFG = __CFG__;
/* ===== أدوات ===== */
var wrap = document.getElementById('wrap');
var toastTimer = null;
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.className='show'; if(toastTimer)clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.className='';},2200); }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ===== فك تشفير معرف اليوتيوب في الذاكرة بس ===== */
function deobfuscate(b64, key){
  try{
    // الإصلاح المهم: السيرفر بيعمل XOR بالبايتات الخام لنص المفتاح نفسه
    // (المفتاح base64url — atob بترفضه وبترجع غلط فالفيديو مش بيفتح أبدًا).
    // بنستخدم نص المفتاح زي ما هو كباد XOR — مطابق تمامًا للسيرفر.
    var kb = String(key), pb = atob(b64), out = '';
    for(var i=0;i<pb.length;i++){ out += String.fromCharCode(pb.charCodeAt(i) ^ kb.charCodeAt(i % kb.length)); }
    return out;
  }catch(e){ return ''; }
}

/* ===== الووترمارك (المواصفات الجديدة 2026-ح — طلب المستر الحرفي) =====
   • **4 كروت ثابتة**: فوق في النص + نص الفيديو يمين وشمال + تحت خالص في النص
   • الووترمارك الكبيرة الشفافة في النص: بتظهر **10 ثواني** وبتختفي **20 ثانية**
     (دورة 30 ثانية — الـ keyframes wmBlink30 في الـ CSS فوق)
   • الاسم من غير قص أي حرف — ممنوع letter-spacing
     وpaint-order:stroke عشان الحواف السودة متاكلش الحروف */
var wmName = String(CFG.wm.name || '').trim();
var wmPhone = String(CFG.wm.phone || '').trim();
/* الاسم الثنائي: أول كلمتين بس — سطر واحد في النص بدل الاسم كله */
function wmShortName(){
  var p = wmName.split(/\\s+/).filter(Boolean);
  return p.slice(0, 2).join(' ');
}
function wmCardHtml(){
  return '<div class="in"><span class="nm">' + esc(wmName || wmPhone) + '</span>' + ((wmName && wmPhone) ? '<span class="ph">' + esc(wmPhone) + '</span>' : '') + '</div>';
}
function buildWm(){
  if(!CFG.wm.enabled) return;
  var old = document.getElementById('wm');
  if(old) old.parentNode.removeChild(old);
  var layer = document.createElement('div');
  layer.id = 'wm'; layer.className = 'wm';
  /* 1) الووترمارك الكبيرة في النص — سطرين: الاسم الثنائي والرقم تحته —
        بتظهر 10 ثواني وبتختفي 20 ثانية (دورة 30 ثانية متكررة) */
  var big1 = wmShortName() || wmPhone;
  if(big1){
    var big = document.createElement('div');
    big.id = 'wmBig';
    var nameLine = '<span class="b1">' + esc(big1) + '</span>';
    /* الرقم تحت الاسم في سطر لوحده — لازم يبان زي ما المستر طلب */
    var numLine = (wmName && wmPhone) ? '<span class="b2">' + esc(wmPhone) + '</span>' : '';
    big.innerHTML = nameLine + numLine;
    var wmo = Math.min(0.6, Math.max(0.3, (Number(CFG.wm.opacity) || 0.55) * 0.85));
    big.style.setProperty('--wmo', String(wmo));
    /* الدورة (10 ثواني ظاهرة / 20 مخفية) بتشتغل **وقت التشغيل بس** —
       بتبدأ واقفة مع الفيديو وأول تشغيل بتكمل (طلب المستر 2026-ل) */
    big.style.animationPlayState = 'paused';
    layer.appendChild(big);
  }
  /* 2) الكروت الأربعة الثابتة (طلب المستر: واحدة فوق في النص، اتنين في النص
        يمين وشمال، وواحدة تحت خالص في النص) — ظاهرة على طول */
  if(wmName || wmPhone){
    var cardHtml = wmCardHtml();
    /* فوق الشمال — عريض قصير، سطر واحد (الاسم • الرقم) — بيغطي علامة
       القناة اللي بتظهر فوق الشمال (طلب المستر 2026-ز) */
    var tl = document.createElement('div'); tl.className = 'wmCardTL';
    tl.innerHTML = '<div class="in"><span class="nm">' + esc(wmName || wmPhone) + '</span>' +
      ((wmName && wmPhone) ? '<span class="sep">•</span><span class="ph">' + esc(wmPhone) + '</span>' : '') + '</div>';
    layer.appendChild(tl);
    var tc = document.createElement('div'); tc.className = 'wmCardTC'; tc.innerHTML = cardHtml; layer.appendChild(tc);
    var mr = document.createElement('div'); mr.className = 'wmCardMR'; mr.innerHTML = cardHtml; layer.appendChild(mr);
    var ml = document.createElement('div'); ml.className = 'wmCardML'; ml.innerHTML = cardHtml; layer.appendChild(ml);
    var bc = document.createElement('div'); bc.className = 'wmCardBC'; bc.innerHTML = cardHtml; layer.appendChild(bc);
  }
  wrap.appendChild(layer);
}
/* درع الشريط العلوي — **دايمًا شغال** بيغطي عنوان يوتيوب/اسم القناة/زرار
   الشير — بديل القص: الفيديو كامل 100% والواجهة مستحيل تبان */
function ensureTopShield(){
  if(document.getElementById('topShield')) return;
  var ts = document.createElement('div'); ts.id='topShield'; wrap.appendChild(ts);
}
/* self-heal: الووترمارك بيرجع يترسم لو حد شاله من الـ DOM */
function ensureWm(){
  if(!CFG.wm.enabled) return;
  if(!document.getElementById('wm')) buildWm();
}
setInterval(ensureWm, 4000);
try{ new MutationObserver(ensureWm).observe(wrap, {childList:true, subtree:true}); }catch(e){}

/* ===== ملء الشاشة (الووترمارك جوه العنصر فبيفضل ظاهر) ===== */
var isFakeFs = false;
var parentFs = false;
/* لو الإناء جوه صفحة المدرسة (iframe) → الأب هو اللي بيكبّر الصندوق على
   الشاشة كلها (حقيقي أو وهمي على آيفون) — إحنا بنبعت له رسالة بس. ده بيخلي
   الفيديو يبان بالعرض 16:9 مالي الشاشة على أي موبايل، من غير حتت سودة */
var EMBEDDED = false;
try { EMBEDDED = !!(window.parent && window.parent !== window); } catch(e) { EMBEDDED = true; }
window.addEventListener('message', function(ev){
  var d = ev.data;
  if(d && d.type === 'mg_fs_state'){ parentFs = !!d.on; layoutWrap(); }
});
function isFs(){ var d=document; return !!(d.fullscreenElement || d.webkitFullscreenElement); }
/* قفل الدوران على العرض — لو اشتغل الجهاز هيلف لوحده، لو فشل الدوران القسري بالـ CSS بياخد مكانه */
function tryLockLs(){ try{ var so=screen.orientation; if(so&&so.lock){ var pr=so.lock('landscape'); if(pr&&pr.catch)pr.catch(function(){}); } }catch(e){} }
function tryUnlockLs(){ try{ var so=screen.orientation; if(so&&so.unlock)so.unlock(); }catch(e){} }
function clearRot(){
  wrap.style.position=''; wrap.style.top=''; wrap.style.left=''; wrap.style.transform='';
  wrap.style.width=''; wrap.style.height='';
}
/* ===== عرض الفيديو **كامل 100% من غير أي قص** (طلب المستر 2026-هـ:
   "الفيديو مش كامل إنت قاصص منه الأطراف — لازم يبان كله") — مفيش أي قص،
   وأي واجهة يوتيوب بتتغطى بالدروع (الدرع العلوي + باتش اللوجو + الووترمارك). */
function layoutWrap(){
  var fs = isFs() || isFakeFs || parentFs;
  if(!fs){
    wrap.className='';
    clearRot();
    tryUnlockLs();
    var w = window.innerWidth, h = window.innerHeight;
    var vw = Math.min(w, 1280);
    var vh = vw * 9 / 16;
    if(vh > h){ vh = h; vw = vh * 16 / 9; }
    wrap.style.width = vw + 'px'; wrap.style.height = vh + 'px';
    return;
  }
  if(parentFs){
    /* الأب هو اللي لفّ الصندوق 90° على الموبايل الطولي — إحنا بنملّي مساحة
       الإناء بس من غير ما ندوّر تاني (الدوران المزدوج بيقلب الفيديو) */
    wrap.className='fs';
    clearRot();
    return;
  }
  tryLockLs();
  wrap.className='fs';
  var W = window.innerWidth, H = window.innerHeight;
  if(H > W){
    /* الموبايل لسه طولي (الدوران التلقائي مقفول مثلاً) → دوران قسري 90°
       عشان الفيديو + الكنترولز + الووترمارك يبانوا بالعرض على الشاشة كلها */
    wrap.style.position='fixed';
    wrap.style.width = H + 'px';
    wrap.style.height = W + 'px';
    wrap.style.top = '50%';
    wrap.style.left = '50%';
    wrap.style.transform = 'translate(-50%,-50%) rotate(90deg)';
  } else {
    clearRot();
  }
}
function toggleFs(){
  /* جوه صفحة المدرسة → الأب هو اللي بيكبّر (يشتغل على كل المتصفحات حتى آيفون) */
  if(EMBEDDED){ try{ window.parent.postMessage({type:'mg_fs_toggle'}, '*'); }catch(e){} return; }
  var d=document;
  if(isFs()){ (d.exitFullscreen||d.webkitExitFullscreen||function(){}).call(d); if(isFakeFs){ isFakeFs=false; wrap.className=''; } setTimeout(layoutWrap,80); return; }
  if(isFakeFs){ isFakeFs=false; wrap.className=''; layoutWrap(); return; }
  var req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
  if(req){ var pr = req.call(wrap); if(pr && pr.catch) pr.catch(function(){ fakeFs(); }); }
  else fakeFs();
  /* إعادة ترتيب بعد لحظة — قفل الدوران ممكن ياخد وقت */
  setTimeout(layoutWrap, 120);
  setTimeout(layoutWrap, 600);
}
function fakeFs(){ isFakeFs = true; wrap.className='fs'; layoutWrap(); }
window.addEventListener('resize', layoutWrap);
window.addEventListener('orientationchange', function(){ setTimeout(layoutWrap, 60); });
document.addEventListener('fullscreenchange', function(){ setTimeout(layoutWrap, 60); setTimeout(layoutWrap, 500); });
document.addEventListener('keydown', function(e){ if(e.key==='Escape' && isFakeFs){ isFakeFs=false; wrap.className=''; layoutWrap(); } });

/* ===== التقدم → postMessage للأب (من غير أي لينك) ===== */
var lastCur = 0;
function reportProgress(cur, dur){
  try{ if(window.parent && window.parent !== window) window.parent.postMessage({type:'mg_vp', videoId:CFG.videoId, cur:cur, dur:dur}, '*'); }catch(e){}
}
function reportEnded(){ try{ if(window.parent && window.parent !== window) window.parent.postMessage({type:'mg_ended', videoId:CFG.videoId}, '*'); }catch(e){} }

/* ===== حماية الفحص + منع الحفظ (أحدث قرار للمستر 2026-م) =====
   • كليك يمين → "🚫 كليك يمين ممنوع"
   • (2026-ن) زرار C بقى حر — الكابشن ممنوع خالص ومفيش زرار يفتحه أصلًا
   • F12 + كل زرار function من F1 لـ F12 **فيهم F10 صراحةً** (طلب المستر
     الحرفي: "explicitly intercept and prevent the F10 key (event.key === 'F10')")
     + Ctrl+Shift+I/J/C/K + Ctrl+U/Ctrl+S + Ctrl+Shift+R/S
     → "الخاصية دي ممنوعة" (مفاتيح متصفح فعلًا وبتنمسك بجد)
   • زرار PrintScreen → محاولة تفريغ الحافظة + رسالة
   • ملاحظة صادقة: اختصارات نظام التشغيل نفسها (Win+Shift+S/R للقص) فوق
     صلاحية أي متصفح — لكن كل اختصارات المتصفح وأدوات المطور مقفولة هنا. */
document.addEventListener('contextmenu', function(e){ e.preventDefault(); toast('🚫 كليك يمين ممنوع'); });
document.addEventListener('dragstart', function(e){ e.preventDefault(); });
document.addEventListener('selectstart', function(e){ if(e.target && e.target.id !== 'toast') e.preventDefault(); });
document.addEventListener('keydown', function(e){
  var k = (e.key || '').toLowerCase();
  /* ملاحظة 2026-ن: زرار C مبقاش ليه أي وظيفة — الكابشن ممنوع خالص
     ومفيش أي طريقة لفتحه (زرار C كان بيفتحه زمان واتشال بطلب المستر).
     Ctrl+Shift+C بتاعة أدوات المطور بيتمسك في فحص أدوات المطور تحت */
  var blocked = false;
  /* F10 صراحةً بـ event.key — طلب المستر الحرفي:
     "explicitly intercept and prevent the F10 key (event.key === 'F10')
     from triggering any browser default behavior" */
  if(e.key === 'F10'){ e.preventDefault(); e.stopPropagation(); toast('🛡️ الخاصية دي ممنوعة'); return; }
  /* F12 + كل زرار function من F1 لـ F12 — **فيهم F10** (طلب المستر الحرفي
     2026-ل: "explicitly block the F10 key") */
  if(k === 'f12' || /^f([1-9]|1[0-2])$/.test(k)) blocked = true;
  if((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) blocked = true;
  if((e.ctrlKey || e.metaKey) && (k === 'u' || k === 's')) blocked = true;
  if((e.metaKey || e.ctrlKey) && e.altKey && (k === 'i' || k === 'j' || k === 'c')) blocked = true;
  if(blocked){ e.preventDefault(); e.stopPropagation(); toast('🛡️ الخاصية دي ممنوعة'); return; }
  /* Ctrl + Shift + R / S — إعادة التحميل العنيدة + حفظ الصفحة/أداة القص */
  if(e.ctrlKey && e.shiftKey && (k === 'r' || k === 's')){
    e.preventDefault(); e.stopPropagation(); toast('🛡️ الخاصية دي ممنوعة'); return;
  }
  /* زرار PrintScreen → تحذير + تفريغ الحافظة */
  if(k === 'printscreen' || e.keyCode === 44){
    toast('🛡️ الخاصية دي ممنوعة');
    try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('🔒 المحتوى محمي').catch(function(){}); }catch(err){}
  }
});
/* (2026-ز) درع الشاشة السودا «المحتوى محمي — السكرين شوت والتسجيل ممنوع»
   اتشال خالص بطلب المستر الصريح — كان بيطلع لوحده أول ما الفيديو يفتح و
   كل دوسة إيقاف/تشغيل (فقدان فوكس عادي للإطار) والمستر قال حرفيًا:
   "لا أنا عاوزك ما تجبهاليش خالص". مفيش أي شاشة فوق الفيديو ولا أي
   إيقاف تلقائي خالص. الحماية الحقيقية دلوقتي: منع الاختصارات والكليك
   يمين + الووترمارك باسم الطالب ورقمه في كل إطار. */
var devOpen = false, wasPlayingBeforeDev = false;
// هنقيس على نافذة التاب العلوية (نفس الدومين فمسموح) — لو قسنا على الـ iframe
// نفسه الفرق الطبيعي بين مقاس الـ iframe والنافذة هيعمل إنذار كاذب
function devDelta(){
  try{
    var top = window.top;
    if(top && top.outerWidth && top.innerWidth){
      return Math.max(top.outerWidth - top.innerWidth, top.outerHeight - top.innerHeight);
    }
  }catch(e){}
  return 0;
}
var devGraceUntil = Date.now() + 2500; // مهلة عند الفتح عشان أي قياس أول تشغيل
setInterval(function(){
  var deltaOk = Date.now() > devGraceUntil && devDelta() > 180;
  if(deltaOk && !devOpen){
    devOpen = true;
    document.getElementById('devshield').style.display = 'flex';
    try{ if(playerApi){ wasPlayingBeforeDev = !playerApi.paused(); playerApi.pause(); } }catch(e){}
    try{ if(fileApi && !fileApi.paused){ wasPlayingBeforeDev = !fileApi.paused; fileApi.pause(); } }catch(e){}
  } else if(!deltaOk && devOpen){
    devOpen = false;
    document.getElementById('devshield').style.display = 'none';
    try{ if(playerApi && wasPlayingBeforeDev) playerApi.play(); }catch(e){}
    try{ if(fileApi && wasPlayingBeforeDev) fileApi.play(); }catch(e){}
  }
}, 1200);

/* ===== مشغّل يوتيوب — بدون أي شكل يوتيوب: كنترولز خاصة بينا + شاشات تغطية
   بتمنع ظهور العنوان/اللوجو نهائيًا. الـ ID بيتفك في الذاكرة بس زي ما هو ===== */
var playerApi = null;
/* ===== رسائل الخطأ + إعادة بناء المشغل (2026-ح — علاج "المشغل بيتجهز ومش بيشتغل") =====
   يوتيوب ساعات بيرفض التشغيل خالص (خطأ auth/153 — حماية ضد البوتات على شبكات
   معينة، أو فيديو اتحظر تضمينه، أو فيديو اتمسح). المشغل القديم كان يفشل
   **بصمت** — الطالب بيضغط ويلقي "المشغل بيتجهز" ومفيش أي رسالة أو حل.
   دلوقتي:
   • onError بيظهر سبب واضح بالعربي فورًا (حظر تضمين / فيديو اتمسح / شبكة)
   • لو يوتيوب رفض على www → بنجرب أوتوماتيك مرة واحدة youtube-nocookie.com
   • زرار "حاول تاني" + نصيحة تغيير الشبكة — مفيش شاشة ميّت من غير كلام */
var ytHostKind = 'www';   /* 'www' | 'nocookie' */
var rebuildTries = 0;     /* عداد إعادة بناء المشغل */
var lastErrCode = '';
var tickStarted = false;  /* مؤقت التقدم يتسجل مرة واحدة بس حتى مع إعادة البناء */
function msgForYtError(code){
  var c = String(code || '');
  if(c === '101' || c === '150') return 'الفيديو مرفوض التشغيل هنا — يا إما صاحب الفيديو قفل التضمين، يا إما يوتيوب مرفض على الشبكة دي. غيّر الشبكة (بيانات الموبايل بدل الواي فاي) وحاول تاني — ولو تكررت بلغ الإدارة في قسم الشكاوى';
  if(c === '100') return 'الفيديو ده اتمسح من يوتيوب أو بقى خاص — بلغ الإدارة في قسم الشكاوى';
  if(c === '2') return 'في مشكلة في تعريف الفيديو نفسه — بلغ الإدارة في قسم الشكاوى';
  if(c === '5' || c === 'auth') return 'يوتيوب مرفض تشغيل الفيديو على الشبكة دي حاليًا — غيّر الشبكة (بيانات الموبايل بدل الواي فاي أو العكس) وحاول تاني';
  return 'يوتيوب مرفض تشغيل الفيديو دلوقتي (كود ' + c + ') — غيّر الشبكة وحاول تاني، ولو تكررت بلغ الإدارة';
}
function showPlayError(msg){
  var so = document.getElementById('startOv');
  if(!so) return;
  so.style.display = 'flex';
  var old = document.getElementById('peBox');
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var box = document.createElement('div');
  box.id = 'peBox';
  box.style.cssText = 'position:relative;z-index:6;background:rgba(127,29,29,.82);border:1px solid rgba(252,165,165,.45);border-radius:14px;padding:14px 18px;max-width:86%;direction:rtl;text-align:center;box-shadow:0 10px 34px rgba(0,0,0,.5)';
  box.innerHTML = '<p style="margin:0 0 10px;color:#fff;font-size:13.5px;font-weight:800;line-height:1.95">' + esc(msg) + '</p>' +
    '<button id="peRetry" type="button" style="background:#fff;color:#18181b;border:0;border-radius:10px;padding:9px 22px;font-weight:800;font-size:13.5px;cursor:pointer;font-family:system-ui,sans-serif">حاول تاني ↻</button>' +
    '<p style="margin:9px 0 0;color:rgba(255,255,255,.78);font-size:11px;line-height:1.8">لو ظهرت الرسالة دي تاني — غيّر الشبكة أو بلغ الإدارة في قسم الشكاوى</p>';
  so.appendChild(box);
  var rb = document.getElementById('peRetry');
  if(rb) rb.addEventListener('click', function(e){ e.stopPropagation(); try{ if(box.parentNode) box.parentNode.removeChild(box); }catch(ex){} retryPlayback(); });
}
function retryPlayback(){
  /* أول إعادة → نفس المضيف بمشغل نظيف. بعدها → nocookie. وأي فشل → الوضع البديل المضمون */
  rebuildThenPlay(rebuildTries === 0 ? 'www' : 'nocookie');
  scheduleFallbackIfStuck();
}
function rebuildThenPlay(kind){
  if(rebuildTries >= 2){
    /* (2026-ط) مفيش شاشة ميّت خلاص — لو يوتيوب مرفض على كل المضيفين
       → الوضع البديل المضمون (مشغل مباشر) والفيديو يشتغل */
    activateFallback('rebuild-limit');
    return;
  }
  rebuildTries++;
  ytHostKind = (kind === 'nocookie') ? 'nocookie' : 'www';
  try{ if(playerApi && playerApi.destroy) playerApi.destroy(); }catch(e){}
  playerApi = null;
  if(wdTimer){ clearInterval(wdTimer); wdTimer = null; }
  var old = document.getElementById('ytHost');
  if(old && old.parentNode) old.parentNode.removeChild(old);
  var crop = document.getElementById('ytCrop');
  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  if(crop) crop.appendChild(host); else wrap.appendChild(host);
  pendingStart = true;
  try{ buildPlayer(); }catch(e){ showPlayError(msgForYtError(lastErrCode || 'auth')); }
}
/* ===== مراقب التشغيل — علاج "الفيديو مش بيفتح" =====
   أول أمر playVideo() على الموبايل ممكن يتصفر من المتصفح. بنجرب تاني كل
   700ms بتدرج قوي: playVideo → playVideo → loadVideoById (ضربة قوية بتقفل
   المشكلة نهائيًا) → playVideo → تشغيل صامت (مسموح دايمًا) + زرار تفعيل صوت.
   ومنع النقر المزدوج: بعض المتصفحات بتبعت touchend+click مع بعض.
   + لو الطالب دس قبل ما الـ API يجهز → الطلب بيتسجل وبيتنفذ أول ما يجهز. */
var wdTimer = null, muteFallback = false, lastTap = 0;
var pendingStart = false, pendingResume = 0, ytIdCached = '';
/* ===== (2026-ط) تحميل API يوتيوب بلا استسلام + الوضع البديل المضمون =====
   المشكلة الحقيقية اللي كانت بتقفل الفيديو خالص: سكريبت يوتيوب لو اتأخر
   أو فشل مرة واحدة، المشغل بيفضل "بيتجهز" للأبد من غير أي رسالة أو حل.
   الحل من مرحلتين:
   1) محاولات تحميل متجددة كل 3 ثواني (بالتبديل بين المضيفين + كسر الكاش)
   2) لو الطالب دس والمشغل ماجاش في 6 ثواني → الوضع البديل المضمون:
      مشغل يوتيوب مباشر (embed) بنفس الحمايات (الووترمارك والدروع فوقه
      وكلها pointer-events:none) — الفيديو يشتغل على أي حال مهما حصل */
var apiTimer = null, apiTries = 0, apiSrcIdx = 0, apiScriptPending = false;
var playerBuilt = false, fallbackActive = false, fallbackTimer = null;
var API_HOSTS = ['https://www.youtube.com/iframe_api', 'https://www.youtube-nocookie.com/iframe_api'];
function apiReadyNow(){
  if(playerBuilt || playerApi) return;
  try{
    buildPlayer();
    playerBuilt = true;
    try{ if(apiTimer){ clearInterval(apiTimer); apiTimer = null; } }catch(e2){}
  }catch(e){ try{ showPlayError('حصل خطأ في تجهيز مشغل يوتيوب — دوس حاول تاني'); }catch(e2){} }
}
function injectApi(bust){
  try{
    if(window.YT && window.YT.Player){ apiReadyNow(); return; }
    apiScriptPending = true;
    var s = document.createElement('script');
    s.src = API_HOSTS[apiSrcIdx % API_HOSTS.length] + (bust ? ('?r=' + Date.now()) : '');
    apiSrcIdx++;
    s.onload = function(){ apiScriptPending = false; if(window.YT && window.YT.Player) apiReadyNow(); };
    s.onerror = function(){ apiScriptPending = false; };
    document.head.appendChild(s);
  }catch(e){ apiScriptPending = false; }
}
function activateFallback(reason){
  if(fallbackActive) return;
  if(CFG.kind !== 'youtube'){ showPlayError('حصل خطأ في تشغيل الفيديو — جرب تاني'); return; }
  fallbackActive = true;
  try{ if(apiTimer){ clearInterval(apiTimer); apiTimer = null; } }catch(e){}
  try{ if(wdTimer){ clearInterval(wdTimer); wdTimer = null; } }catch(e){}
  try{ if(fallbackTimer){ clearTimeout(fallbackTimer); fallbackTimer = null; } }catch(e){}
  var ytId = ytIdCached || deobfuscate(CFG.blob, CFG.key);
  if(!ytId){
    fallbackActive = false;
    showPlayError('مش قادرين نوصل لفيديو يوتيوب دلوقتي — اتأكد من النت وحاول تاني، ولو تكررت بلغ الإدارة في قسم الشكاوى');
    return;
  }
  /* شيل كل الطبقات اللي بتمنع النقر — المشغل المباشر فيه كنترولز يوتيوب نفسه
     (والووترمارك والدروع بيفضلوا فوقه لأنهم pointer-events:none — الحماية ثابتة) */
  var killIds = ['ytHost','ytCrop','startOv','tapLayer','centerOv','endOv','ytCtrl','peBox','unmuteBtn'];
  for(var i=0;i<killIds.length;i++){ try{ var el = document.getElementById(killIds[i]); if(el && el.parentNode) el.parentNode.removeChild(el); }catch(e){} }
  /* (2026-ك) نمسح مرجع المشغل القديم — من غير كده التايمر بيفضل ينادي على
     مشغل اتشال من الـ DOM ويعمّي الكونسول بتحذيرات على الفاضي */
  playerApi = null;
  var startS = Math.max(0, Math.floor(Number(CFG.resume) || 0));
  if(pendingResume > 5) startS = Math.max(startS, Math.floor(pendingResume));
  var f = document.getElementById('ytPlain');
  if(!f){
    f = document.createElement('iframe');
    f.id = 'ytPlain';
    f.setAttribute('allow','autoplay; fullscreen; encrypted-media; picture-in-picture');
    f.setAttribute('allowfullscreen','');
    f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000';
    wrap.appendChild(f);
  }
  /* نفس مواصفات المشغل الأصلي بالظبط: كنترولز يوتيوب + كابشن مقفول +
     ووترمارك ودروع فوقه — بيتشتغل لو الـ API نفسه ماقدرش يتحمل */
  f.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=0&cc_lang_pref=ar&hl=ar&disablekb=1&start=' + startS;
  layoutWrap();
  toast('تمام — الفيديو شغّال دلوقتي ▶');
}
function scheduleFallbackIfStuck(){
  if(fallbackActive || fallbackTimer || CFG.kind !== 'youtube') return;
  fallbackTimer = setTimeout(function(){
    fallbackTimer = null;
    if(playerApi && playerApi.playVideo) return;
    activateFallback('stuck');
  }, 6000);
}
/* ===== الكابشن ممنوع خالص (القرار النهائي للمستر 2026-ن) =====
   طلب المستر الحرفي: «تشيل زرار الكابشن وتشيل الكابشن أصلاً — اعمل للكابشن
   بلوك.. أنا مش عايز أي كتابة تظهر تحت الفيديو عشان بتشتت الطالب».
   التنفيذ على 4 طبقات:
   1) cc_load_policy=0 + hl=ar + cc_lang_pref=ar → مفيش ترجمة افتراضيًا
      حتى لو حساب يوتيوب بتاع المشاهد فاتح «الترجمة دايمًا» من إعداداته
   2) killCaptions() مع كل تغيير حالة + دوريًا كل 5 ثواني:
      تحميل-ثم-شيل موديول الترجمة بيقتل ترجمة ASR التلقائية كمان
      (اللي getOption مش بيشوفها فبيبان كأن «مفيش ترجمة» وهي ظاهرة)
   3) درع الكابشن (capShield): شريط بلور داكن فوق منطقة الترجمة —
      أي سطر يحاول يظهر بيبقى مش مقروء خالص
   4) مفيش زرار CC في أي واجهة ومفيش زرار C في الكيبورد — مفيش أي طريق
      لفتح الترجمة أصلًا */
function killCaptions(){
  try{ playerApi.loadModule && playerApi.loadModule('captions'); }catch(e){}
  try{ playerApi.unloadModule && playerApi.unloadModule('captions'); }catch(e){}
  try{ playerApi.setOption && playerApi.setOption('captions','track',{}); }catch(e){}
}
var lastCapCheck = 0;
function tapOk(){ var n = Date.now(); if(n - lastTap < 350) return false; lastTap = n; return true; }
function showUnmuteBtn(){
  var b = document.getElementById('unmuteBtn');
  if(!b){
    b = document.createElement('button');
    b.id = 'unmuteBtn'; b.type = 'button';
    b.style.cssText = 'position:absolute;top:38%;left:50%;transform:translateX(-50%);z-index:70;direction:rtl;' +
      'background:rgba(0,0,0,.8);border:1px solid rgba(255,255,255,.25);color:#fff;font-weight:700;' +
      'font-size:13px;font-family:system-ui,sans-serif;padding:10px 18px;border-radius:999px;cursor:pointer;box-shadow:0 6px 22px rgba(0,0,0,.55)';
    b.textContent = '🔊 اضغط لتفعيل الصوت';
    b.addEventListener('click', function(e){ e.stopPropagation(); doUnmute(); });
    b.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); doUnmute(); });
    wrap.appendChild(b);
  }
  b.style.display = 'flex';
}
function doUnmute(){
  try{ if(playerApi){ playerApi.unMute(); playerApi.setVolume && playerApi.setVolume(100); } }catch(e){}
  muteFallback = false;
  var b = document.getElementById('unmuteBtn'); if(b) b.style.display = 'none';
}
function startWithWatchdog(){
  if(!playerApi || !playerApi.playVideo){
    /* الـ API لسه بيتحمل — سجل الطلب وهيتشغل أول ما يجهز (بدل ما أول دوسة تضيع)
       + (2026-ط) نضغط على التحميل فورًا، ولو بعد 6 ثواني مفيش API → الوضع
       البديل المضمون — ممنوع إن الطالب يفضل دايس على طول من غير فيديو */
    pendingStart = true;
    toast('المشغل بيتجهز… ثواني ونشغّله');
    try{ injectApi(true); }catch(e){}
    scheduleFallbackIfStuck();
    return;
  }
  if(wdTimer){ clearInterval(wdTimer); wdTimer = null; }
  try{ playerApi.playVideo(); }catch(e){}
  var attempts = 0;
  wdTimer = setInterval(function(){
    var st = ytState();
    if(st === 1 || st === 3){ clearInterval(wdTimer); wdTimer = null; return; }
    attempts++;
    if(attempts === 3){
      /* الضربة القوية: loadVideoById بيحمّل التيار من الأول وبيشتغل فورًا —
         أقوى بكتير من playVideo في المتصفحات العنيدة */
      var cur = 0; try{ cur = playerApi.getCurrentTime() || 0; }catch(e){}
      try{ playerApi.loadVideoById(ytIdCached, Math.max(0, Math.floor(cur)), 'hd720'); }catch(e){}
    } else if(attempts === 5){
      try{ playerApi.mute(); muteFallback = true; showUnmuteBtn(); playerApi.playVideo(); }catch(e){}
    } else if(attempts >= 7){
      /* المشغل لسه واقف بعد كل المحاولات → يوتيوب غالبًا رافض التشغيل أصلاً.
         (2026-ط) ممنوع الشاشة الميّتة: محاولة nocookie أوتوماتيك، ولو فشلت
         → الوضع البديل المضمون مباشرة — الفيديو لازم يشتغل */
      clearInterval(wdTimer); wdTimer = null;
      var ec = '';
      try{ ec = String((playerApi.getVideoData && playerApi.getVideoData().errorCode) || ''); }catch(e){}
      if(ec) lastErrCode = ec;
      if(ytHostKind === 'www' && rebuildTries < 1){ rebuildThenPlay('nocookie'); return; }
      activateFallback('yt-refused');
    } else { try{ playerApi.playVideo(); }catch(e){} }
  }, 700);
}
function ytState(){ try{ return playerApi && playerApi.getPlayerState ? playerApi.getPlayerState() : -1; }catch(e){ return -1; } }
/* دورة الووترمارك الكبيرة (10 ظاهرة / 20 مخفية) بتشتغل وقت التشغيل بس —
   عند الإيقاف بتتوقف مؤقتًا ومتكملش (طلب المستر 2026-ل) */
function wmRun(onoff){ try{ var w=document.getElementById('wmBig'); if(w) w.style.animationPlayState = onoff ? 'running' : 'paused'; }catch(e){} }
function mountYouTube(){
  var ytId = deobfuscate(CFG.blob, CFG.key);
  if(!ytId){ wrap.innerHTML = '<p style="color:#fca5a5;font-family:sans-serif;padding:24px;direction:rtl">حصل خطأ في تحميل الفيديو</p>'; return; }
  /* **الوضع الأصلي بكامل كنترولز يوتيوب** (القرار النهائي 2026-ن):
     قائمة ⚙ الأصلية هي الوحيدة اللي بتبدّل التيار **فعليًا** — الطالب
     يختار 1080p ويوتيوب بيجيبه بجد (كل دوال الجودة في الـ API بيتجاهلها
     يوتيوب من 2023 وده سبب «مختار 1080 وبتثبت على 360»).
     الفيديو كامل 100% من غير أي قص — واجهة يوتيوب بتتغطى بالدروع
     (topShield/logoPatch/الوترمارك/درع الكابشن) مش بقص أطراف الفيديو */
  var host = document.createElement('div');
  host.id = 'ytHost';
  host.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000';
  wrap.appendChild(host);
  /* درع الكابشن — ممنوع أي كتابة تحت الفيديو (قرار المستر النهائي 2026-ن) */
  var cs = document.createElement('div'); cs.id = 'capShield'; wrap.appendChild(cs);
  // شاشة البداية — **صورة الفيديو الحقيقية من يوتيوب** (بتغطي أي عنوان/
  // برanding بتاع يوتيوب لحظة التحميل) + دوسة الطالب = إذن تشغيل بالصوت
  var startOv = document.createElement('div');
  startOv.id='startOv';
  startOv.innerHTML = '<img src="https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg" ' +
    'onerror="this.onerror=null;this.src=\\'https://i.ytimg.com/vi/' + ytId + '/hqdefault.jpg\\';" ' +
    'alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;' +
    'filter:brightness(.34) saturate(.92);pointer-events:none">' +
    '<div class="big" style="position:relative"><svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></div><p style="position:relative">اضغط للمشاهدة</p>';
  startOv.addEventListener('click', function(){ if(!tapOk()) return; startWithWatchdog(); });
  startOv.addEventListener('touchend', function(e){ e.preventDefault(); if(!tapOk()) return; startWithWatchdog(); });
  wrap.appendChild(startOv);
  // زرار ملء الشاشة بتاعنا — فوق الشمال. ملء الشاشة الأصلي ليوتيوب مقفول
  // (fs:0) عشان الووترمارك ودرع الكابشن يفضلوا شغالين جوه ملء الشاشة
  var fsb = document.createElement('button');
  fsb.id = 'fsBtnYt'; fsb.type = 'button'; fsb.setAttribute('aria-label','ملء الشاشة');
  fsb.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  fsb.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); toggleFs(); });
  wrap.appendChild(fsb);
  // باتش مكان لوجو يوتيوب — **فوق شريط الكنترولز** (مش عليه عشان ميغطيش
  // زرار التشغيل الأصلي) — بلور + تعتيم + ووترمارك مكانه
  var patch = document.createElement('div'); patch.id='logoPatch';
  patch.innerHTML = '<span>🔒 محتوى محمي</span>';
  wrap.appendChild(patch);
  // باتش الركن العلوي (فوق يمين) — طلب المستر 2026-ز: علامة الشير و
  // "Watch on YouTube" **متشالوش ولا حد يقدر يدوس عليهم**
  var trp = document.createElement('div'); trp.id='topRightPatch';
  trp.innerHTML = '<span>🔒 محتوى محمي</span>';
  wrap.appendChild(trp);
  // شاشة النهاية (بتغطي شاشة يوتيوب النهائية بالعنوان والاقتراحات)
  var endOv = document.createElement('div'); endOv.id='endOv';
  endOv.innerHTML = '<p>🎉 خلصت الفيديو — برافو عليك!</p><button type="button" id="replayBtn">شوفه تاني ↺</button>';
  wrap.appendChild(endOv);
  document.getElementById('replayBtn').addEventListener('click', function(e){ e.stopPropagation(); try{ playerApi.seekTo(0,true); playerApi.playVideo(); }catch(err){} });
  /* (2026-ط) تحميل API يوتيوب بلا استسلام: الكولباك بيتحدد قبل حقن السكريبت
     (قفل سباق التحميل)، والتحميل بيتجدد كل 3 ثواني بالتبديل بين المضيفين
     (www ↔ nocookie) مع كسر الكاش — مفيش "بيتجهز للأبد" خالص: إما API يجهز
     أو الوضع البديل المضمون (iframe مباشر بنفس المواصفات) يشتغل تلقائيًا */
  ytIdCached = ytId;
  window.onYouTubeIframeAPIReady = apiReadyNow;
  if(window.YT && window.YT.Player){ apiReadyNow(); }
  injectApi(false);
  if(apiTimer){ clearInterval(apiTimer); }
  apiTries = 0;
  apiTimer = setInterval(function(){
    if(playerApi || fallbackActive){ if(apiTimer){ clearInterval(apiTimer); apiTimer = null; } return; }
    apiTries++;
    injectApi((apiTries % 2) === 0);
    if(apiTries === 4){
      var so = document.getElementById('startOv');
      if(so){
        var pm = so.getElementsByTagName('p')[0];
        if(pm) pm.textContent = 'الاتصال بطيء — دوس تاني وهيشتغل خلال لحظات';
      }
    }
  }, 3000);
}

function buildPlayer(){
  var ytId = ytIdCached;
  var popts = {
    videoId: ytId,
    width: '100%',
    height: '100%',
    /* **الوضع الأصلي بكامل كنترولز يوتيوب** (القرار النهائي 2026-ن):
       controls:1 → قائمة ⚙ الأصلية هي الوحيدة اللي بتبدّل التيار فعليًا
       (الطالب يختار 1080p → يوتيوب يجيبه بجد). إحنا بنستخدم الـ JS API
       بس للتقدم/التكملة/إبادة الكابشن — مفيش أي قائمة جودة من عندنا.
       fs:0 → ملء الشاشة الأصلي مقفول عشان الووترمارك ودرع الكابشن
       يفضلوا شغالين جوه ملء الشاشة (الزرار بتاعنا fsBtnYt فوق الشمال).
       disablekb:1 → بيقفل اختصارات كيبورد يوتيوب نفسها — وفيهم زرار C
       بتاع الترجمة! فمفيش أي طريق لفتح الكابشن من الكيبورد كمان */
    playerVars: { autoplay:1, controls:1, rel:0, modestbranding:1, playsinline:1, iv_load_policy:3, cc_load_policy:0, cc_lang_pref:'ar', hl:'ar', fs:0, disablekb:1, enablejsapi:1, origin: location.origin },
    events: {
      onReady: function(ev){
        /* تكملة المشاهدة بنأجلها لأول لحظة تشغيل فعلية — أعلى أمان على الموبايل
           (الـ seek قبل التشغيل كان بعلّق المشغل في حالة cued على بعض الأجهزة) */
        try{ if(Number(CFG.resume) > 5) pendingResume = Number(CFG.resume); }catch(e){}
        killCaptions();
        if(pendingStart){ pendingStart = false; startWithWatchdog(); }
        layoutWrap();
      },
      onStateChange: function(ev){
        try{
          if(ev.data === YT.PlayerState.PLAYING){
            /* أول تشغيل → كمّل من آخر نقطة وصلها الطالب.
               أمان: لو النقطة المحفوظة قربت من النهاية (حتى 999999 بتاعت "خلص") → نبدأ من الأول
               عشان الفيديو ميفضلش بيدور في حلقة النهاية */
            if(pendingResume > 5){
              var rd = 0; try{ rd = playerApi.getDuration() || 0; }catch(e){}
              var posR = pendingResume;
              if(rd && posR >= rd - 5) posR = 0;
              if(posR > 0){ try{ playerApi.seekTo(posR, true); }catch(e){} }
              pendingResume = 0;
            }
            /* الكابشن ممنوع خالص — إبادة فورية مع كل تشغيل (قرار 2026-ن) */
            killCaptions();
            /* دورة الووترمارك الكبيرة بتشتغل مع التشغيل */
            wmRun(true);
            var so=document.getElementById('startOv'); if(so) so.style.display='none';
            var eo=document.getElementById('endOv'); if(eo) eo.style.display='none';
          } else if(ev.data === YT.PlayerState.PAUSED){
            wmRun(false);
            killCaptions();
          } else if(ev.data === YT.PlayerState.ENDED){
            wmRun(false);
            var eo2=document.getElementById('endOv'); if(eo2) eo2.style.display='flex';
            /* رجوع للبداية + وقوف → شاشة اقتراحات يوتيوب عمرها ما بتترسم */
            try{ playerApi.seekTo(0,true); playerApi.pauseVideo(); }catch(e){}
            reportEnded();
          }
        }catch(e){}
      },
      onApiChange: function(){
        /* أول ما موديول الترجمة يتجهز → بيتإباد فورًا (الكابشن ممنوع خالص) */
        killCaptions();
      },
      onError: function(ev){
        /* يوتيوب رفض الفيديو نفسه — ممنوع الصمت: سبب واضح فورًا.
           100 = الفيديو اتمسح/خاص. 2 = تعريف غلط → رسالة فورية (إعادة مش هتنفع).
           101/150/5/auth = منع تضمين أو رفض شبكة (حماية ضد البوتات بترجع 150
           برضه) → محاولة أوتوماتيك واحدة على youtube-nocookie، وبعدها
           **الوضع البديل المضمون (مشغل مباشر embed)** — الفيديو يشتغل على أي حال
           بدل شاشة الخطأ الميّتة (2026-ط) */
        var code = '';
        try{ code = String((ev && ev.data) || ''); }catch(e){}
        lastErrCode = code;
        if(wdTimer){ clearInterval(wdTimer); wdTimer = null; }
        if(code === '100' || code === '2'){ showPlayError(msgForYtError(code)); return; }
        if(ytHostKind === 'www' && rebuildTries < 1){ rebuildThenPlay('nocookie'); return; }
        activateFallback('on-error-' + (code || 'auth'));
      }
    }
  };
  /* المحاولة الثانية بتتم على youtube-nocookie.com — مضيف تاني بيتجاوز بعض
     حالات الرفض (خطأ 153/auth) بنفس الـ API بالظبط */
  if(ytHostKind === 'nocookie') popts.host = 'https://www.youtube-nocookie.com';
  playerApi = new YT.Player('ytHost', popts);
  /* مؤقت التقدم/الجودة — مرة واحدة بس حتى لو المشغل اتبنى من جديد */
  if(!tickStarted){
    tickStarted = true;
    setInterval(function(){
    try{
      if(playerApi && playerApi.getCurrentTime){
        var cur = playerApi.getCurrentTime() || 0, dur = playerApi.getDuration() || 0;
        reportProgress(cur, dur);
        /* حارس النهاية: لو شاشة الاقتراحات هتظهر (ENDED ماتفوتش) → غطّي فورًا */
        if(ytState()===0){
          var eo3=document.getElementById('endOv');
          if(eo3 && eo3.style.display!=='flex'){ eo3.style.display='flex'; try{ playerApi.seekTo(0,true); playerApi.pauseVideo(); }catch(e){} reportEnded(); }
        }
        /* الكابشن ممنوع خالص — إبادة دورية كل 5 ثواني (بتقتل ترجمة ASR كمان):
           حتى لو يوتيوب حاول يطلّع أي سطر، بيتشال فورًا + درع الكابشن
           (capShield) متبلور فوق منطقته فمستحيل يتقري */
        var capNow = Math.floor(Date.now() / 5000);
        if(capNow !== lastCapCheck){
          lastCapCheck = capNow;
          killCaptions();
        }
      }
    }catch(e){}
    }, 1000);
  }
}

/* ===== مشغّل الملفات المرفوعة (توكن موقّع قصير العمر) ===== */
var fileApi = null;
function mountFile(){
  var v = document.createElement('video');
  v.id = 'fileVid'; v.controls = true; v.playsInline = true;
  v.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback nofullscreen');
  v.setAttribute('disablePictureInPicture', '');
  v.setAttribute('disableRemotePlayback', '');
  v.src = CFG.fileUrl;
  /* الكابشن ممنوع خالص في الملفات كمان (القرار النهائي 2026-ن):
     أي ترجمات مدمجة في الملف بتتفعل OFF قسريًا — ولو track اتضاف بعد كده
     بيتقفل لوحده — ومفيش زرار CC أصلًا ومفيش أي طريقة لتشغيلها */
  function killTracks(){
    try{ var tt = v.textTracks; for(var i=0;i<tt.length;i++){ tt[i].mode = 'disabled'; } }catch(e){}
  }
  v.addEventListener('loadedmetadata', killTracks);
  try{ if(v.textTracks && v.textTracks.addEventListener) v.textTracks.addEventListener('addtrack', killTracks); }catch(e){}
  if(CFG.resume > 5) v.addEventListener('loadedmetadata', function(){ try{ v.currentTime = CFG.resume; }catch(e){} });
  v.addEventListener('timeupdate', function(){
    lastCur = v.currentTime;
    if(Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 0) reportProgress(v.currentTime, v.duration || 0);
  });
  v.addEventListener('ended', function(){ reportEnded(); });
  /* دورة الووترمارك الكبيرة (10 ظاهرة / 20 مخفية) بتتبع التشغيل في ملفات الفيديو كمان */
  function wmRun(onoff){ try{ var w=document.getElementById('wmBig'); if(w) w.style.animationPlayState = onoff ? 'running' : 'paused'; }catch(e){} }
  v.addEventListener('play', function(){ wmRun(true); });
  v.addEventListener('pause', function(){ wmRun(false); });
  v.addEventListener('ended', function(){ wmRun(false); });
  wrap.appendChild(v);
  fileApi = v;
  var btn = document.createElement('button');
  btn.id = 'fsBtn'; btn.type = 'button'; btn.setAttribute('aria-label','ملء الشاشة');
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  btn.addEventListener('click', function(e){ e.stopPropagation(); toggleFs(); });
  wrap.appendChild(btn);
  /* (2026-ن) زرار CC للملفات اتشال خالص بطلب المستر — الكابشن ممنوع
     نهائيًا: killTracks فوق بيقتل أي ترجمة مدمجة ومفيش أي طريق لتشغيلها */
}

/* ===== تشغيل ===== */
buildWm();
ensureTopShield();
layoutWrap();
if(CFG.kind === 'youtube') mountYouTube(); else if(CFG.kind === 'file') mountFile();

/* زرار ملء الشاشة للملفات (ليوتيوب الزرار جوه الكنترولز بتاعته) */
if(CFG.kind === 'file'){
  /* mounted جوه mountFile */
}
if(CFG.kind === 'youtube'){
  wrap.addEventListener('dblclick', function(){ toggleFs(); });
}
</script>
</body>
</html>`
