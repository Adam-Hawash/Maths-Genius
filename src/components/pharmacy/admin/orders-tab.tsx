'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, PackageOpen, RefreshCw } from 'lucide-react'
import { formatEGP, formatDateAr } from '@/lib/format'
import type { OrderDTO } from '@/lib/types'
import {
  ORDER_STATUSES,
  ORDER_STATUS_AR,
  STATUS_BADGE_CLASS,
  SHIPPING_METHODS,
  PAYMENT_METHODS,
} from '@/lib/types'
import { cn } from '@/lib/utils'

export function OrdersTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const data = (await res.json()) as { orders?: OrderDTO[] }
      setOrders(data.orders || [])
    } catch {
      toast.error('تعذر تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, reloadKey])

  async function changeStatus(id: string, status: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/pharmacy/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'تعذر تحديث الحالة')
        return
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      toast.success(`الحالة الجديدة: ${ORDER_STATUS_AR[status]}`)
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.includes(q) ||
        o.phone.includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-base font-extrabold">
          الطلبات <Badge variant="secondary">{filtered.length}</Badge>
        </h2>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الطلب / الاسم / الموبايل"
          className="h-10 w-full sm:w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={load} aria-label="تحديث">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-bold">لا توجد طلبات</p>
            <p className="text-sm text-muted-foreground">الطلبات الجديدة ستظهر هنا فور وصولها</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Card key={o.id}>
              <Collapsible>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="تفاصيل الطلب"
                      >
                        <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]>&]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm font-black" dir="ltr" title={o.orderNumber}>
                        {o.orderNumber}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{formatDateAr(o.createdAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{o.customerName}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {o.phone} — {o.city}
                      </p>
                    </div>
                    <Badge className={cn('border', STATUS_BADGE_CLASS[o.status])}>
                      {ORDER_STATUS_AR[o.status]}
                    </Badge>
                    <span className="text-base font-black text-primary">{formatEGP(o.total)}</span>
                    <Select
                      value={o.status}
                      onValueChange={(v) => changeStatus(o.id, v)}
                      disabled={busyId === o.id}
                    >
                      <SelectTrigger className="h-9 w-36 text-xs" aria-label="تغيير حالة الطلب">
                        {busyId === o.id ? (
                          <span className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" /> تحديث…
                          </span>
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ORDER_STATUS_AR[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-muted-foreground">المنتجات</h4>
                        {o.items.map((i) => (
                          <div key={i.id} className="flex items-center gap-2 text-sm">
                            <span className="text-lg">{i.emoji}</span>
                            <span className="line-clamp-1 flex-1 font-semibold">{i.name}</span>
                            <span className="text-xs text-muted-foreground">×{i.qty}</span>
                            <span className="font-bold">{formatEGP(i.price * i.qty)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="space-y-1 text-xs">
                          <SummaryRow label="المجموع الفرعي" value={formatEGP(o.subtotal)} />
                          {o.offerDiscount > 0 && (
                            <SummaryRow label="خصم العروض" value={`− ${formatEGP(o.offerDiscount)}`} />
                          )}
                          {o.promoDiscount > 0 && (
                            <SummaryRow
                              label={`كود ${o.promoCode || ''}`}
                              value={`− ${formatEGP(o.promoDiscount)}`}
                            />
                          )}
                          <SummaryRow label="الشحن" value={formatEGP(o.shippingFee)} />
                          <div className="flex justify-between pt-1 text-sm font-black">
                            <span>الإجمالي</span>
                            <span className="text-primary">{formatEGP(o.total)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <h4 className="text-xs font-extrabold text-muted-foreground">بيانات التوصيل</h4>
                        <p>
                          <span className="text-muted-foreground">العنوان: </span>
                          {o.address}
                          {o.area ? ` — ${o.area}` : ''}
                        </p>
                        <p>
                          <span className="text-muted-foreground">الشحن: </span>
                          {SHIPPING_METHODS.find((m) => m.id === o.shippingMethod)?.label ||
                            o.shippingMethod}
                        </p>
                        <p>
                          <span className="text-muted-foreground">الدفع: </span>
                          {PAYMENT_METHODS.find((m) => m.id === o.paymentMethod)?.label ||
                            o.paymentMethod}
                        </p>
                        {o.notes && (
                          <p className="rounded-lg bg-muted px-3 py-2 text-xs">
                            📝 {o.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}
