'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Smile,
  ImagePlus,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { formatEGP } from '@/lib/format'
import {
  EMOJI_PRESET,
  SKIN_TYPES,
  MAX_PRODUCT_IMAGES,
  type ProductDTO,
  type CategoryDTO,
  type BrandDTO,
} from '@/lib/types'
import { compressImageToDataUrl, isAcceptedImageType } from '@/lib/image-compress'
import { cn } from '@/lib/utils'
import { ProductImage } from '../product-image'

type Props = { token: string; reloadKey: number }

type FormState = {
  name: string
  description: string
  price: string
  oldPrice: string
  emoji: string
  skinType: string
  size: string
  stock: string
  tags: string
  bundleOffer: boolean
  active: boolean
  categoryId: string
  brandId: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  emoji: '💊',
  skinType: 'none',
  size: '',
  stock: '10',
  tags: '',
  bundleOffer: false,
  active: true,
  categoryId: '',
  brandId: 'none',
}

export function ProductsTab({ token, reloadKey }: Props) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [brands, setBrands] = useState<BrandDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProductDTO | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [pRes, cRes, bRes] = await Promise.all([
        fetch('/api/pharmacy/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch('/api/pharmacy/admin/categories', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
        fetch('/api/pharmacy/admin/brands', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }),
      ])
      const [pData, cData, bData] = await Promise.all([
        pRes.json() as Promise<{ products?: ProductDTO[] }>,
        cRes.json() as Promise<{ categories?: CategoryDTO[] }>,
        bRes.json() as Promise<{ brands?: BrandDTO[] }>,
      ])
      setProducts(pData.products || [])
      setCategories(cData.categories || [])
      setBrands(bData.brands || [])
    } catch {
      toast.error('تعذر تحميل المنتجات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, reloadKey])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.brandName || '').toLowerCase().includes(q)
    )
  }, [products, search])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setImages([])
    setDialogOpen(true)
  }

  function openEdit(p: ProductDTO) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : '',
      emoji: p.emoji,
      skinType: p.skinType || 'none',
      size: p.size || '',
      stock: String(p.stock),
      tags: p.tags.join(', '),
      bundleOffer: p.bundleOffer,
      active: p.active,
      categoryId: p.categoryId,
      brandId: p.brandId || 'none',
    })
    setImages((p.images || []).filter(Boolean))
    setDialogOpen(true)
  }

  async function save() {
    const name = form.name.trim()
    const price = Number(form.price)
    if (name.length < 2) {
      toast.error('اسم المنتج مطلوب')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('اكتب سعرًا صحيحًا')
      return
    }
    if (!form.categoryId) {
      toast.error('اختر الفئة')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        description: form.description.trim(),
        price,
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        emoji: form.emoji,
        skinType: form.skinType === 'none' ? null : form.skinType,
        size: form.size.trim() || null,
        stock: Number(form.stock) || 0,
        tags: form.tags,
        images,
        bundleOffer: form.bundleOffer,
        active: form.active,
        categoryId: form.categoryId,
        brandId: form.brandId === 'none' ? null : form.brandId,
      }
      const res = editing
        ? await fetch(`/api/pharmacy/admin/products/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/pharmacy/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          })
      const data = (await res.json()) as { product?: ProductDTO; error?: string }
      if (!res.ok || !data.product) {
        toast.error(data.error || 'تعذر الحفظ')
        return
      }
      toast.success(editing ? 'تم تحديث المنتج ✓' : 'تمت إضافة المنتج ✓')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('حدث خطأ في الشبكة')
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pharmacy/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; softDeleted?: boolean }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'تعذر الحذف')
        return
      }
      toast.success(
        data.softDeleted ? 'تم إخفاء المنتج (مرتبط بطلبات سابقة)' : 'تم حذف المنتج ✓'
      )
      setDeleteTarget(null)
      await load()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-base font-extrabold">
          المنتجات <Badge variant="secondary">{products.length}</Badge>
        </h2>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الماركة"
            className="h-10 w-full ps-9 sm:w-64"
          />
        </div>
        <Button type="button" onClick={openAdd} className="h-10 gap-1.5 font-extrabold">
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            لا توجد منتجات مطابقة
          </CardContent>
        </Card>
      ) : (
        <div className="ph-scroll max-h-[65vh] space-y-2 overflow-y-auto rounded-xl border bg-card p-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border bg-background p-2.5"
            >
              <ProductImage
                src={(p.images || [])[0] || undefined}
                alt={p.name}
                emoji={p.emoji}
                className="h-11 w-11 shrink-0 rounded-lg"
                emojiClassName="text-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                  {p.name}
                  {(p.images || []).filter(Boolean).length > 1 && (
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      📷 {(p.images || []).filter(Boolean).length}
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.categoryName} {p.brandName ? `• ${p.brandName}` : ''} {p.size ? `• ${p.size}` : ''}
                </p>
              </div>
              {!p.active && <Badge variant="outline">مخفي</Badge>}
              {p.bundleOffer && <Badge className="bg-amber-500 text-[10px] text-white">🎁 عرض 2</Badge>}
              <span className="shrink-0 text-sm font-black text-primary">{formatEGP(p.price)}</span>
              <Badge
                variant="outline"
                className={cnStock(p.stock)}
              >
                مخزون {p.stock}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => openEdit(p)}
                aria-label={`تعديل ${p.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(p)}
                aria-label={`حذف ${p.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="ph-scroll max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="text-start">
            <DialogTitle>{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? 'عدّل بيانات المنتج وصوره ثم احفظ' : 'املأ بيانات المنتج — الاسم المختصر يُنشأ تلقائيًا'}
            </DialogDescription>
          </DialogHeader>

          {/* ── صور المنتج ── */}
          <ProductImagesManager images={images} onChange={setImages} productName={form.name} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">اسم المنتج *</Label>
              <Input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="مثال: فيتامين سي 1000 مجم"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={3}
                className="resize-none"
                placeholder="وصف مختصر يظهر في صفحة المنتج"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">السعر (ج.م) *</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set({ price: e.target.value })}
                className="h-11"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">السعر قبل الخصم (اختياري)</Label>
              <Input
                type="number"
                min={0}
                value={form.oldPrice}
                onChange={(e) => set({ oldPrice: e.target.value })}
                className="h-11"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الفئة *</Label>
              <Select value={form.categoryId} onValueChange={(v) => set({ categoryId: v })}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.emoji} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الماركة</Label>
              <Select value={form.brandId} onValueChange={(v) => set({ brandId: v })}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="بدون ماركة" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">بدون ماركة</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                الإيموجي <span className="font-normal text-muted-foreground">(fallback لما مفيش صورة)</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 w-full justify-start gap-2 text-base">
                    <Smile className="h-4 w-4 text-muted-foreground" />
                    {form.emoji}
                    <span className="text-xs text-muted-foreground">تغيير</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="start">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_PRESET.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => set({ emoji: e })}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xl transition hover:bg-accent ${
                          form.emoji === e ? 'bg-accent ring-2 ring-primary' : ''
                        }`}
                        aria-label={`اختيار ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">نوع البشرة</Label>
              <Select value={form.skinType} onValueChange={(v) => set({ skinType: v })}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">غير محدد</SelectItem>
                  {SKIN_TYPES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الحجم / العبوة</Label>
              <Input
                value={form.size}
                onChange={(e) => set({ size: e.target.value })}
                placeholder="مثال: 50 مل"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">المخزون</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => set({ stock: e.target.value })}
                className="h-11"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">الوسوم (افصل بفاصلة)</Label>
              <Input
                value={form.tags}
                onChange={(e) => set({ tags: e.target.value })}
                placeholder="مثال: مناعة, فيتامينات"
                className="h-11"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-xs font-bold">🎁 عرض اشترِ 2</Label>
                <p className="text-[11px] text-muted-foreground">خصم 40% على الثانية</p>
              </div>
              <Switch checked={form.bundleOffer} onCheckedChange={(v) => set({ bundleOffer: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-xs font-bold">ظاهر في المتجر</Label>
                <p className="text-[11px] text-muted-foreground">تفعيل/إخفاء المنتج</p>
              </div>
              <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
            </div>
          </div>

          <Separator />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={() => setDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button type="button" onClick={save} disabled={saving} className="h-11 flex-1 font-extrabold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{deleteTarget?.name}» نهائيًا. لو المنتج مرتبط بطلبات سابقة سيتم إخفاؤه
              فقط للحفاظ على سجل الطلبات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─────────────────────────── مدير صور المنتج ─────────────────────────── */

function ProductImagesManager({
  images,
  onChange,
  productName,
}: {
  images: string[]
  onChange: (images: string[]) => void
  productName: string
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_PRODUCT_IMAGES - images.length
    if (room <= 0) {
      toast.error(`الحد الأقصى ${MAX_PRODUCT_IMAGES} صور للمنتج`)
      return
    }
    setUploading(true)
    const added: string[] = []
    const list = Array.from(files).slice(0, room)
    for (const file of list) {
      try {
        if (!isAcceptedImageType(file)) {
          toast.error(`«${file.name}»: الصيغة غير مدعومة — استخدم JPG أو PNG أو WEBP`)
          continue
        }
        const dataUrl = await compressImageToDataUrl(file)
        added.push(dataUrl)
      } catch (err) {
        toast.error(`«${file.name}»: ${err instanceof Error ? err.message : 'تعذر رفع الصورة'}`)
      }
    }
    if (list.length < files.length) {
      toast.info(`تم رفع أول ${room} صور فقط — الحد الأقصى ${MAX_PRODUCT_IMAGES}`)
    }
    if (added.length > 0) {
      onChange([...images, ...added])
      toast.success(`تمت إضافة ${added.length} ${added.length === 1 ? 'صورة' : 'صور'} ✓`)
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeAt(i: number) {
    onChange(images.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const next = [...images]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-xs font-bold">📷 صور المنتج</Label>
          <p className="text-[11px] text-muted-foreground">
            أول صورة هي الرئيسية — تُضغط تلقائيًا (أقصى بعد 900px) قبل الحفظ • الحد الأقصى{' '}
            {MAX_PRODUCT_IMAGES} صور
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= MAX_PRODUCT_IMAGES}
          className="h-10 min-w-11 gap-1.5 text-xs font-bold"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الضغط…
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4" />
              إضافة صور
            </>
          )}
        </Button>
      </div>

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary/50 hover:bg-accent/50"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs font-semibold">
            {uploading ? 'جاري معالجة الصورة…' : `اضف صورة لـ «${productName.trim() || 'المنتج'}»`}
          </span>
          <span className="text-[10px]">JPG / PNG / WEBP</span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <div
              key={`${i}-${img.slice(-32)}`}
              className="group relative overflow-hidden rounded-lg border bg-background"
            >
              <img
                src={img}
                alt={`صورة ${i + 1}`}
                className="aspect-square h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              {i === 0 && (
                <span className="absolute start-1 top-1 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground shadow">
                  <Star className="h-2.5 w-2.5" />
                  الرئيسية
                </span>
              )}
              {/* ترتيب بالأزرار (أول صورة = الرئيسية) */}
              <div className="absolute bottom-1 start-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="تحريك لليمين (تقديم الترتيب)"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  aria-label="تحريك لليسار (تأخير الترتيب)"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow transition hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`حذف الصورة ${i + 1}`}
                className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow transition hover:scale-105 hover:bg-destructive/90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_PRODUCT_IMAGES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary/50 hover:bg-accent/50'
              )}
              aria-label="إضافة صورة أخرى"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span className="text-[10px] font-semibold">صورة أخرى</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function cnStock(stock: number): string {
  if (stock === 0) return 'border-red-200 bg-red-50 text-red-700'
  if (stock < 10) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}
