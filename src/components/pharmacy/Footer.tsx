'use client'

import { usePharmacy } from './store'
import { Pill, Phone, Mail, Clock, ShieldCheck, Lock, Truck, BadgeCheck, Facebook, Instagram, Youtube } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Footer() {
  const { setView, settings, categories } = usePharmacy()

  return (
    <footer className="mt-auto bg-cyan-950 text-cyan-50" aria-label="الفوتر">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* About */}
        <div className="col-span-2 md:col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="size-9 rounded-xl bg-cyan-600 grid place-items-center">
              <Pill className="size-5 text-white" />
            </span>
            <div className="leading-tight">
              <div className="font-extrabold text-sm">د. وليد الطحاوي</div>
              <div className="text-[10px] text-cyan-400 tracking-widest">PHARMACY</div>
            </div>
          </div>
          <p className="text-xs text-cyan-200/70 leading-relaxed">
            صيدليتك الموثوقة أونلاين — منتجات أصلية 100%، أسعار منافسة، وتوصيل سريع لباب البيت في كل محافظات مصر.
          </p>
          <div className="flex gap-2 pt-1">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <span key={i} className="size-8 rounded-lg bg-white/10 grid place-items-center hover:bg-cyan-600 transition cursor-pointer" aria-label="سوشيال ميديا">
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">روابط مهمة</h4>
          <ul className="space-y-2 text-xs text-cyan-200/80">
            <li><button className="hover:text-white transition" onClick={() => setView({ name: 'policy', which: 'terms' })}>الشروط والأحكام</button></li>
            <li><button className="hover:text-white transition" onClick={() => setView({ name: 'policy', which: 'privacy' })}>سياسة الخصوصية</button></li>
            <li><button className="hover:text-white transition" onClick={() => setView({ name: 'policy', which: 'delivery' })}>التوصيل والاسترجاع</button></li>
            <li><button className="hover:text-white transition" onClick={() => setView({ name: 'policy', which: 'stores' })}>فروعنا — Store Finder</button></li>
            <li><button className="hover:text-white transition" onClick={() => setView({ name: 'sale' })}>العروض والتخفيضات</button></li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">أشهر الفئات</h4>
          <ul className="space-y-2 text-xs text-cyan-200/80">
            {categories.slice(0, 6).map(c => (
              <li key={c.id}>
                <button className="hover:text-white transition" onClick={() => setView({ name: 'category', slug: c.slug })}>
                  {c.emoji} {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-white">تواصل معنا</h4>
          <ul className="space-y-2.5 text-xs text-cyan-200/80">
            <li className="flex items-center gap-2"><Phone className="size-3.5 text-cyan-400" /> <span dir="ltr">{settings.phone || '0100 123 4567'}</span></li>
            <li className="flex items-center gap-2"><Mail className="size-3.5 text-cyan-400" /> {settings.email || 'support@eltahanpharmacy.com'}</li>
            <li className="flex items-center gap-2"><Clock className="size-3.5 text-cyan-400" /> {settings.hours || 'من 10ص لـ 6م'}</li>
          </ul>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {[
              { icon: ShieldCheck, t: 'دفع آمن' },
              { icon: Lock, t: 'بيانات مشفرة' },
              { icon: Truck, t: 'توصيل سريع' },
              { icon: BadgeCheck, t: 'منتجات أصلية' },
            ].map((b, i) => (
              <span key={i} className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 text-[10px] font-semibold">
                <b.icon className="size-3 text-emerald-400" /> {b.t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-cyan-300/60">
        <span>© 2025 صيدلية د. وليد الطحاوي — كل الحقوق محفوظة</span>
        <button
          className="flex items-center gap-1.5 hover:text-white transition font-semibold"
          onClick={() => setView({ name: 'admin' })}
          aria-label="تسجيل دخول الأدمن"
        >
          <Lock className="size-3" /> تسجيل دخول الأدمن
        </button>
      </div>
    </footer>
  )
}
