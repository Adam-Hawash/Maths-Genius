/* ============================================================
   player-config — إعدادات شكل المشغل والووترمارك (MG-2 + MG-3)
   ============================================================
   الكونفج كله متخزن في جدول SiteConfig بالمفتاح 'player_config'
   كـ JSON — بيتقرأ في صفحة المشغل (/api/player/[ticket]) عند كل
   رندر وبيطبق: أطوال الشريط + خريطة الووترمارك كاملة.
   - لو مفيش كونفج محفوظ → FALLBACK_PLAYER_CONFIG = سلوك MG-1
     بالظبط (شريط 36/40 + كارتين QR فوق شمال وتحت يمين بس).
   - الافتراضي اللي بيبدأ بيه صاحب المنصة في لوحة التحكم =
     DEFAULT_PLAYER_CONFIG (شريط 40/46 + QR فوق شمال وتحت يمين
     + اسم ورقم فوق في النص وتحت في النص + لوجو المنصة في النص
     مكتوب عليه اسم الطالب ورقمه «زي الأول»).
   ============================================================
   (MG-3 — طلب المستر الجديد):
   • blink لكل عنصر: يظهر X ثانية ويختفي Y ثانية على طول —
     «أنا عاوز أتحكم في المدة بتاعة اختفائها»
   • محتوى اللوجو الوسطاني: لوجو بس / اسم ورقم بس / الاتنين —
     «الووترمارك اللي في النص مش مكتوب فيها اسم الطالب ورقم تليفونه زي الأول»
   • علامة يوتيوب في الشريط: تشغيل/إيقاف + حجم — «علامة يوتيوب تكبرها سنة بس»
   ============================================================ */

export type WmSize = 'sm' | 'md' | 'lg'

/* دورة الظهور والاختفاء (ثواني) — show = ظاهر، hide = مخفي
   (hide = 0 أو on = false → العنصر ثابت ظاهر على طول) */
export interface WmBlink {
  on: boolean
  show: number /* 1..120 ثانية */
  hide: number /* 0..120 ثانية */
}

/* كارت QR الطالب (بيتولد في السيرفر باسمه ورقمه) */
export interface WmQrItem {
  on: boolean
  x: number /* % من عرض الفيديو — مركز العنصر */
  y: number /* % من ارتفاع الفيديو — مركز العنصر */
  size: WmSize
  opacity: number /* 0.05 - 0.6 */
  blink: WmBlink
}

/* عنصر اسم الطالب + رقمه (بيترسم ديناميكيًا لكل طالب) */
export interface WmNameItem {
  id: string
  x: number
  y: number
  size: WmSize
  opacity: number
  blink: WmBlink
}

/* لوجو المنصة في نص الفيديو — محتواه قابل للتحكم (MG-3):
   brand = «Math Genius» بس | name = اسم الطالب ورقمه بس | both = الاتنين */
export type WmLogoContent = 'brand' | 'name' | 'both'

export interface WmLogoItem {
  on: boolean
  x: number
  y: number
  size: WmSize
  opacity: number /* 0.03 - 0.4 */
  content: WmLogoContent
  blink: WmBlink
}

/* علامة اليوتيوب في شريط التحكم (ديكور — مفيش لينك) */
export interface WmYtMark {
  on: boolean
  size: WmSize
}

export interface PlayerConfig {
  v: 1
  barHeightMobile: number /* px — 32..64 */
  barHeightDesktop: number /* px — 36..72 */
  topShieldHeight: number /* px — 40..96 (0 = المعادلة القديمة) */
  qrTL: WmQrItem
  qrBR: WmQrItem
  nameItems: WmNameItem[]
  centerLogo: WmLogoItem
  ytMark: WmYtMark
}

export const WM_SIZES: WmSize[] = ['sm', 'md', 'lg']

export function clampNum(v: any, min: number, max: number, fallback: number): number {
  const n = Number(v)
  if (!isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function clampSize(v: any, fallback: WmSize = 'md'): WmSize {
  return v === 'sm' || v === 'md' || v === 'lg' ? v : fallback
}

export function clampOpacity(v: any, min: number, max: number, fallback: number): number {
  const n = Number(v)
  if (!isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100))
}

/* تنظيف دورة الظهور/الاختفاء — المستر طلب التحكم في «مدة اختفائها»
   (لو الكونفج القديم من غير blink أصلًا → بياخد افتراضي العنصر كامل —
   عشان اللوجو الوسطاني يرجع لدورته «زي الأول» 10 ظاهر / 20 مخفي) */
export function clampBlink(v: any, fallback: WmBlink): WmBlink {
  if (!v || typeof v !== 'object') return { ...fallback }
  return {
    on: typeof v.on === 'boolean' ? v.on : fallback.on,
    show: clampNum(v.show, 1, 120, fallback.show),
    hide: clampNum(v.hide, 0, 120, fallback.hide),
  }
}

/* الافتراضي المقترح لصاحب المنصة (QR فوق شمال وتحت يمين + اسم ورقم فوق
   وتحت في النص + لوجو المنصة في النص مكتوب عليه اسم الطالب ورقمه —
   اللوجو الوسطاني بيلتزم دورةMG القديمة: ظاهر 10 ثواني ومختفي 20 ثانية) */
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  v: 1,
  barHeightMobile: 40,
  barHeightDesktop: 46,
  topShieldHeight: 60,
  qrTL: { on: true, x: 7, y: 6, size: 'md', opacity: 0.26, blink: { on: false, show: 15, hide: 15 } },
  qrBR: { on: true, x: 93, y: 84, size: 'md', opacity: 0.26, blink: { on: false, show: 15, hide: 15 } },
  nameItems: [
    { id: 'nm-top', x: 50, y: 11, size: 'md', opacity: 0.3, blink: { on: false, show: 15, hide: 15 } },
    { id: 'nm-bottom', x: 50, y: 80, size: 'md', opacity: 0.3, blink: { on: false, show: 15, hide: 15 } },
  ],
  centerLogo: { on: true, x: 50, y: 44, size: 'lg', opacity: 0.14, content: 'both', blink: { on: true, show: 10, hide: 20 } },
  ytMark: { on: true, size: 'lg' },
}

