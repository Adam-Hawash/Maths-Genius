export type ProductDTO = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  oldPrice: number | null
  emoji: string
  images: string[]
  skinType: string | null
  size: string | null
  stock: number
  tags: string[]
  bundleOffer: boolean
  active: boolean
  categoryId: string
  categoryName?: string
  categorySlug?: string
  categoryGroup?: string
  brandId: string | null
  brandName?: string | null
  brandColor?: string | null
  createdAt?: string
}

export type CategoryDTO = {
  id: string
  name: string
  slug: string
  group: string
  emoji: string
  sortOrder: number
}

export type BrandDTO = {
  id: string
  name: string
  slug: string
  color: string
  featured: boolean
}

export type SettingsDTO = Record<string, string>

export type OrderItemDTO = {
  id: string
  productId: string | null
  name: string
  emoji: string
  price: number
  qty: number
}

export type OrderDTO = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  city: string
  area: string | null
  address: string
  notes: string | null
  shippingMethod: string
  paymentMethod: string
  subtotal: number
  offerDiscount: number
  promoDiscount: number
  shippingFee: number
  total: number
  status: string
  promoCode: string | null
  items: OrderItemDTO[]
  createdAt: string
}

export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const

export const ORDER_STATUS_AR: Record<string, string> = {
  pending: 'قيد المراجعة',
  confirmed: 'تم التأكيد',
  shipped: 'في الطريق إليك',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

export const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-sky-100 text-sky-800 border-sky-200',
  shipped: 'bg-violet-100 text-violet-800 border-violet-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

export const SHIPPING_METHODS: { id: string; label: string; note: string; key: string }[] = [
  {
    id: 'same-day',
    label: 'توصيل نفس اليوم',
    note: 'القاهرة والجيزة',
    key: 'shipping_same_day',
  },
  {
    id: 'super-saver',
    label: 'سوبر سيفر',
    note: '2-3 أيام',
    key: 'shipping_super_saver',
  },
  {
    id: 'governorates',
    label: 'شحن المحافظات',
    note: '2-7 أيام',
    key: 'shipping_governorates',
  },
]

export const PAYMENT_METHODS: { id: string; label: string; emoji: string }[] = [
  { id: 'cod', label: 'كاش عند الاستلام', emoji: '💵' },
  { id: 'vodafone', label: 'فودافون كاش', emoji: '📱' },
]

export const GROUP_LABELS: Record<string, string> = {
  health: 'الصحة والأدوية',
  beauty: 'التجميل والعناية',
  'mother-baby': 'الأم والطفل',
  devices: 'الأجهزة الطبية',
  'personal-care': 'العناية الشخصية',
  nutrition: 'التغذية',
}

export const SKIN_TYPES: { id: string; label: string }[] = [
  { id: 'oily', label: 'بشرة دهنية' },
  { id: 'dry', label: 'بشرة جافة' },
  { id: 'normal', label: 'بشرة عادية' },
  { id: 'combination', label: 'بشرة مختلطة' },
  { id: 'sensitive', label: 'بشرة حساسة' },
  { id: 'all', label: 'كل أنواع البشرة' },
]

export const SKIN_TYPE_AR: Record<string, string> = Object.fromEntries(
  SKIN_TYPES.map((s) => [s.id, s.label])
)

export const EMOJI_PRESET = [
  '💊', '🧴', '🧼', '🧪', '🩹', '🦷', '👶', '🍼', '🧸', '💄', '🌸', '🌊',
  '☀️', '💧', '🌿', '🍊', '🐟', '🍯', '🥛', '🩺', '🩸', '🫀', '🫁', '⚖️',
  '🌡️', '😷', '🪥', '🥑', '💇‍♀️', '👁️', '💋', '🎩', '🧔', '🪒', '🖤', '💪',
  '⚡', '🥣', '🫒', '🥜', '🧷', '🧢', '🐌', '🫧', '🧾', '💉', '🥗', '🍎',
]

// ── Product images helpers ──
// الحد الأقصى لعدد الصور لكل منتج (أول صورة = الرئيسية)
export const MAX_PRODUCT_IMAGES = 8

/** يحوّل قيمة حقل images من القاعدة (JSON string) إلى مصفوفة روابط آمنة */
export function parseProductImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string' && v.length > 0)
  if (typeof raw !== 'string' || !raw.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0)
  } catch {
    return []
  }
}

/** أول صورة متاحة للمنتج أو undefined لو مفيش */
export function productMainImage(images: string[] | undefined | null): string | undefined {
  if (!images || images.length === 0) return undefined
  const first = images[0]
  return typeof first === 'string' && first.trim() ? first.trim() : undefined
}
