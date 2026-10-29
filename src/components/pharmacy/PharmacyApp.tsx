'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePharmacy, hashToView, hasTag, type Product } from './store'
import Header from './Header'
import Footer from './Footer'
import Home from './Home'
import ProductCard from './ProductCard'
import QuickView from './QuickView'
import CartDrawer from './CartDrawer'
import Checkout from './Checkout'
import OrderSuccess from './OrderSuccess'
import Policies from './Policies'
import AdminPortal from './AdminPortal'
import { Toaster } from 'sonner'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PharmacyApp() {
  const { view, setView, loadCatalog, loaded, products, categories } = usePharmacy()

  // Load catalog once
  useEffect(() => { loadCatalog() }, [loadCatalog])

  // Hash routing (deep-linkable inside "/")
  useEffect(() => {
    const apply = () => setView(hashToView(window.location.hash))
    apply()
    window.addEventListener('popstate', apply)
    window.addEventListener('hashchange', apply)
    return () => {
      window.removeEventListener('popstate', apply)
      window.removeEventListener('hashchange', apply)
    }
  }, [])

  if (view.name === 'admin') {
    return (
      <>
        <AdminPortal />
        <Toaster richColors position="top-center" dir="rtl" />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1" aria-label="المحتوى الرئيسي">
        {!loaded ? (
          <LoadingSkeleton />
        ) : (
          <>
            {view.name === 'home' && <Home />}
            {view.name === 'category' && <CatalogView mode="category" slug={view.slug} />}
            {view.name === 'sale' && <CatalogView mode="sale" />}
            {view.name === 'search' && <CatalogView mode="search" q={view.q} />}
            {view.name === 'checkout' && <Checkout />}
            {view.name === 'success' && <OrderSuccess orderNumber={view.order} />}
            {view.name === 'policy' && <Policies which={view.which} />}
          </>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <QuickView />
      <Toaster richColors position="top-center" dir="rtl" />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="h-48 sm:h-64 rounded-3xl bg-gradient-to-l from-cyan-100 to-teal-50 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  )
}

/** Shared catalog view for category / sale / search */
function CatalogView({ mode, slug, q }: { mode: 'category' | 'sale' | 'search'; slug?: string; q?: string }) {
  const { products, categories, setView } = usePharmacy()

  const { title, subtitle, emoji, items } = useMemo(() => {
    if (mode === 'category') {
      const cat = categories.find(c => c.slug === slug)
      return {
        title: cat?.name || 'فئة',
        subtitle: cat?.description || '',
        emoji: cat?.emoji || '🧴',
        items: products.filter(p => p.category?.slug === slug),
      }
    }
    if (mode === 'sale') {
      return {
        title: 'العروض والتخفيضات',
        subtitle: 'كل المنتجات المخفضة وعروض 1+40% في مكان واحد',
        emoji: '🔥',
        items: products.filter(p => p.oldPrice && p.oldPrice > p.price || hasTag(p, 'offer40')),
      }
    }
    const query = (q || '').trim().toLowerCase()
    const filtered = query
      ? products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.brand?.name || '').toLowerCase().includes(query) ||
        (p.category?.name || '').includes(q || '') ||
        p.description.toLowerCase().includes(query)
      )
      : []
    return {
      title: `نتائج البحث: ${q}`,
      subtitle: `${filtered.length} منتج`,
      emoji: '🔎',
      items: filtered,
    }
  }, [mode, slug, q, products, categories])

  // Skin-type filter for category view
  const [skin, setSkin] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('default')
  const [maxPrice, setMaxPrice] = useState<number>(0)

  const skins = useMemo(() => {
    const s = new Set<string>()
    items.forEach(p => p.skinType.split(',').filter(Boolean).forEach(x => s.add(x.trim())))
    return Array.from(s)
  }, [items])

  const brandIds = useMemo(() => Array.from(new Set(items.map(p => p.brandId).filter(Boolean) as number[])), [items])

  const shown = useMemo(() => {
    let list = [...items]
    if (skin !== 'all') list = list.filter(p => p.skinType.includes(skin))
    if (brandFilter !== 'all') list = list.filter(p => String(p.brandId) === brandFilter)
    if (maxPrice > 0) list = list.filter(p => p.price <= maxPrice)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'discount') list.sort((a, b) => (b.oldPrice && b.oldPrice > b.price ? 1 - b.price / b.oldPrice : 0) - (a.oldPrice && a.oldPrice > a.price ? 1 - a.price / a.oldPrice : 0))
    return list
  }, [items, skin, brandFilter, sort, maxPrice])

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center my-4 bg-gray-50 border border-gray-100 rounded-2xl p-3">
        {skins.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-500">نوع البشرة:</span>
            <button onClick={() => setSkin('all')} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition ${skin === 'all' ? 'bg-cyan-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>الكل</button>
            {skins.map(s => (
              <button key={s} onClick={() => setSkin(s)} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition ${skin === s ? 'bg-cyan-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-cyan-300'}`}>{s}</button>
            ))}
          </div>
        )}
        {brandIds.length > 1 && (
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white font-semibold text-gray-600"
            aria-label="فلترة بالماركة"
          >
            <option value="all">كل الماركات</option>
            {brandIds.map(id => {
              const b = products.find(p => p.brandId === id)?.brand
              return b ? <option key={id} value={String(id)}>{b.name}</option> : null
            })}
          </select>
        )}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white font-semibold text-gray-600"
          aria-label="ترتيب"
        >
          <option value="default">الترتيب الافتراضي</option>
          <option value="price-asc">السعر: من الأقل للأعلى</option>
          <option value="price-desc">السعر: من الأعلى للأقل</option>
          <option value="discount">أكبر خصم</option>
        </select>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-bold">أقصى سعر:</span>
          <input
            type="range"
            min={0}
            max={3500}
            step={100}
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-28 accent-cyan-700"
            aria-label="نطاق السعر"
          />
          <span className="font-bold text-cyan-800 w-16">{maxPrice === 0 ? 'الكل' : `${maxPrice} ج.م`}</span>
        </div>
        <span className="text-xs text-gray-400 mr-auto">{shown.length} منتج</span>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <SearchX className="size-12 mx-auto text-gray-300" />
          <p className="font-bold text-gray-600">مفيش منتجات مطابقة</p>
          <p className="text-sm text-gray-400">جرب تغير الفلاتر أو دوّر على حاجة تانية</p>
          <Button className="bg-cyan-700 hover:bg-cyan-800" onClick={() => setView({ name: 'home' })}>رجوع للرئيسية</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shown.map((p: Product) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}
