'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, TrendingUp, CalendarDays, AlertTriangle, Package } from 'lucide-react'
import { formatEGP } from '@/lib/format'

type Stats = {
  totalOrders: number
  totalSales: number
  todayOrders: number
  productCount: number
}

type LowStock = { id: string; name: string; emoji: string; stock: number; categoryName?: string }

export function DashboardTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [lowStock, setLowStock] = useState<LowStock[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/pharmacy/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const data = (await res.json()) as { stats?: Stats; lowStock?: LowStock[] }
      setStats(data.stats || null)
      setLowStock(data.lowStock || [])
    } catch {
      // keep previous stats on failure
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, reloadKey])

  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    { title: 'عدد الطلبات', value: String(stats.totalOrders), icon: ShoppingBag, cls: 'bg-primary/10 text-primary' },
    { title: 'إجمالي المبيعات', value: formatEGP(stats.totalSales), icon: TrendingUp, cls: 'bg-emerald-100 text-emerald-700' },
    { title: 'طلبات اليوم', value: String(stats.todayOrders), icon: CalendarDays, cls: 'bg-violet-100 text-violet-700' },
    { title: 'عدد المنتجات', value: String(stats.productCount), icon: Package, cls: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title} className="transition hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground">{c.title}</CardTitle>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.cls}`}>
                <c.icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-black">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-sm font-extrabold">
            منتجات قاربت على النفاد (المخزون أقل من 10)
          </CardTitle>
          <Badge variant="secondary" className="ms-auto">
            {lowStock.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              كل المنتجات متوفرة بكميات جيدة ✓
            </p>
          ) : (
            <div className="ph-scroll max-h-72 space-y-2 overflow-y-auto">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border p-2.5 text-sm"
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {p.categoryName}
                  </span>
                  <Badge
                    variant="outline"
                    className={p.stock === 0 ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}
                  >
                    {p.stock === 0 ? 'نفد' : `باقي ${p.stock}`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
