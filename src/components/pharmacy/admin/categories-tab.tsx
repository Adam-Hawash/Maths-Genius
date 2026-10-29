'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Pencil, Trash2, Loader2, Smile } from 'lucide-react'
import { GROUP_LABELS, EMOJI_PRESET } from '@/lib/types'
import { cn } from '@/lib/utils'

type CategoryRow = {
  id: string
  name: string
  slug: string
  group: string
  emoji: string
  sortOrder: number
  productCount: number
}

export function CategoriesTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [name, setName] = useState('')
  const [group, setGroup] = useState('health')
  const [emoji, setEmoji] = useState('💊')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const data = (await res.json()) as { categories?: CategoryRow[] }
      setRows(data.categories || [])
    } catch {
      toast.error('تعذر تحميل الفئات')
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
    setGroup('health')
    setEmoji('💊')
    setDialogOpen(true)
  }

  function openEdit(r: CategoryRow) {
    setEditing(r)
    setName(r.name)
    setGroup(r.group)
    setEmoji(r.emoji)
    setDialogOpen(true)
  }

  async function save() {
    if (name.trim().length < 2) {
      toast.error('اسم الفئة مطلوب')
      return
    }
    setSaving(true)
    try {
      const res = editing
        ? await fetch(`/api/pharmacy/admin/categories/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, group, emoji }),
          })
        : await fetch('/api/pharmacy/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, group, emoji }),
          })
      const data = (await res.json()) as { category?: unknown; error?: string }
      if (!res.ok || !data.category) {
        toast.error(data.error || 'تعذر الحفظ')
        return
      }
      toast.success(editing ? 'تم تحديث الفئة ✓' : 'تمت إضافة الفئة ✓')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pharmacy/admin/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'تعذر الحذف')
        return
      }
      toast.success('تم حذف الفئة ✓')
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
          الفئات <Badge variant="secondary">{rows.length}</Badge>
        </h2>
        <Button type="button" onClick={openAdd} className="h-10 gap-1.5 font-extrabold">
          <Plus className="h-4 w-4" />
          إضافة فئة
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
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
                {r.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {r.slug}
                </p>
              </div>
              <Badge variant="outline">{GROUP_LABELS[r.group] || r.group}</Badge>
              <Badge variant="secondary">{r.productCount} منتج</Badge>
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
            <DialogTitle>{editing ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</DialogTitle>
            <DialogDescription>الفئات تظهر في شريط الأقسام وتُستخدم لتنظيم المنتجات</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">اسم الفئة *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فيتامينات ومكملات"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">المجموعة</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUP_LABELS).map(([id, label]) => (
                    <SelectItem key={id} value={id}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">الإيموجي</Label>
              <div className="flex flex-wrap gap-1 rounded-lg border p-2">
                {EMOJI_PRESET.slice(0, 24).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-accent',
                      emoji === e && 'bg-accent ring-2 ring-primary'
                    )}
                    aria-label={`اختيار ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Smile className="h-3.5 w-3.5" />
                المختار: {emoji}
              </p>
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
            <AlertDialogTitle>حذف الفئة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{deleteTarget?.name}». لا يمكن الحذف لو الفئة فيها منتجات.
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
