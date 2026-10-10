'use client'

import { useMemo, useState } from 'react'
import { usePharmacy, fmtEGP } from './store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ShoppingBag, Search, Menu, Pill, ChevronDown, Percent } from 'lucide-react'

const GROUPS = [
  { id: 'health', name: 'الصحة والعافية' },
  { id: 'beauty', name: 'الجمال والتجميل' },
  { id: 'baby', name: 'الأم والطفل' },
  { id: 'special', name: 'أقسام متخصصة' },
]

export default function Header() {
  const { view, setView, cart, setCartOpen, categories, settings } = usePharmacy()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const cartCount = useMemo(() => cart.reduce((s, c) => s + c.qty, 0), [cart])

  const doSearch = (value: string) => {
    setQ(value)
    if (value.trim().length >= 2) setView({ name: 'search', q: value.trim() })
    else if (value.trim().length === 0 && view.name === 'search') setView({ name: 'home' })
  }

  return (
    <header className="sticky top-0 z-40 shadow-sm" aria-label="الهيدر الرئيسي">
      {/* Announcement */}
      <div className="bg-cyan-700 text-white text-[11px] sm:text-xs py-1.5 px-3 text-center font-medium">
        {settings.announcement || '🚚 توصيل سريع لكل مصر — منتجات أصلية 100%'}
      </div>

      {/* Main row */}
      <div className="bg-white border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-cyan-800" aria-label="القائمة">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto p-0">
              <SheetTitle className="sr-only">قائمة الفئات</SheetTitle>
              <div className="p-4 space-y-4">
                <div className="font-bold text-cyan-800 text-lg">كل الفئات</div>
                {GROUPS.map(g => (
                  <div key={g.id}>
                    <div className="text-sm font-semibold text-gray-500 mb-1">{g.name}</div>
                    <div className="space-y-1">
                      {categories.filter(c => c.group === g.id).map(c => (
                        <button
                          key={c.id}
                          className="flex items-center gap-2 w-full text-right px-2 py-1.5 rounded-lg hover:bg-cyan-50 text-sm"
                          onClick={() => { setView({ name: 'category', slug: c.slug }); setMenuOpen(false) }}
                        >
                          <span className="text-lg">{c.emoji}</span> {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <button
            className="flex items-center gap-2 shrink-0"
            onClick={() => setView({ name: 'home' })}
            aria-label="الصفحة الرئيسية"
          >
            <span className="size-9 sm:size-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white grid place-items-center shadow-md">
              <Pill className="size-5" />
            </span>
            <span className="text-right leading-tight">
              <span className="block font-extrabold text-cyan-900 text-sm sm:text-base">د. وليد الطحاوي</span>
              <span className="block text-[10px] text-cyan-600 font-semibold tracking-wide">PHARMACY</span>
            </span>
          </button>

          {/* Search */}
          <div className="flex-1 relative max-w-xl mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={q}
              onChange={e => doSearch(e.target.value)}
              placeholder="دوّر على منتج، ماركة، أو فئة..."
              className="pr-9 bg-gray-50 border-gray-200 focus-visible:ring-cyan-600 h-9 sm:h-10 text-sm"
              aria-label="بحث"
            />
          </div>

          {/* Cart */}
          <Button
            variant="outline"
            className="relative border-cyan-200 text-cyan-800 hover:bg-cyan-50 gap-2 h-9 sm:h-10 shrink-0"
            onClick={() => setCartOpen(true)}
            aria-label={`السلة — ${cartCount} منتج`}
          >
            <ShoppingBag className="size-5" />
            <span className="hidden sm:inline text-sm font-semibold">السلة</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 size-5 rounded-full bg-amber-500 text-white text-[10px] font-bold grid place-items-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Category strip (desktop + mobile scroll) */}
      <nav className="bg-white/95 backdrop-blur border-b border-cyan-100" aria-label="فئات المتجر">
        <div className="max-w-7xl mx-auto px-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setView({ name: 'home' })}
            className={`px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-full transition ${view.name === 'home' ? 'bg-cyan-700 text-white' : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-700'}`}
          >
            الرئيسية
          </button>

          {GROUPS.map(g => {
            const cats = categories.filter(c => c.group === g.id)
            return (
              <div key={g.id} className="relative group"
                onMouseEnter={() => setOpenGroup(g.id)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <button
                  className="px-3 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap rounded-full text-gray-600 hover:bg-cyan-50 hover:text-cyan-700 transition flex items-center gap-1"
                  onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)}
                >
                  {g.name}
                  <ChevronDown className="size-3.5" />
                </button>
                {openGroup === g.id && (
                  <div className="absolute top-full right-0 z-50 w-64 bg-white rounded-xl shadow-xl border border-cyan-100 p-2 max-h-[70vh] overflow-y-auto">
                    {cats.map(c => (
                      <button
                        key={c.id}
                        className="flex items-start gap-2 w-full text-right px-3 py-2 rounded-lg hover:bg-cyan-50"
                        onClick={() => { setView({ name: 'category', slug: c.slug }); setOpenGroup(null) }}
                      >
                        <span className="text-lg">{c.emoji}</span>
                        <span>
                          <span className="block text-sm font-semibold text-gray-800">{c.name}</span>
                          <span className="block text-[11px] text-gray-400 line-clamp-1">{c.description}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => setView({ name: 'sale' })}
            className={`px-3 py-2 text-xs sm:text-sm font-bold whitespace-nowrap rounded-full transition flex items-center gap-1 ${view.name === 'sale' ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50'}`}
          >
            <Percent className="size-3.5" />
            العروض
          </button>
        </div>
      </nav>
    </header>
  )
}
