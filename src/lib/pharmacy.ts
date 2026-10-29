/**
 * Shared pharmacy domain helpers — used by both API routes and the client UI.
 */

export const FREE_SHIPPING_THRESHOLD = 999; // EGP — free shipping above this subtotal

export type ShippingMethodId = "express" | "supersaver" | "standard" | "pickup";

export interface ShippingMethod {
  id: ShippingMethodId;
  nameAr: string;
  nameEn: string;
  etaAr: string;
  etaEn: string;
  price: number;
  cairoGizaOnly: boolean;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "express",
    nameAr: "توصيل سريع",
    nameEn: "Express Delivery",
    etaAr: "نفس اليوم أو اليوم التالي (القاهرة والجيزة)",
    etaEn: "Same-day or next-day (Cairo & Giza)",
    price: 65,
    cairoGizaOnly: true,
  },
  {
    id: "supersaver",
    nameAr: "سوبر سيفر",
    nameEn: "Super Saver",
    etaAr: "من 2 إلى 3 أيام",
    etaEn: "2-3 days",
    price: 45,
    cairoGizaOnly: true,
  },
  {
    id: "standard",
    nameAr: "توصيل عادي",
    nameEn: "Standard Delivery",
    etaAr: "من 2 إلى 7 أيام (بقية المحافظات)",
    etaEn: "2-7 days (other governorates)",
    price: 55,
    cairoGizaOnly: false,
  },
  {
    id: "pickup",
    nameAr: "استلام من الفرع",
    nameEn: "Store Pickup",
    etaAr: "جاهز للاستلام خلال ساعتين",
    etaEn: "Ready within 2 hours",
    price: 0,
    cairoGizaOnly: false,
  },
];

export const CAIRO_GIZA = ["القاهرة", "الجيزة"];

export const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "الشرقية",
  "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد",
  "الإسماعيلية", "السويس", "شمال سيناء", "جنوب سيناء", "بني سويف",
  "الفيوم", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان",
  "البحر الأحمر", "مطروح", "الوادي الجديد",
];

export const STORE_BRANCHES = [
  { name: "فرع مصر الجديدة", address: "شارع الحجاز، أمام محطة مترو هليوبوليس، مصر الجديدة، القاهرة", phone: "02 2415 8890", hours: "من 10 صباحًا حتى 6 مساءً — طوال أيام الأسبوع" },
  { name: "فرع المعادي", address: "شارع 9، مقابل حديقة المعادي، المعادي، القاهرة", phone: "02 2358 7712", hours: "من 10 صباحًا حتى 6 مساءً — طوال أيام الأسبوع" },
  { name: "فرع الشيخ زايد", address: "مول أرکان بلازا، الشيخ زايد، الجيزة", phone: "02 3851 2240", hours: "من 10 صباحًا حتى 6 مساءً — طوال أيام الأسبوع" },
  { name: "فرع الإسكندرية", address: "شارع أبو قير، بجوار سموحة، الإسكندرية", phone: "03 428 5590", hours: "من 10 صباحًا حتى 6 مساءً — طوال أيام الأسبوع" },
];

/* --------------------------------- Promo logic ------------------------------ */

export interface PromoInputItem {
  productId: string;
  qty: number;
  price: number;
}

export interface PromoResult {
  valid: boolean;
  message: string;
  code?: string;
  discount: number;
  freeShipping: boolean;
}

/**
 * Pure promo calculation — shared between /api/promo and /api/orders so the
 * client preview and the server total never disagree.
 */
export function calcPromo(
  promo: { code: string; type: string; value: number; minSubtotal: number },
  items: PromoInputItem[],
  subtotal: number
): PromoResult {
  if (subtotal < promo.minSubtotal) {
    return {
      valid: false,
      message: `الكود ده يحتاج طلب بحصة ${promo.minSubtotal} جنيه على الأقل`,
      discount: 0,
      freeShipping: false,
    };
  }

  switch (promo.type) {
    case "PERCENT": {
      const discount = Math.round(subtotal * (promo.value / 100) * 100) / 100;
      return {
        valid: true,
        message: `تم تطبيق خصم ${promo.value}% — وفّرت ${discount} جنيه`,
        code: promo.code,
        discount,
        freeShipping: false,
      };
    }
    case "FIXED": {
      const discount = Math.min(promo.value, subtotal);
      return {
        valid: true,
        message: `تم تطبيق خصم ${promo.value} جنيه`,
        code: promo.code,
        discount,
        freeShipping: false,
      };
    }
    case "BOGO_SECOND40": {
      // 40% off the cheapest units beyond the first (per pair), qty >= 2
      const totalQty = items.reduce((s, i) => s + i.qty, 0);
      if (totalQty < 2) {
        return {
          valid: false,
          message: "الكود ده يحتاج قطعتين على الأقل في السلة",
          discount: 0,
          freeShipping: false,
        };
      }
      const units = items.flatMap((i) => Array.from({ length: i.qty }, () => i.price));
      units.sort((a, b) => a - b); // cheapest first
      const discountedCount = Math.floor(totalQty / 2);
      const discount =
        Math.round(units.slice(0, discountedCount).reduce((s, p) => s + p * (promo.value / 100), 0) * 100) / 100;
      return {
        valid: true,
        message: `اشتري قطعة وخُد خصم ${promo.value}% على التانية — وفّرت ${discount} جنيه`,
        code: promo.code,
        discount,
        freeShipping: false,
      };
    }
    case "FREESHIP":
      return {
        valid: true,
        message: "تم تطبيق الشحن المجاني على طلبك",
        code: promo.code,
        discount: 0,
        freeShipping: true,
      };
    default:
      return { valid: false, message: "نوع كود غير معروف", discount: 0, freeShipping: false };
  }
}

export function shippingCostFor(
  methodId: string,
  governorate: string,
  subtotal: number,
  freeShipping: boolean
): { cost: number; method: ShippingMethod | null } {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId) ?? null;
  if (!method) return { cost: 0, method: null };
  if (method.id === "pickup") return { cost: 0, method };
  if (freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD) return { cost: 0, method };
  return { cost: method.price, method };
}

export function makeOrderNumber(seq: number): string {
  return `WT-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}
