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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Plus, Pencil, Trash2, Loader2, TicketPercent } from 'lucide-react'

type PromoRow = {
  id: string
  code: string
  type: string
  value: number
  minTotal: number
  active: boolean
}

export function PromosTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [rows, setRows] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PromoRow | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState('percent')
  const [value, setValue] = useState('10')
  const [minTotal, setMinTotal] = useState('0')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PromoRow | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/admin/promos', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const data = (await res.json()) as { promos?: PromoRow[] }
      setRows(data.promos || [])
    } catch {
      toast.error('تعذر تحميل الأكواد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, reloadKey])

  function openAdd() {
    setEditing(null)
    setCode('')
    setType('percent')
    setValue('10')
    setMinTotal('0')
    setActive(true)
    setDialogOpen(true)
  }

  function openEdit(r: PromoRow) {
    setEditing(r)
    setCode(r.code)
    setType(r.type)
    setValue(String(r.value))
    setMinTotal(String(r.minTotal))
    setActive(r.active)
    setDialogOpen(true)
  }

  async function save() {
    if (code.trim().length < 3) {
      toast.error('الكود يجب أن يكون 3 أحرف على الأقل')
      return
    }
    const val = Number(value)
    if (!Number.isFinite(val) || val <= 0) {
      toast.error('قيمة الخصم غير صحيحة')
      return
    }
    setSaving(true)
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value: val,
        minTotal: Number(minTotal) || 0,
        active,
      }
      const res = editing
        ? await fetch(`/api/pharmacy/admin/promos/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/pharmacy/admin/promos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          })
      const data = (await res.json()) as { promo?: unknown; error?: string }
      if (!res.ok || !data.promo) {
        toast.error(data.error || 'تعذر الحفظ')
        return
      }
      toast.success(editing ? 'تم تحديث الكود ✓' : 'تمت إضافة الكود ✓')
      setDialogOpen(false)
      await load()
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(r: PromoRow) {
    try {
      const res = await fetch(`/api/pharmacy/admin/promos/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !r.active }),
      })
      if (!res.ok) {
        toast.error('تعذر التحديث')
        return
      }
      setRows((prev) => prev.map((p) => (p.id === r.id ? { ...p, active: !r.active } : p)))
    } catch {
      toast.error('حدث خطأ')
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pharmacy/admin/promos/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        toast.error('تعذر الحذف')
        return
      }
      toast.success('تم حذف الكود ✓')
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
          أكواد الخصم <Badge variant="secondary">{rows.length}</Badge>
        </h2>
        <Button type="button" onClick={openAdd} className="h-10 gap-1.5 font-extrabold">
          <Plus className="h-4 w-4" />
          إضافة كود
        </Button>
      </div>

      {loading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          لا توجد أكواد خصم بعد
        </p>
      ) : (
        <div className="ph-scroll max-h-[65vh] space-y-2 overflow-y-auto rounded-xl border bg-card p-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <TicketPercent className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-black tracking-wider" dir="ltr">
                  {r.code}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.type === 'percent' ? `خصم ${r.value}%` : `خصم ${r.value} ج.م`}
                  {r.minTotal > 0 ? ` — للطلبات من ${r.minTotal} ج.م` : ' — بدون حد أدنى'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} aria-label={`تفعيل ${r.code}`} />
                <span className="text-[11px] text-muted-foreground">{r.active ? 'مُفعّل' : 'موقوف'}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => openEdit(r)}
                aria-label={`تعديل ${r.code}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteTarget(r)}
                aria-label={`حذف ${r.code}`}
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
            <DialogTitle>{editing ? 'تعديل كود الخصم' : 'إضافة كود خصم'}</DialogTitle>
            <DialogDescription>الكود يُطبَّق على إجمالي الطلب بعد خصم العروض</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">الكود *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                dir="ltr"
                className="h-11 font-mono text-start tracking-wider"
                disabled={Boolean(editing)}
              />
              {editing && (
                <p className="text-[11px] text-muted-foreground">لا يمكن تعديل نص الكود بعد الإنشاء</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">نسبة مئوية %</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت ج.م</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{type === 'percent' ? 'النسبة %' : 'المبلغ ج.م'}</Label>
              <Input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-11"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold">الحد الأدنى للطلب (ج.م)</Label>
              <Input
                type="number"
                min={0}
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                className="h-11"
                inputMode="numeric"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
              <div>
                <Label className="text-xs font-bold">مُفعّل</Label>
                <p className="text-[11px] text-muted-foreground">الكودات الموقوفة لن تعمل في المتجر</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الكود؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف كود «{deleteTarget?.code}» نهائيًا ولن يعمل بعد الآن.
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
