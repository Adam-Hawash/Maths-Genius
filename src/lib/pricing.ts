/**
 * Server-side cart pricing math — single source of truth for
 * bundle offers, promo codes and shipping fees.
 * Used by the orders API; the cart UI mirrors this logic for display only.
 */

export const BUNDLE_DISCOUNT_RATE = 0.4 // اشترِ 2 واحصل على خصم 40% على الثانية

export type PricingProductInfo = {
  id: string
  name: string
  price: number
  bundleOffer: boolean
}

export type CartLine = {
  productId: string
  qty: number
}

export type OfferDetail = {
  productId: string
  name: string
  qty: number
  discountedUnits: number
  discount: number
}

export type CartPricing = {
  subtotal: number
  offerDiscount: number
  offerDetails: OfferDetail[]
  promoDiscount: number
  promoError?: string
  shippingFee: number
  total: number
  freeShipping: boolean
}

export function computeOfferDiscount(
  lines: CartLine[],
  productsById: Map<string, PricingProductInfo>
): { discount: number; details: OfferDetail[] } {
  let discount = 0
  const details: OfferDetail[] = []
  for (const line of lines) {
    const product = productsById.get(line.productId)
    if (!product || !product.bundleOffer || line.qty < 2) continue
    const discountedUnits = Math.floor(line.qty / 2)
    const lineDiscount = round2(discountedUnits * product.price * BUNDLE_DISCOUNT_RATE)
    discount += lineDiscount
    details.push({
      productId: product.id,
      name: product.name,
      qty: line.qty,
      discountedUnits,
      discount: lineDiscount,
    })
  }
  return { discount: round2(discount), details }
}

export type PromoInfo = {
  code: string
  type: string
  value: number
  minTotal: number
  active: boolean
}

export function computePromoDiscount(
  promo: PromoInfo | null | undefined,
  baseAmount: number
): { discount: number; error?: string } {
  if (!promo) return { discount: 0 }
  if (!promo.active) return { discount: 0, error: 'هذا الكود غير مُفعّل' }
  if (baseAmount < promo.minTotal) {
    return {
      discount: 0,
      error: `الكود يعمل على الطلبات من ${Math.round(promo.minTotal)} ج.م أو أكثر`,
    }
  }
  const raw =
    promo.type === 'fixed'
      ? promo.value
      : (baseAmount * promo.value) / 100
  return { discount: round2(Math.min(raw, baseAmount)) }
}

export function shippingFeeFor(
  method: string,
  settings: Record<string, string>,
  payableAmount: number
): { fee: number; free: boolean } {
  const keys: Record<string, string> = {
    'same-day': 'shipping_same_day',
    'super-saver': 'shipping_super_saver',
    governorates: 'shipping_governorates',
  }
  const key = keys[method] || 'shipping_same_day'
  const fee = Number(settings[key] ?? 35)
  const threshold = Number(settings.free_shipping_threshold ?? 600)
  if (threshold > 0 && payableAmount >= threshold) return { fee: 0, free: true }
  return { fee: Number.isFinite(fee) && fee >= 0 ? fee : 35, free: false }
}

export function computeCartPricing(params: {
  lines: CartLine[]
  productsById: Map<string, PricingProductInfo>
  promo: PromoInfo | null
  settings: Record<string, string>
  shippingMethod: string
}): CartPricing {
  const { lines, productsById, promo, settings, shippingMethod } = params

  const subtotal = round2(
    lines.reduce((sum, l) => {
      const p = productsById.get(l.productId)
      return sum + (p ? p.price * l.qty : 0)
    }, 0)
  )

  const offers = computeOfferDiscount(lines, productsById)
  const afterOffers = Math.max(0, round2(subtotal - offers.discount))

  const promoResult = computePromoDiscount(promo, afterOffers)
  const payable = Math.max(0, round2(afterOffers - promoResult.discount))

  const shipping = shippingFeeFor(shippingMethod, settings, payable)

  return {
    subtotal,
    offerDiscount: offers.discount,
    offerDetails: offers.details,
    promoDiscount: promoResult.discount,
    promoError: promoResult.error,
    shippingFee: shipping.fee,
    total: round2(payable + shipping.fee),
    freeShipping: shipping.free,
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function generateOrderNumber(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `PH${yy}${mm}${dd}-${rand}`
}
