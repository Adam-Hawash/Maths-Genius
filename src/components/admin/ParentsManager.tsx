'use client'

// ============================================================
// (2026-و90) ParentsManager — تاب «أولياء الأمور» في لوحة الأدمن
//   طلب المستر الحرفي: «اعمللي تاب جديد في صفحة الأدمن جنب قسم الطلاب
//   أو خليها جوه قسم الطلاب — كلمة أولياء الأمور، أول ما أضغط عليها
//   يجيب لي أولياء الأمور اللي في المنصة فأقدر أمسح فيهم».
//
//   - عرض كل أولياء الأمور: الاسم + الرقم + الأبناء + عدد أجهزة الإشعارات
//     + عدد الإشعارات + تاريخ التسجيل
//   - بحث فوري بالاسم/الرقم/اسم الابن
//   - حذف نهائي بتأكيد — بيمسح حساب ولي الأمر وروابط أبنائه وإشعاراته
//     وأجهزته المشتركة — وما بيلمس الطالب ولا درجاته خالص
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { UserCheck, Users, Smartphone, BellRing, Trash2, Search, RefreshCw, Loader2, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

interface ParentRow {
  id: string
  name: string
  phone: string
  createdAt: string
  students: Array<{ id: string; name: string; phone: string; grade?: string }>
  pushDevices: number
  notifications: number
}

function formatDate(v: string): string {
  try {
    if (!v) return '—'
    var d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch (e) {
    return String(v || '—')
  }
}

export function ParentsManager({ adminId }: { adminId: string }) {
  const [parents, setParents] = useState<ParentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmFor, setConfirmFor] = useState<ParentRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadParents = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const res = await fetch('/api/admin/parents?adminId=' + encodeURIComponent(adminId), { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'خطأ في تحميل أولياء الأمور', { duration: 8000 })
        setParents([])
      } else {
        setParents(data.parents || [])
      }
    } catch {
      toast.error('خطأ في الاتصال — جرب تحميل تاني')
    }
    setLoading(false)
  }

  useEffect(() => { loadParents() }, [adminId])

  /* بحث فوري: اسم ولي الأمر / رقمه / اسم الابن / رقم الابن (بفهم الأرقام العربية) */
  const filtered = useMemo(() => {
    const norm = (v: any) => String(v || '').replace(/[٠-٩]/g, (x) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).trim().toLowerCase()
    const q = norm(search)
    if (!q) return parents
    return parents.filter((p) => {
      if (norm(p.name).includes(q) || norm(p.phone).includes(q)) return true
      for (var i = 0; i < (p.students || []).length; i++) {
        if (norm(p.students[i].name).includes(q) || norm(p.students[i].phone).includes(q)) return true
      }
      return false
    })
  }, [parents, search])

  const handleDelete = async () => {
    if (!confirmFor || deleting) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/parents?adminId=' + encodeURIComponent(adminId), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmFor.id }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success('تم مسح حساب ولي الأمر («' + (confirmFor.name || confirmFor.phone) + '») نهائيًا — الطالب ودرجاته ما اتلمسوش')
        setConfirmFor(null)
        loadParents(false)
      } else {
        toast.error(data.error || 'فشل الحذف — جرب تاني', { duration: 8000 })
      }
    } catch {
      toast.error('خطأ في الاتصال — جرب تاني')
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="shrink-0 h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-lg">أولياء الأمور</CardTitle>
                <p className="text-xs text-muted-foreground">كل اللي عملوا حساب متابعة لأولادهم — تقدر تمسح منهم</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الرقم أو اسم الابن…" className="pr-9 w-full sm:w-72 min-h-[40px]" />
              </div>
              <Button size="icon" variant="outline" className="h-10 w-10 shrink-0" onClick={() => loadParents()} aria-label="تحديث القائمة">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <UserCheck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">{search ? 'مفيش نتيجة للبحث ده' : 'مفيش أولياء أمور مسجلين لسه'}</p>
              <p className="text-xs text-muted-foreground mt-1">{search ? 'جرب اسم أو رقم تاني' : 'أول ما واحد يعمل حساب متابعة هيظهر هنا'}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 [scrollbar-width:thin]">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card px-3.5 py-3 flex items-center justify-between gap-3 flex-wrap hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">{p.name || 'ولي أمر'}</p>
                      <span className="text-xs text-muted-foreground" dir="ltr">{p.phone}</span>
                      {p.pushDevices > 0 ? (
                        <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500/30 text-emerald-600 bg-emerald-500/[0.06]">
                          <Smartphone className="h-3 w-3" />{p.pushDevices} جهاز إشعارات
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">مفيش إشعارات مفعّلة</Badge>
                      )}
                      {p.notifications > 0 && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <BellRing className="h-3 w-3" />{p.notifications} إشعار
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      {(p.students || []).length > 0 ? (
                        p.students.map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                            <GraduationCap className="h-3 w-3 text-primary" />{s.name}{s.grade ? ' — ' + s.grade : ''}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">⚠️ حسابه مش مربوط بطالب (الطالب ممكن يكون اتمسح)</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">مسجل من {formatDate(p.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                    onClick={() => setConfirmFor(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    مسح
                  </Button>
                </div>
              ))}
            </div>
          )}
          {!loading && parents.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              الإجمالي: {parents.length} ولي أمر{search && filtered.length !== parents.length ? ' — منهم ' + filtered.length + ' في نتايج البحث' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmFor} onOpenChange={(v) => { if (!v) setConfirmFor(null) }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تمسح حساب ولي الأمر ده نهائيًا؟</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              «{confirmFor?.name || confirmFor?.phone}» — هيتمسح حسابه ورقمه وكل إشعاراته وأجهزته المفعّلة
              {confirmFor && confirmFor.students.length > 0 ? (
                <> — بس <span className="font-bold text-foreground">الطلاب نفسهم ودرجاتهم مش هتتلمس</span> (أبناءه: {confirmFor.students.map((s) => s.name).join('، ')})</>
              ) : null}
              . الحذف مفيش له رجعة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>سيبك — متمسحوش</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 ml-1.5 animate-spin" /> : <Trash2 className="h-4 w-4 ml-1.5" />}
              {deleting ? 'جاري المسح…' : 'امسحه نهائيًا'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
