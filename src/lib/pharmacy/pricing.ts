/** Shared pricing / shipping logic (used by server + client) */

export const SHIPPING_FEES: Record<string, number> = {
  sameday: 60,      // نفس اليوم — القاهرة والجيزة
  supersaver: 35,   // سوبر سيفر 2-3 أيام — القاهرة والجيزة
  provinces: 75,    // 2-7 أيام — باقي المحافظات
}

export const FREE_SHIP_THRESHOLD = 1500

export const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'الغربية',
  'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس',
  'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
  'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء',
]

export const CAIRO_GIZA = ['القاهرة', 'الجيزة']

export function shippingOptionsFor(city: string) {
  if (CAIRO_GIZA.includes(city)) {
    return [
      { id: 'sameday', name: 'التوصيل السريع — نفس اليوم', fee: SHIPPING_FEES.sameday, note: 'خلال ساعات داخل القاهرة والجيزة' },
      { id: 'supersaver', name: 'سوبر سيفر — 2-3 أيام', fee: SHIPPING_FEES.supersaver, note: 'الأوفر لطلبك العادي' },
    ]
  }
  return [
    { id: 'provinces', name: 'شحن المحافظات — 2-7 أيام', fee: SHIPPING_FEES.provinces, note: 'لجميع المحافظات المصرية' },
  ]
}

/** "اشترِ 1 واحصل على خصم 40% على القطعة الثانية" — applies per product tagged offer40 */
export function calcOfferDiscount(items: { price: number; qty: number; tags: string }[]) {
  let d = 0
  for (const it of items) {
    const tags = (it.tags || '').split(',')
    if (tags.includes('offer40') && it.qty >= 2) {
      d += Math.floor(it.qty / 2) * it.price * 0.4
    }
  }
  return Math.round(d * 100) / 100
}

export function shippingFeeFor(method: string, subtotal: number) {
  if (subtotal >= FREE_SHIP_THRESHOLD) return 0
  return SHIPPING_FEES[method] ?? 0
}

export const PHONE_RE = /^01[0125][0-9]{8}$/
