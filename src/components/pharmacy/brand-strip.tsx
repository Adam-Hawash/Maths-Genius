'use client'

import { cn } from '@/lib/utils'
import type { BrandDTO } from '@/lib/types'

type Props = {
  brands: BrandDTO[]
  activeBrandId: string | null
  onSelectBrand: (id: string | null) => void
}

export function BrandStrip({ brands, activeBrandId, onSelectBrand }: Props) {
  if (brands.length === 0) return null
  return (
    <section className="border-b bg-card" aria-label="أشهر الماركات">
      <div className="mx-auto max-w-7xl px-4 py-5">
        <div className="ph-scroll-x flex items-center gap-2.5 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-bold text-muted-foreground">ماركات موثوقة:</span>
          {brands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBrand(activeBrandId === b.id ? null : b.id)}
              aria-pressed={activeBrandId === b.id}
              className={cn(
                'h-10 shrink-0 rounded-full border-2 px-4 text-sm font-extrabold tracking-wide transition',
                activeBrandId === b.id
                  ? 'scale-105 shadow-md'
                  : 'opacity-90 hover:opacity-100 hover:shadow-sm'
              )}
              style={{
                color: b.color,
                borderColor: activeBrandId === b.id ? b.color : `${b.color}44`,
                backgroundColor: activeBrandId === b.id ? `${b.color}14` : 'transparent',
              }}
              dir="ltr"
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
