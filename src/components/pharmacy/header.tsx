'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, ShoppingCart, Loader2, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ProductDTO } from '@/lib/types'
import { productMainImage } from '@/lib/types'
import { formatEGP } from '@/lib/format'
import { ProductImage } from './product-image'

type Props = {
  cartCount: number
  onOpenCart: () => void
  onSelectProduct: (p: ProductDTO) => void
}

export function Header({ cartCount, onOpenCart, onSelectProduct }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductDTO[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pharmacy/products?search=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        })
        const data = (await res.json()) as { products?: ProductDTO[] }
        setResults((data.products || []).slice(0, 8))
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Logo */}
        <a href="#" className="flex shrink-0 items-center gap-2" aria-label="الصفحة الرئيسية">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground shadow-sm">
            ⚕️
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-base font-extrabold text-foreground">صيدلية د. وليد التهان</span>
            <span className="text-[10px] font-semibold tracking-wide text-muted-foreground" dir="ltr">
              Dr. Walid El-Tahan Pharmacy
            </span>
          </span>
        </a>

        {/* Search */}
        <div ref={boxRef} className="relative flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim().length >= 2 && setOpen(true)}
              placeholder="ابحث عن دواء أو منتج… مثل فيتامين سي"
              aria-label="ابحث في المنتجات"
              className="h-11 w-full rounded-full border border-input bg-background ps-10 pe-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searching && (
              <Loader2 className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>

          {open && query.trim().length >= 2 && (
            <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-xl border bg-popover shadow-lg ph-scroll max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-6 text-center text-sm text-muted-foreground">
                  <PackageSearch className="h-8 w-8 text-muted-foreground/50" />
                  لا توجد نتائج مطابقة لـ «{query}»
                </div>
              ) : (
                <ul role="listbox" aria-label="نتائج البحث">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(p)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 p-3 text-start transition hover:bg-accent"
                      >
                        <ProductImage
                          src={productMainImage(p.images)}
                          alt={p.name}
                          emoji={p.emoji}
                          className="h-11 w-11 shrink-0 rounded-lg"
                          emojiClassName="text-2xl"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{p.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {p.brandName || p.categoryName}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-primary">
                          {formatEGP(p.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <Button
          type="button"
          onClick={onOpenCart}
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0 rounded-full"
          aria-label={`السلة — ${cartCount} منتج`}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <Badge className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}
