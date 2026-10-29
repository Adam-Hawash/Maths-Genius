'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePharmacy, fmtEGP, type Product, type Category, type Brand } from './store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Pill, LogOut, LayoutDashboard, Package, FolderTree, Tag, ShoppingBag, TicketPercent, Settings2, Plus, Pencil, Trash2, Search, Store, ArrowRight, TrendingUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const TAG_OPTIONS = [
  { id: 'featured', label: 'الأكثر رواجًا' },
  { id: 'sale', label: 'تخفيض' },
  { id: 'offer40', label: 'عرض 1+40%' },
  { id: 'bundle', label: 'باكند' },
  { id: 'new', label: 'جديد' },
  { id: 'kbeauty', label: 'K-Beauty' },
  { id: 'dermo', label: 'ديرمو' },
]
const GROUP_OPTIONS = [
  { id: 'health', label: 'الصحة والعافية' },
  { id: 'beauty', label: 'الجمال والتجميل' },
  { id: 'baby', label: 'الأم والطفل' },
  { id: 'special', label: 'أقسام متخصصة' },
]
const ORDER_STATUSES = [
  { id: 'pending', label: 'جديد', color: 'bg-amber-100 text-amber-700' },
  { id: 'confirmed', label: 'مؤكد', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'shipped', label: 'تم الشحن', color: 'bg-blue-100 text-blue-700' },
  { id: 'delivered', label: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'cancelled', label: 'ملغي', color: 'bg-rose-100 text-rose-600' },
]

type OrderRow = {
  id: number; orderNumber: string; customerName: string; phone: string; city: string
  area: string; address: string; notes: string; shippingMethod: string; shippingFee: number
  subtotal: number; discount: number; offerDiscount: number; promoCode: string
  total: number; status: string; createdAt: string
  items: { id: number; name: string; price: number; qty: number; emoji: string }[]
}
type PromoRow = { id: number; code: string; type: string; value: number; minTotal: number; active: boolean }
type Stats = {
  totalOrders: number; totalProducts: number; pendingOrders: number; revenue: number
  recent: OrderRow[]
  lowStock: { id: number; name: string; stock: number; emoji: string }[]
}

