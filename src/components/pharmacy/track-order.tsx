'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, PackageSearch, PackageCheck, Search } from 'lucide-react'
import { formatEGP, formatDateAr } from '@/lib/format'
import type { OrderDTO } from '@/lib/types'
import { ORDER_STATUS_AR, ORDER_STATUSES } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialQuery?: string
}

export function TrackOrderDialog({ open, onOpenChange, initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<OrderDTO[] | null>(null)

  async function search() {
    const q = query.trim()
    if (q.length < 5) {
      toast.error('اكتب رقم الطلب أو رقم الموبايل')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/orders/track?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      })
      const data = (await res.json()) as { orders?: OrderDTO[]; error?: string }
      if (!res.ok) {
        toast.error(data.error || 'تعذر البحث')
        return
      }
      setOrders(data.orders || [])
      if ((data.orders || []).length === 0) {
        toast.info('لا يوجد طلب بهذه البيانات — تأكد من رقم الطلب أو الموبايل')
      }
    } catch {
      toast.error('حدث خطأ في الشبكة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="ph-scroll max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="text-start">
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <PackageSearch className="h-5 w-5 text-primary" />
            تتبع طلبك
          </DialogTitle>
          <DialogDescription>
            اكتب رقم الطلب (مثل PH250920-1234) أو رقم الموبايل الذي طلبت به
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رقم الطلب أو الموبايل"
            className="h-12"
            dir="ltr"
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <Button
            type="button"
            onClick={search}
            disabled={loading}
            className="h-12 shrink-0 gap-2 px-5 font-extrabold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            بحث
          </Button>
        </div>

        {orders && orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <PackageSearch className="h-10 w-10 text-muted-foreground/40" />
            لا توجد طلبات مطابقة
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="block text-xs text-muted-foreground">رقم الطلب</span>
                    <span className="font-black text-primary" dir="ltr">
                      {o.orderNumber}
                    </span>
                  </div>
                  <Badge className={cn('border', statusClass(o.status))}>
                    {ORDER_STATUS_AR[o.status] || o.status}
                  </Badge>
                </div>

                {/* Status timeline */}
                {o.status !== 'cancelled' ? (
                  <div className="mt-4 flex items-center" dir="ltr">
                    {ORDER_STATUSES.slice(0, 4).map((s, idx) => {
                      const currentIdx = ORDER_STATUSES.indexOf(o.status as never)
                      const done = idx <= currentIdx
                      return (
                        <div key={s} className="flex flex-1 items-center last:flex-none">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition',
                                done ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {done ? '✓' : idx + 1}
                            </span>
                            <span
                              className={cn(
                                'whitespace-nowrap text-[10px]',
                                done ? 'font-bold text-primary' : 'text-muted-foreground'
                              )}
                            >
                              {ORDER_STATUS_AR[s]}
                            </span>
                          </div>
                          {idx < 3 && (
                            <div
                              className={cn(
                                'mx-1 mb-4 h-1 flex-1 rounded-full',
                                idx < currentIdx ? 'bg-primary' : 'bg-muted'
                              )}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                    تم إلغاء هذا الطلب — لو ده حصل بالغلط اتصل بالدعم
                  </p>
                )}

                <Separator className="my-3" />
                <div className="space-y-1.5">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 text-xs">
                      <span className="text-base">{i.emoji}</span>
                      <span className="line-clamp-1 flex-1 font-semibold">{i.name}</span>
                      <span className="text-muted-foreground">×{i.qty}</span>
                      <span className="font-bold">{formatEGP(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatDateAr(o.createdAt)} — {o.city}
                  </span>
                  <span className="font-black">{formatEGP(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PackageCheck className="h-3.5 w-3.5" />
          لو مش لاقي طلبك، تواصل مع الدعم من 10 صباحًا حتى 6 مساءً
        </p>
      </DialogContent>
    </Dialog>
  )
}

function statusClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'confirmed':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'shipped':
      return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    default:
      return 'bg-red-100 text-red-700 border-red-200'
  }
}
