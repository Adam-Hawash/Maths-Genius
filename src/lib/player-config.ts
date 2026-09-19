/* ============================================================
   player-config — إعدادات شكل المشغل والووترمارك (MG-2)
   ============================================================
   الكونفج كله متخزن في جدول SiteConfig بالمفتاح 'player_config'
   كـ JSON — بيتقرأ في صفحة المشغل (/api/player/[ticket]) عند كل
   رندر وبيطبق: أطوال الشريط + خريطة الووترمارك كاملة.
   - لو مفيش كونفج محفوظ → FALLBACK_PLAYER_CONFIG = سلوك MG-1
     بالظبط (شريط 36/40 + كارتين QR فوق شمال وتحت يمين بس).
   - الافتراضي اللي بيبدأ بيه صاحب المنصة في لوحة التحكم =
     DEFAULT_PLAYER_CONFIG (شريط 40/46 + QR فوق شمال وتحت يمين
     + اسم ورقم فوق في النص وتحت في النص + لوجو المنصة في النص).
   ============================================================ */

export type WmSize = 'sm' | 'md' | 'lg'

/* كارت QR الطالب (بيتولد في السيرفر باسمه ورقمه) */
export interface WmQrItem {
  on: boolean
  x: number /* % من عرض الفيديو — مركز العنصر */
  y: number /* % من ارتفاع الفيديو — مركز العنصر */
  size: WmSize
  opacity: number /* 0.05 - 0.6 */
}

/* عنصر اسم الطالب + رقمه (بيترسم ديناميكيًا لكل طالب) */
export interface WmNameItem {
  id: string
  x: number
  y: number
  size: WmSize
  opacity: number
}

/* لوجو المنصة في نص الفيديو («Math Genius») */
export interface WmLogoItem {
  on: boolean
  x: number
  y: number
  size: WmSize
  opacity: number /* 0.03 - 0.4 */
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

/* الافتراضي المقترح لصاحب المنصة (زي ما طلب: QR فوق شمال وتحت يمين +
   اسم ورقم فوق في النص وتحت في النص + لوجو المنصة في النص) */
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  v: 1,
  barHeightMobile: 40,
  barHeightDesktop: 46,
  topShieldHeight: 60,
  qrTL: { on: true, x: 7, y: 6, size: 'md', opacity: 0.26 },
  qrBR: { on: true, x: 93, y: 84, size: 'md', opacity: 0.26 },
  nameItems: [
    { id: 'nm-top', x: 50, y: 11, size: 'md', opacity: 0.3 },
    { id: 'nm-bottom', x: 50, y: 80, size: 'md', opacity: 0.3 },
  ],
  centerLogo: { on: true, x: 50, y: 44, size: 'lg', opacity: 0.14 },
}

/* احتياط المشغل لو مفيش كونفج محفوظ = سلوك MG-1 بالظبط عشان مفيش حاجة تتبوظ */
export const FALLBACK_PLAYER_CONFIG: PlayerConfig = {
  v: 1,
  barHeightMobile: 36,
  barHeightDesktop: 40,
  topShieldHeight: 0,
  qrTL: { on: true, x: 6, y: 6, size: 'md', opacity: 0.26 },
  qrBR: { on: true, x: 94, y: 84, size: 'md', opacity: 0.26 },
  nameItems: [],
  centerLogo: { on: false, x: 50, y: 46, size: 'lg', opacity: 0.14 },
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
  }
}
