'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Brand = { id: number; slug: string; name: string; color: string; featured: boolean }
export type Category = { id: number; slug: string; name: string; emoji: string; group: string; description: string; sortOrder: number }
export type Product = {
  id: number; slug: string; name: string; description: string; price: number
  oldPrice: number | null; emoji: string; skinType: string; size: string; stock: number
  tags: string; brandId: number | null; categoryId: number | null
  brand: Brand | null; category: Category | null
}
export type CartItem = {
  productId: number; slug: string; name: string; price: number
  oldPrice: number | null; emoji: string; qty: number; tags: string
}

export type View =
  | { name: 'home' }
  | { name: 'category'; slug: string }
  | { name: 'sale' }
  | { name: 'search'; q: string }
  | { name: 'policy'; which: string }
  | { name: 'checkout' }
  | { name: 'success'; order: string }
  | { name: 'admin' }

type State = {
  view: View
  products: Product[]
  categories: Category[]
  brands: Brand[]
  settings: Record<string, string>
  loaded: boolean
  loading: boolean
  cart: CartItem[]
  cartOpen: boolean
  quickView: Product | null
  setView: (v: View) => void
  openQuickView: (p: Product | null) => void
  setCartOpen: (o: boolean) => void
  addToCart: (p: Product, qty?: number) => void
  setQty: (productId: number, qty: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
  loadCatalog: () => Promise<void>
}

export function viewToHash(v: View): string {
  switch (v.name) {
    case 'home': return '#/'
    case 'category': return `#/c/${v.slug}`
    case 'sale': return '#/sale'
    case 'search': return `#/search/${encodeURIComponent(v.q)}`
    case 'policy': return `#/p/${v.which}`
    case 'checkout': return '#/checkout'
    case 'success': return `#/success/${v.order}`
    case 'admin': return '#/admin'
  }
}

export function hashToView(h: string): View {
  const parts = h.replace(/^#\/?/, '').split('/')
  try {
    if (parts[0] === 'c' && parts[1]) return { name: 'category', slug: decodeURIComponent(parts[1]) }
    if (parts[0] === 'sale') return { name: 'sale' }
    if (parts[0] === 'search' && parts[1]) return { name: 'search', q: decodeURIComponent(parts[1]) }
    if (parts[0] === 'p' && parts[1]) return { name: 'policy', which: parts[1] }
    if (parts[0] === 'checkout') return { name: 'checkout' }
    if (parts[0] === 'success' && parts[1]) return { name: 'success', order: decodeURIComponent(parts[1]) }
    if (parts[0] === 'admin') return { name: 'admin' }
  } catch { /* fallback */ }
  return { name: 'home' }
}

export const usePharmacy = create<State>()(
  persist(
    (set, get) => ({
      view: { name: 'home' },
      products: [],
      categories: [],
      brands: [],
      settings: {},
      loaded: false,
      loading: false,
      cart: [],
      cartOpen: false,
      quickView: null,

      setView: (v) => {
        set({ view: v, cartOpen: false, quickView: null })
        if (typeof window !== 'undefined') {
          const h = viewToHash(v)
          if (window.location.hash !== h) window.history.pushState(null, '', h)
        }
      },

      openQuickView: (p) => set({ quickView: p }),
      setCartOpen: (o) => set({ cartOpen: o }),

      addToCart: (p, qty = 1) => {
        const cart = [...get().cart]
        const i = cart.findIndex(c => c.productId === p.id)
        if (i >= 0) cart[i] = { ...cart[i], qty: Math.min(50, cart[i].qty + qty) }
        else cart.push({
          productId: p.id, slug: p.slug, name: p.name, price: p.price,
          oldPrice: p.oldPrice, emoji: p.emoji, qty, tags: p.tags,
        })
        set({ cart })
      },

      setQty: (productId, qty) => {
        const cart = get().cart
          .map(c => c.productId === productId ? { ...c, qty: Math.max(0, Math.min(50, qty)) } : c)
          .filter(c => c.qty > 0)
        set({ cart })
      },

      removeFromCart: (productId) => set({ cart: get().cart.filter(c => c.productId !== productId) }),
      clearCart: () => set({ cart: [] }),

      loadCatalog: async () => {
        if (get().loading) return
        set({ loading: true })
        try {
          const res = await fetch('/api/bootstrap', { cache: 'no-store' })
          const data = await res.json()
          set({
            products: data.products ?? [],
            categories: data.categories ?? [],
            brands: data.brands ?? [],
            settings: data.settings ?? {},
            loaded: true,
          })
        } catch {
          set({ loaded: true })
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'ph_cart_v1',
      partialize: (s) => ({ cart: s.cart }) as unknown as State,
    }
  )
)

export const hasTag = (p: { tags: string }, tag: string) => (p.tags || '').split(',').includes(tag)

export const fmtEGP = (n: number) =>
  `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 0 }).format(Math.round(n))} ج.م`