/* احتياط المشغل لو مفيش كونفج محفوظ = سلوك MG-1 بالظبط عشان مفيش حاجة تتبوظ */
export const FALLBACK_PLAYER_CONFIG: PlayerConfig = {
  v: 1,
  barHeightMobile: 36,
  barHeightDesktop: 40,
  topShieldHeight: 0,
  qrTL: { on: true, x: 6, y: 6, size: 'md', opacity: 0.26, blink: { on: false, show: 15, hide: 15 } },
  qrBR: { on: true, x: 94, y: 84, size: 'md', opacity: 0.26, blink: { on: false, show: 15, hide: 15 } },
  nameItems: [],
  centerLogo: { on: false, x: 50, y: 46, size: 'lg', opacity: 0.14, content: 'both', blink: { on: false, show: 10, hide: 20 } },
  ytMark: { on: true, size: 'lg' },
}

/* تنظيف أي JSON جاي من قاعدة البيانات أو من الـ API — أي قيمة ناقصة أو غلط ترجع للافتراضي */
export function sanitizePlayerConfig(raw: any): PlayerConfig {
  var d = DEFAULT_PLAYER_CONFIG
  var fb = FALLBACK_PLAYER_CONFIG
  var src = raw && typeof raw === 'object' ? raw : {}
  var out: PlayerConfig = {
    v: 1,
    barHeightMobile: clampNum(src.barHeightMobile, 32, 64, d.barHeightMobile),
    barHeightDesktop: clampNum(src.barHeightDesktop, 36, 72, d.barHeightDesktop),
    topShieldHeight: clampNum(src.topShieldHeight, 0, 96, d.topShieldHeight),
    qrTL: sanitizeQr(src.qrTL, d.qrTL),
    qrBR: sanitizeQr(src.qrBR, d.qrBR),
    nameItems: [],
    centerLogo: sanitizeLogo(src.centerLogo, d.centerLogo),
    ytMark: sanitizeYtMark(src.ytMark, (raw && raw.__fallback ? fb : d).ytMark),
  }
  var items = Array.isArray(src.nameItems) ? src.nameItems : []
  for (var i = 0; i < items.length && out.nameItems.length < 6; i++) {
    var it = items[i]
    if (!it || typeof it !== 'object') continue
    out.nameItems.push({
      id: String(it.id || 'nm-' + (i + 1)).slice(0, 24),
      x: clampNum(it.x, 0, 100, 50),
      y: clampNum(it.y, 0, 100, 10),
      size: clampSize(it.size, 'md'),
      opacity: clampOpacity(it.opacity, 0.05, 0.6, 0.3),
      blink: clampBlink(it.blink, { on: false, show: 15, hide: 15 }),
    })
  }
  if (!out.nameItems.length && items.length === 0 && raw && raw.__fallback) {
    /* الاحتياط بيرجع لسلوك MG-1 من غير عناصر اسم */
    out.nameItems = []
    out.centerLogo = sanitizeLogo(raw.centerLogo, fb.centerLogo)
  }
  return out
}

function sanitizeQr(v: any, d: WmQrItem): WmQrItem {
  var src = v && typeof v === 'object' ? v : {}
  return {
    on: src.on !== false,
    x: clampNum(src.x, 0, 100, d.x),
    y: clampNum(src.y, 0, 100, d.y),
    size: clampSize(src.size, d.size),
    opacity: clampOpacity(src.opacity, 0.05, 0.6, d.opacity),
    blink: clampBlink(src.blink, d.blink),
  }
}

function sanitizeLogo(v: any, d: WmLogoItem): WmLogoItem {
  var src = v && typeof v === 'object' ? v : {}
  return {
    on: src.on === true,
    x: clampNum(src.x, 0, 100, d.x),
    y: clampNum(src.y, 0, 100, d.y),
    size: clampSize(src.size, d.size),
    opacity: clampOpacity(src.opacity, 0.03, 0.4, d.opacity),
    content: src.content === 'brand' || src.content === 'name' || src.content === 'both' ? src.content : d.content,
    blink: clampBlink(src.blink, d.blink),
  }
}

function sanitizeYtMark(v: any, d: WmYtMark): WmYtMark {
  var src = v && typeof v === 'object' ? v : {}
  return {
    on: src.on !== false,
    size: clampSize(src.size, d.size),
  }
}