export default function AdminPortal() {
  const { setView, loadCatalog } = usePharmacy()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    toast.success('تم تسجيل الخروج')
  }

  const refreshCatalog = () => loadCatalog()

  if (authed === null) {
    return <div className="min-h-screen grid place-items-center bg-gray-50"><div className="animate-pulse text-gray-400 font-bold">جارٍ التحميل...</div></div>
  }

  if (!authed) {
    return <AdminLogin onOk={() => setAuthed(true)} onBack={() => setView({ name: 'home' })} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin header */}
      <header className="bg-cyan-950 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-cyan-600 grid place-items-center"><Pill className="size-4" /></span>
            <span className="font-extrabold text-sm">لوحة تحكم صيدلية د. وليد الطحاوي</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-cyan-200 hover:text-white hover:bg-white/10 gap-1.5" onClick={() => setView({ name: 'home' })}>
              <Store className="size-4" /> <span className="hidden sm:inline">عرض المتجر</span>
            </Button>
            <Button size="sm" variant="ghost" className="text-rose-300 hover:text-rose-200 hover:bg-white/10 gap-1.5" onClick={logout}>
              <LogOut className="size-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-5">
        <Tabs defaultValue="overview" dir="rtl">
          <TabsList className="bg-white border border-gray-200 h-auto flex-wrap justify-start gap-1 p-1.5 rounded-xl w-full mb-5">
            {[
              { v: 'overview', icon: LayoutDashboard, t: 'نظرة عامة' },
              { v: 'products', icon: Package, t: 'المنتجات' },
              { v: 'categories', icon: FolderTree, t: 'الفئات' },
              { v: 'brands', icon: Tag, t: 'الماركات' },
              { v: 'orders', icon: ShoppingBag, t: 'الطلبات' },
              { v: 'promos', icon: TicketPercent, t: 'أكواد الخصم' },
              { v: 'settings', icon: Settings2, t: 'الإعدادات' },
            ].map(x => (
              <TabsTrigger key={x.v} value={x.v} className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white gap-1.5 text-xs sm:text-sm px-3 py-1.5">
                <x.icon className="size-4" /> {x.t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview"><OverviewSection /></TabsContent>
          <TabsContent value="products"><ProductsSection onChange={refreshCatalog} /></TabsContent>
          <TabsContent value="categories"><CategoriesSection onChange={refreshCatalog} /></TabsContent>
          <TabsContent value="brands"><BrandsSection onChange={refreshCatalog} /></TabsContent>
          <TabsContent value="orders"><OrdersSection /></TabsContent>
          <TabsContent value="promos"><PromosSection /></TabsContent>
          <TabsContent value="settings"><SettingsSection onSaved={refreshCatalog} /></TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

/* ─────────────── Login ─────────────── */
function AdminLogin({ onOk, onBack }: { onOk: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(`أهلاً بيك تاني يا ${data.name} 👋`)
        onOk()
      } else {
        toast.error(data.error || 'بيانات الدخول غير صحيحة')
      }
    } catch {
      toast.error('حصل خطأ في الاتصال')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-teal-900 to-cyan-950 grid place-items-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 space-y-5">
        <div className="text-center space-y-2">
          <span className="size-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white grid place-items-center mx-auto shadow-lg">
            <Pill className="size-7" />
          </span>
          <h1 className="text-lg font-extrabold text-gray-900">لوحة تحكم الصيدلية</h1>
          <p className="text-xs text-gray-400">ادخل بيانات حساب الأدمن للمتابعة</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" dir="ltr" className="h-11 text-right" placeholder="admin@..." />
          </div>
          <div className="space-y-1.5">
            <Label>كلمة المرور</Label>
            <Input value={password} onChange={e => setPassword(e.target.value)} type="password" dir="ltr" className="h-11 text-right"
              onKeyDown={e => { if (e.key === 'Enter') submit() }} placeholder="••••••••" />
          </div>
          <Button className="w-full h-11 bg-cyan-700 hover:bg-cyan-800 font-bold" onClick={submit} disabled={busy}>
            {busy ? 'جارٍ الدخول...' : 'دخول'}
          </Button>
          <Button variant="ghost" className="w-full text-gray-400 gap-1.5" onClick={onBack}>
            <ArrowRight className="size-4" /> رجوع للمتجر
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Overview ─────────────── */
function OverviewSection() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => setStats(null))
  }, [])

  if (!stats) return <div className="text-center text-gray-400 py-10 animate-pulse">جارٍ التحميل...</div>

  const cards = [
    { icon: TrendingUp, label: 'إجمالي المبيعات', value: fmtEGP(stats.revenue), cls: 'bg-emerald-50 text-emerald-600' },
    { icon: ShoppingBag, label: 'إجمالي الطلبات', value: String(stats.totalOrders), cls: 'bg-cyan-50 text-cyan-600' },
    { icon: AlertTriangle, label: 'طلبات جديدة', value: String(stats.pendingOrders), cls: 'bg-amber-50 text-amber-600' },
    { icon: Package, label: 'عدد المنتجات', value: String(stats.totalProducts), cls: 'bg-teal-50 text-teal-600' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4">
            <span className={`size-10 rounded-xl grid place-items-center mb-2 ${c.cls}`}><c.icon className="size-5" /></span>
            <div className="text-xl font-extrabold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-400 font-semibold">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h3 className="font-bold text-sm text-gray-800 mb-3">أحدث الطلبات</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pharmacy-scroll">
            {stats.recent.map(o => (
              <div key={o.id} className="flex items-center gap-3 text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="font-bold text-cyan-800 text-xs" dir="ltr">{o.orderNumber}</span>
                <span className="flex-1 truncate text-gray-600">{o.customerName} — {o.city}</span>
                <span className="font-extrabold text-gray-800 text-xs">{fmtEGP(o.total)}</span>
                <Badge className={`text-[10px] border-0 ${ORDER_STATUSES.find(s => s.id === o.status)?.color}`}>
                  {ORDER_STATUSES.find(s => s.id === o.status)?.label}
                </Badge>
              </div>
            ))}
            {stats.recent.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">مفيش طلبات لسه</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <h3 className="font-bold text-sm text-gray-800 mb-3">⚠️ منتجات قربت تخلص</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pharmacy-scroll">
            {stats.lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-3 text-sm border-b border-gray-50 pb-2 last:border-0">
                <span className="text-lg">{p.emoji}</span>
                <span className="flex-1 truncate text-gray-600">{p.name}</span>
                <Badge variant="destructive" className="text-[10px]">باقي {p.stock}</Badge>
              </div>
            ))}
            {stats.lowStock.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">كل المنتجات متوفرة ✅</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Products ─────────────── */
type ProductForm = {
  id?: number; name: string; description: string; price: number | string; oldPrice: number | string
  emoji: string; skinType: string; size: string; stock: number | string; tags: string[]
  brandId: string; categoryId: string
}
const emptyProduct: ProductForm = {
  name: '', description: '', price: '', oldPrice: '', emoji: '💊', skinType: '', size: '',
  stock: 50, tags: [], brandId: 'none', categoryId: 'none',
}

function ProductsSection({ onChange }: { onChange: () => void }) {
  const { products, brands, categories } = usePharmacy()
  const [q, setQ] = useState('')
  const [form, setForm] = useState<ProductForm | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return products
    return products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      (p.brand?.name || '').toLowerCase().includes(s) ||
      (p.category?.name || '').includes(q.trim())
    )
  }, [products, q])

  const save = async () => {
    if (!form) return
    if (!form.name.trim() || !form.price) { toast.error('الاسم والسعر مطلوبين'); return }
    setBusy(true)
    const payload = {
      name: form.name, description: form.description,
      price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      emoji: form.emoji, skinType: form.skinType, size: form.size,
      stock: Number(form.stock) || 0, tags: form.tags.join(','),
      brandId: form.brandId !== 'none' ? Number(form.brandId) : null,
      categoryId: form.categoryId !== 'none' ? Number(form.categoryId) : null,
    }
    try {
      const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(form.id ? 'اتعدل المنتج ✅' : 'اتضاف المنتج ✅')
        setForm(null)
        onChange()
      } else toast.error(data.error || 'حصل خطأ')
    } catch { toast.error('حصل خطأ في الاتصال') } finally { setBusy(false) }
  }

  const doDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok && data.ok) { toast.success('اتحذف المنتج'); onChange() }
      else toast.error(data.error || 'مش قادر أحذف')
    } catch { toast.error('حصل خطأ') } finally { setDeleteId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الماركة أو الفئة..." className="pr-9" />
        </div>
        <Button className="bg-cyan-700 hover:bg-cyan-800 gap-1.5" onClick={() => setForm({ ...emptyProduct })}>
          <Plus className="size-4" /> منتج جديد
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-right p-3 font-semibold">المنتج</th>
                <th className="text-right p-3 font-semibold">الفئة</th>
                <th className="text-right p-3 font-semibold">الماركة</th>
                <th className="text-right p-3 font-semibold">السعر</th>
                <th className="text-right p-3 font-semibold">المخزون</th>
                <th className="text-right p-3 font-semibold">الوسوم</th>
                <th className="text-right p-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <span className="font-semibold text-gray-800 line-clamp-1 max-w-56">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">{p.category?.name || '—'}</td>
                  <td className="p-3 text-gray-500 text-xs">{p.brand?.name || '—'}</td>
                  <td className="p-3">
                    <span className="font-bold text-cyan-800 text-xs">{fmtEGP(p.price)}</span>
                    {p.oldPrice ? <div className="text-[10px] text-gray-400 line-through">{fmtEGP(p.oldPrice)}</div> : null}
                  </td>
                  <td className="p-3">
                    <Badge className={`text-[10px] border-0 ${p.stock > 10 ? 'bg-emerald-100 text-emerald-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>
                      {p.stock}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-40">
                      {(p.tags || '').split(',').filter(Boolean).map(t => (
                        <Badge key={t} variant="secondary" className="text-[9px]">{TAG_OPTIONS.find(x => x.id === t)?.label || t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="size-8 text-cyan-600 hover:bg-cyan-50"
                        onClick={() => setForm({
                          id: p.id, name: p.name, description: p.description, price: p.price,
                          oldPrice: p.oldPrice ?? '', emoji: p.emoji, skinType: p.skinType, size: p.size,
                          stock: p.stock, tags: (p.tags || '').split(',').filter(Boolean),
                          brandId: String(p.brandId ?? 'none'), categoryId: String(p.categoryId ?? 'none'),
                        })} aria-label="تعديل">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteId(p.id)} aria-label="حذف">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">مفيش نتائج للبحث ده</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={!!form} onOpenChange={o => { if (!o) setForm(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? 'تعديل منتج' : 'منتج جديد'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>اسم المنتج *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5"><Label>السعر (ج.م) *</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>السعر قبل الخصم</Label>
                  <Input type="number" value={form.oldPrice} onChange={e => setForm({ ...form, oldPrice: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>المخزون</Label>
                  <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5"><Label>الإيموجي</Label>
                  <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="text-center" /></div>
                <div className="space-y-1.5"><Label>الحجم/العبوة</Label>
                  <Input value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} placeholder="50 مل" /></div>
                <div className="space-y-1.5"><Label>أنواع البشرة</Label>
                  <Input value={form.skinType} onChange={e => setForm({ ...form, skinType: e.target.value })} placeholder="دهنية,جافة" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>الفئة</Label>
                  <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="none">بدون فئة</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.emoji} {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>الماركة</Label>
                  <Select value={form.brandId} onValueChange={v => setForm({ ...form, brandId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-56">
                      <SelectItem value="none">بدون ماركة</SelectItem>
                      {brands.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
              </div>
              <div className="space-y-1.5"><Label>الوسوم</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(t => (
                    <label key={t.id} className={`cursor-pointer text-xs px-3 py-1.5 rounded-full border transition ${form.tags.includes(t.id) ? 'bg-cyan-700 text-white border-cyan-700' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300'}`}>
                      <input type="checkbox" className="sr-only" checked={form.tags.includes(t.id)}
                        onChange={e => setForm({ ...form, tags: e.target.checked ? [...form.tags, t.id] : form.tags.filter(x => x !== t.id) })} />
                      {t.label}
                    </label>
                  ))}
                </div></div>
              <div className="space-y-1.5"><Label>الوصف</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <Button className="w-full bg-cyan-700 hover:bg-cyan-800 h-10" onClick={save} disabled={busy}>
                {busy ? 'جارٍ الحفظ...' : 'حفظ المنتج'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>متأكد من حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>المنتج هيتشال من المتجر نهائيًا — مش هتقدر ترجعه.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={doDelete}>حذف نهائي</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─────────────── Categories ─────────────── */
function CategoriesSection({ onChange }: { onChange: () => void }) {
  const { categories } = usePharmacy()
  const [form, setForm] = useState<null | { id?: number; name: string; emoji: string; group: string; description: string; sortOrder: number | string }>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const save = async () => {
    if (!form?.name.trim()) { toast.error('الاسم مطلوب'); return }
    const payload = { name: form.name, emoji: form.emoji, group: form.group, description: form.description, sortOrder: Number(form.sortOrder) || 99 }
    const res = await fetch(form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.ok && data.ok) { toast.success('تم الحفظ ✅'); setForm(null); onChange() }
    else toast.error(data.error || 'حصل خطأ')
  }

  const doDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/admin/categories/${deleteId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok && data.ok) { toast.success('تم الحذف'); onChange() }
    else toast.error(data.error || 'مش قادر أحذف')
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-cyan-700 hover:bg-cyan-800 gap-1.5" onClick={() => setForm({ name: '', emoji: '🧴', group: 'health', description: '', sortOrder: 99 })}>
          <Plus className="size-4" /> فئة جديدة
        </Button>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-right p-3 font-semibold">الفئة</th>
              <th className="text-right p-3 font-semibold">المجموعة</th>
              <th className="text-right p-3 font-semibold">الترتيب</th>
              <th className="text-right p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="p-3"><span className="text-lg ml-1">{c.emoji}</span><span className="font-semibold text-gray-800">{c.name}</span></td>
                <td className="p-3 text-gray-500 text-xs">{GROUP_OPTIONS.find(g => g.id === c.group)?.label || c.group}</td>
                <td className="p-3 text-gray-400 text-xs">{c.sortOrder}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-8 text-cyan-600 hover:bg-cyan-50"
                      onClick={() => setForm({ id: c.id, name: c.name, emoji: c.emoji, group: c.group, description: c.description, sortOrder: c.sortOrder })} aria-label="تعديل">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-rose-500 hover:bg-rose-50" onClick={() => setDeleteId(c.id)} aria-label="حذف">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!form} onOpenChange={o => { if (!o) setForm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form?.id ? 'تعديل فئة' : 'فئة جديدة'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>الاسم *</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>الإيموجي</Label>
                  <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="text-center" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label>المجموعة</Label>
                  <Select value={form.group} onValueChange={v => setForm({ ...form, group: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GROUP_OPTIONS.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>الترتيب</Label>
                  <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>الوصف</Label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button className="w-full bg-cyan-700 hover:bg-cyan-800" onClick={save}>حفظ</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف الفئة؟</AlertDialogTitle>
            <AlertDialogDescription>مش هتقدر تحذف فئة فيها منتجات.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={doDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─────────────── Brands ─────────────── */
function BrandsSection({ onChange }: { onChange: () => void }) {
  const { brands } = usePharmacy()
  const [form, setForm] = useState<null | { id?: number; name: string; color: string; featured: boolean }>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const save = async () => {
    if (!form?.name.trim()) { toast.error('الاسم مطلوب'); return }
    const res = await fetch(form.id ? `/api/admin/brands/${form.id}` : '/api/admin/brands', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, color: form.color, featured: form.featured }),
    })
    const data = await res.json()
    if (res.ok && data.ok) { toast.success('تم الحفظ ✅'); setForm(null); onChange() }
    else toast.error(data.error || 'حصل خطأ')
  }

  const doDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/admin/brands/${deleteId}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok && data.ok) { toast.success('تم الحذف'); onChange() }
    else toast.error(data.error || 'مش قادر أحذف')
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-cyan-700 hover:bg-cyan-800 gap-1.5" onClick={() => setForm({ name: '', color: '#0e7490', featured: true })}>
          <Plus className="size-4" /> ماركة جديدة
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {brands.map(b => (
          <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
            <div className="h-12 rounded-lg grid place-items-center font-extrabold text-xs text-white" style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}cc)` }}>
              {b.name}
            </div>
            <div className="flex items-center justify-between">
              {b.featured ? <Badge className="bg-cyan-50 text-cyan-700 border-0 text-[9px]">مميزة</Badge> : <span className="text-[9px] text-gray-400">عادية</span>}
              <div className="flex gap-0.5">
                <Button size="icon" variant="ghost" className="size-7 text-cyan-600" onClick={() => setForm({ id: b.id, name: b.name, color: b.color, featured: b.featured })} aria-label="تعديل">
                  <Pencil className="size-3" />
                </Button>
                <Button size="icon" variant="ghost" className="size-7 text-rose-500" onClick={() => setDeleteId(b.id)} aria-label="حذف">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!form} onOpenChange={o => { if (!o) setForm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form?.id ? 'تعديل ماركة' : 'ماركة جديدة'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>الاسم *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} dir="ltr" className="text-right" /></div>
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="space-y-1.5"><Label>اللون</Label>
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer" /></div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} id="featured" />
                  <Label htmlFor="featured">ماركة مميزة</Label>
                </div>
              </div>
              <Button className="w-full bg-cyan-700 hover:bg-cyan-800" onClick={save}>حفظ</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف الماركة؟</AlertDialogTitle>
            <AlertDialogDescription>مش هتقدر تحذف ماركة عليها منتجات.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={doDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ─────────────── Orders ─────────────── */
function OrdersSection() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null)

  const load = useCallback(() => {
    fetch('/api/admin/orders').then(r => r.json()).then(d => setOrders(d.orders ?? [])).catch(() => setOrders([]))
  }, [])
  useEffect(() => { load() }, [load])

  const setStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { toast.success('اتحدثت حالة الطلب'); load() }
    else toast.error('حصل خطأ')
  }

  if (!orders) return <div className="text-center text-gray-400 py-10 animate-pulse">جارٍ التحميل...</div>

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-right p-3 font-semibold">رقم الطلب</th>
                <th className="text-right p-3 font-semibold">العميل</th>
                <th className="text-right p-3 font-semibold">الموبايل</th>
                <th className="text-right p-3 font-semibold">المحافظة</th>
                <th className="text-right p-3 font-semibold">الإجمالي</th>
                <th className="text-right p-3 font-semibold">الحالة</th>
                <th className="text-right p-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="p-3 font-bold text-cyan-800 text-xs" dir="ltr">{o.orderNumber}</td>
                  <td className="p-3 text-gray-700">{o.customerName}</td>
                  <td className="p-3 text-gray-500 text-xs" dir="ltr">{o.phone}</td>
                  <td className="p-3 text-gray-500 text-xs">{o.city}</td>
                  <td className="p-3 font-bold text-gray-800 text-xs">{fmtEGP(o.total)}</td>
                  <td className="p-3">
                    <Select value={o.status} onValueChange={v => setStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-32 text-xs border-0 shadow-none focus:ring-0 p-0">
                        <Badge className={`border-0 ${ORDER_STATUSES.find(s => s.id === o.status)?.color}`}>
                          {ORDER_STATUSES.find(s => s.id === o.status)?.label}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-cyan-200 text-cyan-700" onClick={() => setViewOrder(o)}>
                      التفاصيل
                    </Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">مفيش طلبات لسه</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewOrder} onOpenChange={o => { if (!o) setViewOrder(null) }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2">تفاصيل الطلب <span dir="ltr" className="text-cyan-700">{viewOrder?.orderNumber}</span></DialogTitle></DialogHeader>
          {viewOrder && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><span className="text-gray-400">العميل:</span> <b>{viewOrder.customerName}</b></div>
                <div><span className="text-gray-400">الموبايل:</span> <b dir="ltr">{viewOrder.phone}</b></div>
                <div><span className="text-gray-400">المحافظة:</span> {viewOrder.city} {viewOrder.area && `— ${viewOrder.area}`}</div>
                <div><span className="text-gray-400">الشحن:</span> {viewOrder.shippingMethod === 'sameday' ? 'نفس اليوم' : viewOrder.shippingMethod === 'supersaver' ? 'سوبر سيفر' : 'محافظات'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600">📍 {viewOrder.address}</div>
              {viewOrder.notes && <div className="bg-amber-50 rounded-lg p-2.5 text-xs text-amber-700">📝 {viewOrder.notes}</div>}
              <div className="space-y-1.5">
                {viewOrder.items.map(i => (
                  <div key={i.id} className="flex items-center gap-2 border border-gray-100 rounded-lg p-2">
                    <span>{i.emoji}</span>
                    <span className="flex-1 line-clamp-1 text-xs text-gray-700">{i.name}</span>
                    <span className="text-xs text-gray-400">×{i.qty}</span>
                    <span className="font-bold text-xs">{fmtEGP(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs border-t pt-2">
                <div className="flex justify-between text-gray-500"><span>الفرعي</span><span>{fmtEGP(viewOrder.subtotal)}</span></div>
                {viewOrder.offerDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>خصم العرض التلقائي</span><span>- {fmtEGP(viewOrder.offerDiscount)}</span></div>}
                {viewOrder.discount > 0 && <div className="flex justify-between text-emerald-600"><span>كود {viewOrder.promoCode}</span><span>- {fmtEGP(viewOrder.discount)}</span></div>}
                <div className="flex justify-between text-gray-500"><span>الشحن</span><span>{viewOrder.shippingFee === 0 ? 'مجاني' : fmtEGP(viewOrder.shippingFee)}</span></div>
                <div className="flex justify-between font-extrabold text-cyan-900 text-sm"><span>الإجمالي</span><span>{fmtEGP(viewOrder.total)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─────────────── Promos ─────────────── */
function PromosSection() {
  const [promos, setPromos] = useState<PromoRow[] | null>(null)
  const [form, setForm] = useState<null | { id?: number; code: string; type: string; value: number | string; minTotal: number | string; active: boolean }>(null)

  const load = useCallback(() => {
    fetch('/api/admin/promos').then(r => r.json()).then(d => setPromos(d.promos ?? [])).catch(() => setPromos([]))
  }, [])
  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form?.code.trim()) { toast.error('الكود مطلوب'); return }
    const res = await fetch(form.id ? `/api/admin/promos/${form.id}` : '/api/admin/promos', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: form.code, type: form.type, value: Number(form.value), minTotal: Number(form.minTotal) || 0, active: form.active }),
    })
    const data = await res.json()
    if (res.ok && data.ok) { toast.success('تم الحفظ ✅'); setForm(null); load() }
    else toast.error(data.error || 'حصل خطأ')
  }

  const toggle = async (p: PromoRow) => {
    await fetch(`/api/admin/promos/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, active: !p.active }),
    })
    load()
  }

  const doDelete = async (id: number) => {
    const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('تم الحذف'); load() }
  }

  if (!promos) return <div className="text-center text-gray-400 py-10 animate-pulse">جارٍ التحميل...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="bg-cyan-700 hover:bg-cyan-800 gap-1.5" onClick={() => setForm({ code: '', type: 'percent', value: 10, minTotal: 0, active: true })}>
          <Plus className="size-4" /> كود خصم جديد
        </Button>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-right p-3 font-semibold">الكود</th>
              <th className="text-right p-3 font-semibold">الخصم</th>
              <th className="text-right p-3 font-semibold">أقل قيمة</th>
              <th className="text-right p-3 font-semibold">مفعل</th>
              <th className="text-right p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                <td className="p-3"><Badge variant="secondary" className="font-mono font-bold text-cyan-800" dir="ltr">{p.code}</Badge></td>
                <td className="p-3 font-bold text-gray-800 text-xs">{p.type === 'percent' ? `${p.value}%` : fmtEGP(p.value)}</td>
                <td className="p-3 text-gray-500 text-xs">{p.minTotal ? fmtEGP(p.minTotal) : '—'}</td>
                <td className="p-3"><Switch checked={p.active} onCheckedChange={() => toggle(p)} /></td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-8 text-cyan-600" onClick={() => setForm({ id: p.id, code: p.code, type: p.type, value: p.value, minTotal: p.minTotal, active: p.active })} aria-label="تعديل">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 text-rose-500" onClick={() => doDelete(p.id)} aria-label="حذف">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!form} onOpenChange={o => { if (!o) setForm(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{form?.id ? 'تعديل كود' : 'كود خصم جديد'}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>الكود *</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" className="text-right font-mono" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5"><Label>النوع</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">نسبة %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>القيمة</Label>
                  <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>أقل قيمة</Label>
                  <Input type="number" value={form.minTotal} onChange={e => setForm({ ...form, minTotal: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} id="active" />
                <Label htmlFor="active">مفعل</Label>
              </div>
              <Button className="w-full bg-cyan-700 hover:bg-cyan-800" onClick={save}>حفظ</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─────────────── Settings ─────────────── */
function SettingsSection({ onSaved }: { onSaved: () => void }) {
  const { settings } = usePharmacy()
  const [form, setForm] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setForm(d.settings ?? {})).catch(() => { })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('تم حفظ الإعدادات ✅'); onSaved() }
      else toast.error('حصل خطأ في الحفظ')
    } catch { toast.error('حصل خطأ') } finally { setBusy(false) }
  }

  const FIELDS: { key: string; label: string; area?: boolean }[] = [
    { key: 'announcement', label: 'الشريط الإعلاني (أعلى الموقع)' },
    { key: 'heroTitle', label: 'العنوان الرئيسي (الهيرو)' },
    { key: 'heroSubtitle', label: 'الوصف تحت العنوان', area: true },
    { key: 'phone', label: 'رقم خدمة العملاء' },
    { key: 'email', label: 'البريد الإلكتروني' },
    { key: 'hours', label: 'مواعيد العمل' },
    { key: 'freeShipThreshold', label: 'حد التوصيل المجاني (ج.م)' },
  ]

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-800">إعدادات الموقع العامة</h3>
        {FIELDS.map(f => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            {f.area
              ? <Textarea value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} rows={2} />
              : <Input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} />}
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>الفروع — Store Finder (صيغة JSON)</Label>
          <Textarea
            value={form.storesJson || ''}
            onChange={e => set('storesJson', e.target.value)}
            rows={5}
            dir="ltr"
            className="font-mono text-xs text-right"
          />
        </div>
        <Button className="bg-cyan-700 hover:bg-cyan-800" onClick={save} disabled={busy}>
          {busy ? 'جارٍ الحفظ...' : 'حفظ كل الإعدادات'}
        </Button>
      </div>
    </div>
  )
}
