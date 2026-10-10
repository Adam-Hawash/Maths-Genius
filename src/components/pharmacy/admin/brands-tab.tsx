'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

type BrandRow = {
  id: string
  name: string
  slug: string
  color: string
  featured: boolean
  productCount: number
}

const COLOR_PRESETS = [
  '#0E7490', '#1D4ED8', '#0F766E', '#374151', '#B91C1C', '#DB2777',
  '#7C3AED', '#B45309', '#0284C7', '#0D9488', '#15803D', '#DC2626',
]

export function BrandsTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [rows, setRows] = useState<BrandRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BrandRow | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0E7490')
  const [featured, setFeatured] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/admin/brands', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const data = (await res.json()) as { brands?: BrandRow[] }
      setRows(data.brands || [])
    } catch {
      toast.error('تعذر تحميل الماركات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, reloadKey])

  function openAdd() {
    setEditing(null)
    setName('')
    setColor('#0E7490')
    setFeatured(true)
    setDialogOpen(true)
  }

  function openEdit(r: BrandRow) {
    setEditing(r)
    setName(r.name)
    setColor(r.color)
    setFeatured(r.featured)
    setDialogOpen(true)
  }

  async function save() {
    if (name.trim().length < 2) {
      toast.error('اسم الماركة مطلوب')
      return
    }
    setSaving(true)
    try {
      const res = editing
        ? await fetch(`/api/pharmacy/admin/brands/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, color, featured }),
          })
        : await fetch('/api/pharmacy/admin/brands', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, color, featured }),
          })
      const data = (await res.json()) as { brand?: unknown; error?: string }
      if (!res.ok || !data.brand) {
        toast.error(data.error || 'تعذر الحفظ')
        return
      }
      toast.success(editing ? 'تم تحديث الماركة ✓' : 'تمت إضافة الماركة ✓')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function toggleFeatured(r: BrandRow) {
    try {
      const res = await fetch(`/api/pharmacy/admin/brands/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ featured: !r.featured }),
      })
      if (!res.ok) {
        toast.error('تعذر التحديث')
        return
      }
      setRows((prev) => prev.map((b) => (b.id === r.id ? { ...b, featured: !r.featured } : b)))
    } catch {
      toast.error('حدث خطأ')
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pharmacy/admin/brands/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'تعذر الحذف')
        return
      }
      toast.success('تم حذف الماركة ✓')
      setDeleteTarget(null)
      await load()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-base font-extrabold">
          الماركات <Badge variant="secondary">{rows.length}</Badge>
        </h2>
        <Button type="button" onClick={openAdd} className="h-10 gap-1.5 font-extrabold">
          <Plus className="h-4 w-4" />
          إضافة ماركة
        </Button>
      </div>

      {loading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </p>
      ) : (
        <div className="ph-scroll max-h-[65vh] space-y-2 overflow-y-auto rounded-xl border bg-card p-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
              <span
                className="flex h-10 min-w-20 items-center justify-center rounded-lg px-3 text-sm font-extrabold"
                style={{ color: r.color, backgroundColor: `${r.color}18` }}
                dir="ltr"
              >
                {r.name}
              </span>
              <div className="hidden min-w-0 flex-1 text-xs text-muted-foreground sm:block" dir="ltr">
                {r.slug}
              </div>
              <Badge variant="secondary">{r.productCount} منتج</Badge>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={r.featured}
                  onCheckedChange={() => toggleFeatured(r)}
                  aria-label={`تمييز ${r.name}`}
                />
                <span className="text-[11px] text-muted-foreground">مميزة</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => openEdit(r)}
                aria-label={`تعديل ${r.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(r)}
                aria-label={`حذف ${r.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-start">
            <DialogTitle>{editing ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}</DialogTitle>
            <DialogDescription>الماركات المميزة تظهر في شريط الماركات بالصفحة الرئيسية</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">اسم الماركة *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: La Roche-Posay"
                dir="ltr"
                className="h-11 text-start"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">اللون</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`لون ${c}`}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      color === c ? 'scale-110 border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-xs font-bold">ماركة مميزة</Label>
                <p className="text-[11px] text-muted-foreground">تظهر في شريط الماركات</p>
              </div>
              <Switch checked={featured} onCheckedChange={setFeatured} />
            </div>
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
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الماركة؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن الحذف لو الماركة مربوطة بمنتجات ({deleteTarget?.productCount} منتج).
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
