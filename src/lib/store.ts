"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Lang, PolicyKey } from "@/lib/i18n";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/pharmacy";

/* --------------------------------- Types ---------------------------------- */
export interface PhBrand {
  id: string; slug: string; name: string; nameAr: string; color: string; country?: string | null;
}
export interface PhCategory {
  id: string; slug: string; nameAr: string; nameEn: string; group: string; icon: string; sort: number;
}
export interface PhProduct {
  id: string; slug: string; nameAr: string; nameEn: string; descAr: string; descEn: string;
  price: number; compareAtPrice: number | null; skinType: string | null; size: string | null;
  rating: number; reviewsCount: number; stock: number; featured: boolean; isNew: boolean;
  brand: { slug: string; name: string; nameAr: string; color: string };
  category: { slug: string; nameAr: string; nameEn: string; group: string; icon: string };
}
export interface CartItem {
  productId: string; slug: string; nameAr: string; nameEn: string;
  price: number; compareAtPrice: number | null;
  brand: { name: string; nameAr: string; color: string };
  qty: number;
}
export interface AppliedPromo { code: string; discount: number; freeShipping: boolean }
export interface OrderResultItem { nameAr: string; nameEn: string; qty: number; price: number }
export interface OrderResult {
  orderNumber: string; subtotal: number; discount: number; shippingCost: number; total: number;
  promoCode: string | null; paymentMethod: string; shippingMethod: string; governorate: string;
  items: OrderResultItem[];
}

export type View =
  | { name: "home" }
  | { name: "shop" }
  | { name: "checkout" }
  | { name: "confirm"; order: OrderResult }
  | { name: "policy"; key: PolicyKey };

export interface Filters {
  q: string; category: string; brands: string[]; skinTypes: string[];
  sale: boolean; min: number | null; max: number | null;
  sort: "newest" | "price-asc" | "price-desc" | "rating";
}

/* --------------------------------- Store ---------------------------------- */
interface Store {
  lang: Lang;
  view: View;
  cart: CartItem[];
  cartOpen: boolean;
  quickView: PhProduct | null;
  promo: AppliedPromo | null;
  filters: Filters;
  catalog: { brands: PhBrand[]; categories: PhCategory[] };
  catalogLoaded: boolean;

  setLang: (l: Lang) => void;
  toggleLang: () => void;
  navigate: (v: View) => void;
  addToCart: (p: PhProduct, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartOpen: (open: boolean) => void;
  setQuickView: (p: PhProduct | null) => void;
  setPromo: (p: AppliedPromo | null) => void;
  setFilters: (f: Partial<Filters>) => void;
  resetFilters: () => void;
  loadCatalog: () => Promise<void>;
}

export const DEFAULT_FILTERS: Filters = {
  q: "", category: "", brands: [], skinTypes: [], sale: false, min: null, max: null, sort: "newest",
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      lang: "ar",
      view: { name: "home" },
      cart: [],
      cartOpen: false,
      quickView: null,
      promo: null,
      filters: { ...DEFAULT_FILTERS },
      catalog: { brands: [], categories: [] },
      catalogLoaded: false,

      setLang: (l) => set({ lang: l }),
      toggleLang: () => set({ lang: get().lang === "ar" ? "en" : "ar" }),

      navigate: (v) => {
        set({ view: v, cartOpen: false });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      },

      addToCart: (p, qty = 1) => {
        const cart = [...get().cart];
        const idx = cart.findIndex((i) => i.productId === p.id);
        if (idx >= 0) cart[idx] = { ...cart[idx], qty: Math.min(20, cart[idx].qty + qty) };
        else
          cart.push({
            productId: p.id, slug: p.slug, nameAr: p.nameAr, nameEn: p.nameEn,
            price: p.price, compareAtPrice: p.compareAtPrice,
            brand: { name: p.brand.name, nameAr: p.brand.nameAr, color: p.brand.color }, qty,
          });
        set({ cart });
      },
      updateQty: (productId, qty) =>
        set({
          cart: get()
            .cart.map((i) => (i.productId === productId ? { ...i, qty: Math.max(0, Math.min(20, qty)) } : i))
            .filter((i) => i.qty > 0),
        }),
      removeFromCart: (productId) => set({ cart: get().cart.filter((i) => i.productId !== productId) }),
      clearCart: () => set({ cart: [], promo: null }),
      setCartOpen: (open) => set({ cartOpen: open }),
      setQuickView: (p) => set({ quickView: p }),
      setPromo: (p) => set({ promo: p }),

      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

      loadCatalog: async () => {
        if (get().catalogLoaded) return;
        try {
          const res = await fetch("/api/catalog");
          const data = await res.json();
          set({ catalog: { brands: data.brands ?? [], categories: data.categories ?? [] }, catalogLoaded: true });
        } catch (e) {
          console.error("catalog load failed", e);
        }
      },
    }),
    {
      name: "tahan-pharmacy",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ lang: s.lang, cart: s.cart }),
    }
  )
);

/* --------------------------------- Helpers -------------------------------- */
export function cartSubtotal(cart: CartItem[]): number {
  return Math.round(cart.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
}

export function freeShippingRemaining(cart: CartItem[]): number {
  const sub = cartSubtotal(cart);
  return Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - sub) * 100) / 100);
}

export function fmtPrice(n: number, lang: Lang): string {
  const num = n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${num} ج.م` : `${num} EGP`;
}

export function productName(
  p: { nameAr: string; nameEn: string },
  lang: Lang
): string {
  return lang === "ar" ? p.nameAr : p.nameEn;
}
