'use client'

import { Truck, ShieldCheck, CreditCard, Headphones } from 'lucide-react'

export function TrustBadges({ supportPhone, supportHours }: { supportPhone: string; supportHours: string }) {
  const badges = [
    { icon: Truck, title: 'شحن سريع', desc: 'نفس اليوم في القاهرة والجيزة' },
    { icon: ShieldCheck, title: 'منتجات أصلية 100%', desc: 'من موردين معتمدين رسميًا' },
    { icon: CreditCard, title: 'دفع آمن', desc: 'كاش عند الاستلام أو فودافون كاش' },
    { icon: Headphones, title: 'دعم فني', desc: supportHours || 'الدعم متاح من 10 صباحًا حتى 6 مساءً' },
  ]

  return (
    <section aria-label="مميزات المتجر" className="border-y bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
        {badges.map((b) => (
          <div key={b.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <b.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold">{b.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{b.desc}</span>
            </span>
          </div>
        ))}
      </div>
      {supportPhone && (
        <div className="border-t bg-secondary/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-center text-xs font-bold text-foreground">
            <Headphones className="h-4 w-4 text-primary" />
            محتاج مساعدة؟ اتصل بنا:{' '}
            <span dir="ltr" className="font-black text-primary">
              {supportPhone}
            </span>
            <span className="text-muted-foreground">— {supportHours || 'الدعم متاح من 10 صباحًا حتى 6 مساءً'}</span>
          </div>
        </div>
      )}
    </section>
  )
}
