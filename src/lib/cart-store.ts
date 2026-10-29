import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string
  slug: string
  name: string
  emoji: string
  /** أول صورة للمنتج (data URL أو مسار) — اختيارية للسلات القديمة */
  image?: string | null
  price: number
  qty: number
  bundleOffer: boolean
  stock: number
}

type CartState = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => { ok: boolean; message?: string }
  setQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  totalCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const items = [...get().items]
        const idx = items.findIndex((i) => i.productId === item.productId)
        if (idx >= 0) {
          const nextQty = items[idx].qty + qty
          if (item.stock > 0 && nextQty > item.stock) {
            return { ok: false, message: `الكمية المتاحة من هذا المنتج ${item.stock} فقط` }
          }
          items[idx] = { ...items[idx], qty: nextQty, price: item.price, stock: item.stock, image: item.image ?? items[idx].image ?? null }
        } else {
          if (item.stock <= 0) return { ok: false, message: 'هذا المنتج غير متوفر حاليًا' }
          if (qty > item.stock) return { ok: false, message: `الكمية المتاحة ${item.stock} فقط` }
          items.push({ ...item, qty })
        }
        set({ items })
        return { ok: true }
      },
      setQty: (productId, qty) => {
        const items = get()
          .items.map((i) =>
            i.productId === productId
              ? { ...i, qty: Math.max(1, Math.min(qty, i.stock > 0 ? i.stock : 99)) }
              : i
          )
          .filter((i) => i.qty > 0)
        set({ items })
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },
      clear: () => set({ items: [] }),
      totalCount: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: 'pharmacy-cart-v1' }
  )
)

type AdminState = {
  token: string | null
  email: string | null
  setAuth: (token: string, email: string) => void
  logout: () => void
}

export const useAdmin = create<AdminState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      setAuth: (token, email) => set({ token, email }),
      logout: () => set({ token: null, email: null }),
    }),
    { name: 'pharmacy-admin-v1' }
  )
)
