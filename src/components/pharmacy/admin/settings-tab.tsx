'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Save, Truck, Gift, Phone, Megaphone } from 'lucide-react'

const FIELDS: { key: string; label: string; hint?: string; icon?: React.ElementType; numeric?: boolean }[] = [
  { key: 'shipping_same_day', label: 'رسوم توصيل نفس اليوم (ج.م)', hint: 'القاهرة والجيزة', icon: Truck, numeric: true },
  { key: 'shipping_super_saver', label: 'رسوم سوبر سيفر (ج.م)', hint: '2-3 أيام', icon: Truck, numeric: true },
  { key: 'shipping_governorates', label: 'رسوم شحن المحافظات (ج.م)', hint: '2-7 أيام', icon: Truck, numeric: true },
  { key: 'free_shipping_threshold', label: 'حد الشحن المجاني (ج.م)', hint: 'الطلبات فوق هذا المبلغ شحنها مجاني', icon: Gift, numeric: true },
  { key: 'support_phone', label: 'رقم الدعم', icon: Phone },
  { key: 'support_hours', label: 'مواعيد الدعم', icon: Phone },
  { key: 'hero_title', label: 'عنوان البانر الرئيسي', icon: Megaphone },
  { key: 'hero_subtitle', label: 'وصف البانر الرئيسي', icon: Megaphone },
]

export function SettingsTab({ token, reloadKey }: { token: string; reloadKey: number }) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/pharmacy/admin/settings', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((data: { settings?: { key: string; value: string }[] }) => {
        const map: Record<string, string> = {}
        for (const s of data.settings || []) map[s.key] = s.value
        setValues(map)
      })
      .catch(() => toast.error('تعذر تحميل الإعدادات'))
      .finally(() => setLoading(false))
  }, [token, reloadKey])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/pharmacy/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ settings: values }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error || 'تعذر الحفظ')
        return
      }
      toast.success('تم حفظ الإعدادات ✓ — التغييرات ظاهرة في المتجر فورًا')
    } catch {
      toast.error('حدث خطأ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-base font-extrabold">إعدادات المتجر</h2>
        <Button type="button" onClick={save} disabled={saving} className="h-10 gap-1.5 font-extrabold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Card key={f.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                {f.icon && <f.icon className="h-4 w-4 text-primary" />}
                {f.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={values[f.key] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.hint}
                className="h-11"
                dir={f.numeric ? 'ltr' : undefined}
                inputMode={f.numeric ? 'decimal' : undefined}
              />
              {f.hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{f.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
