'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, SlidersHorizontal } from 'lucide-react'
import type { BrandDTO, CategoryDTO } from '@/lib/types'
import { SKIN_TYPES, GROUP_LABELS } from '@/lib/types'

export type ProductFilters = {
  categorySlug: string | null
  brandId: string | null
  skinType: string | null
  minPrice: number | null
  maxPrice: number | null
  offersOnly: boolean
  sort: 'newest' | 'price-asc' | 'price-desc' | 'discount'
}

export const DEFAULT_FILTERS: ProductFilters = {
  categorySlug: null,
  brandId: null,
  skinType: null,
  minPrice: null,
  maxPrice: null,
  offersOnly: false,
  sort: 'newest',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ProductFilters
  onChange: (f: ProductFilters) => void
  categories: CategoryDTO[]
  brands: BrandDTO[]
  activeCount: number
}

export function FiltersSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  categories,
  brands,
  activeCount,
}: Props) {
  const set = (patch: Partial<ProductFilters>) => onChange({ ...filters, ...patch })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-5 overflow-y-auto p-6 ph-scroll sm:max-w-sm">
        <SheetHeader className="p-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            فلترة المنتجات
            {activeCount > 0 && (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                {activeCount}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>اختر الفئة والماركة والسعر المناسب لك</SheetDescription>
        </SheetHeader>

        {/* Category */}
        <div className="space-y-2">
          <Label>الفئة</Label>
          <Select
            value={filters.categorySlug ?? 'all'}
            onValueChange={(v) => set({ categorySlug: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="كل الفئات" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">كل الفئات</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.emoji} {c.name} — {GROUP_LABELS[c.group] || c.group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label>الماركة</Label>
          <Select
            value={filters.brandId ?? 'all'}
            onValueChange={(v) => set({ brandId: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="كل الماركات" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">كل الماركات</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skin type */}
        <div className="space-y-2">
          <Label>نوع البشرة</Label>
          <Select
            value={filters.skinType ?? 'all'}
            onValueChange={(v) => set({ skinType: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {SKIN_TYPES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label>نطاق السعر (ج.م)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="من"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                set({ minPrice: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
              }
              className="h-11"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="إلى"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                set({ maxPrice: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })
              }
              className="h-11"
            />
          </div>
        </div>

        {/* Offers only */}
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="offers-only" className="text-sm font-bold">
              العروض فقط
            </Label>
            <p className="text-xs text-muted-foreground">اعرض المنتجات المخفضة فقط</p>
          </div>
          <Switch
            id="offers-only"
            checked={filters.offersOnly}
            onCheckedChange={(v) => set({ offersOnly: v })}
          />
        </div>

        <div className="mt-auto flex gap-2">
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => onChange(DEFAULT_FILTERS)}>
            <X className="h-4 w-4" />
            مسح الفلاتر
          </Button>
          <Button type="button" className="h-11 flex-1 font-bold" onClick={() => onOpenChange(false)}>
            عرض النتائج
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
