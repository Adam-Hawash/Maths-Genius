'use client'

import { useState } from 'react'
import { usePharmacy, fmtEGP, hasTag } from './store'
import ProductCard from './ProductCard'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Truck, ShieldCheck, BadgePercent, Headphones, ArrowLeft, Sparkles, MapPin, Phone, Mail, Clock } from 'lucide-react'

const GROUPS = [
  { id: 'health', name: 'الصحة والعافية', icon: '💚' },
  { id: 'beauty', name: 'الجمال والتجميل', icon: '💄' },
  { id: 'baby', name: 'الأم والطفل', icon: '🍼' },
  { id: 'special', name: 'أقسام متخصصة', icon: '✨' },
]

export default function Home() {
  const { products, categories, brands, settings, setView, openQuickView } = usePharmacy()
  const [activeGroup, setActiveGroup] = useState('health')

  const featured = products.filter(p => hasTag(p, 'featured')).slice(0, 8)
  const saleItems = products.filter(p => p.oldPrice && p.oldPrice > p.price).slice(0, 8)
  const offerItems = products.filter(p => hasTag(p, 'offer40')).slice(0, 8)
  const bundles = products.filter(p => hasTag(p, 'bundle'))
  const featuredBrands = brands.filter(b => b.featured)
  const groupCats = categories.filter(c => c.group === activeGroup)

  let stores: { name: string; address: string; phone: string; hours: string }[] = []
  try { stores = JSON.parse(settings.storesJson || '[]') } catch { /* ignore */ }

  return (
    <div className="space-y-10 sm:space-y-14 pb-4">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-l from-cyan-700 via-teal-700 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-1/3 -bottom-24 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 grid md:grid-cols-2 gap-8 items-center relative">
          <div className="space-y-4 text-center md:text-right">
            <span className="inline-block bg-white/15 backdrop-blur px-4 py-1 rounded-full text-xs sm:text-sm font-bold border border-white/20">
              💊 صيدليتك اللي بتفرق معاك
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
              {settings.heroTitle || 'صحتك وجمالك عند دكتور وليد الطحاوي'}
            </h1>
            <p className="text-sm sm:text-lg text-cyan-50/90 leading-relaxed max-w-lg mx-auto md:mx-0">
              {settings.heroSubtitle || 'منتجات أصلية 100% وتوصيل سريع لحد باب البيت.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
              <Button
                size="lg"
                className="bg-white text-cyan-800 hover:bg-cyan-50 font-bold h-11 px-6 shadow-lg"
                onClick={() => document.getElementById('cats')?.scrollIntoView({ behavior: 'smooth' })}
              >
                ابدأ التسوق <ArrowLeft className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 backdrop-blur text-white hover:bg-white/20 hover:text-white font-bold h-11 px-6"
                onClick={() => setView({ name: 'sale' })}
              >
                شوف العروض 🔥
              </Button>
            </div>
          </div>

          {/* Emoji collage */}
          <div className="hidden md:grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
            {['🧴', '💊', '💄', '🍼', '🌸', '🩺', '🦷', '🛁', '👀'].map((e, i) => (
              <div key={i} className={`aspect-square rounded-2xl bg-white/10 backdrop-blur border border-white/20 grid place-items-center text-4xl sm:text-5xl ${i % 2 ? 'translate-y-3' : ''}`}>
                {e}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USP strip ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Truck, title: 'توصيل سريع', note: 'نفس اليوم — القاهرة والجيزة' },
            { icon: ShieldCheck, title: 'منتجات أصلية', note: 'مضمونة 100% من الموزعين' },
            { icon: BadgePercent, title: 'عروض يومية', note: 'خصومات وباكندادات على طول' },
            { icon: Headphones, title: 'دعم العملاء', note: settings.hours || 'من 10ص لـ 6م طوال الأسبوع' },
          ].map((u, i) => (
            <div key={i} className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-3 sm:p-4 flex items-center gap-3">
              <span className="size-10 sm:size-11 rounded-xl bg-cyan-50 grid place-items-center shrink-0">
                <u.icon className="size-5 text-cyan-700" />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-gray-800 text-xs sm:text-sm">{u.title}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate">{u.note}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section id="cats" className="max-w-7xl mx-auto px-3 sm:px-4 scroll-mt-32">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">تسوّق حسب الفئة</h2>
        <p className="text-sm text-gray-500 mb-4">كل اللي محتاجه في مكان واحد — اختار الفئة اللي تناسبك</p>
        <Tabs value={activeGroup} onValueChange={setActiveGroup}>
          <TabsList className="bg-cyan-50 h-auto flex-wrap justify-start gap-1 p-1 rounded-xl w-full">
            {GROUPS.map(g => (
              <TabsTrigger key={g.id} value={g.id} className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-xs sm:text-sm px-3 py-1.5">
                {g.icon} {g.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {GROUPS.map(g => (
            <TabsContent key={g.id} value={g.id} className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {groupCats.map(c => (
                  <button
                    key={c.id}
                    className="bg-white rounded-2xl border border-cyan-100 p-4 text-right hover:border-cyan-300 hover:shadow-md transition group"
                    onClick={() => setView({ name: 'category', slug: c.slug })}
                  >
                    <span className="text-3xl">{c.emoji}</span>
                    <div className="font-bold text-gray-800 text-sm mt-2 group-hover:text-cyan-700 transition">{c.name}</div>
                    <div className="text-[11px] text-gray-400 line-clamp-1">{c.description}</div>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* ── Offer40 banner ── */}
      {offerItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="rounded-3xl bg-gradient-to-l from-cyan-800 to-teal-700 text-white p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="text-center sm:text-right">
              <div className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full mb-2">🎁 عرض محدود</div>
              <h3 className="text-xl sm:text-3xl font-extrabold">اشترِ قطعة واحصل على خصم 40% على التانية</h3>
              <p className="text-cyan-100 text-sm mt-1">الخصم بيتطبق تلقائيًا في السلة — من غير أي كود</p>
            </div>
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 px-6 shrink-0" onClick={() => setView({ name: 'sale' })}>
              اتفرج على العروض
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {offerItems.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" /> الأكثر رواجًا
              </h2>
              <p className="text-sm text-gray-500">اختيارات عملائنا المفضلة</p>
            </div>
            <Button variant="ghost" className="text-cyan-700 hover:text-cyan-800" onClick={() => setView({ name: 'sale' })}>
              الكل <ArrowLeft className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Sale ── */}
      {saleItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-rose-600">🔥 تخفيضات النهاردة</h2>
              <p className="text-sm text-gray-500">أسعار مخفضة لفترة محدودة</p>
            </div>
            <Button variant="ghost" className="text-rose-600 hover:text-rose-700" onClick={() => setView({ name: 'sale' })}>
              الكل <ArrowLeft className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {saleItems.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Bundles ── */}
      {bundles.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">🎁 باكندات وصفقات موفرة</h2>
          <p className="text-sm text-gray-500 mb-4">اشترِ أكتر وادفع أقل</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {bundles.slice(0, 4).map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Brands ── */}
      {featuredBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">ماركات عالمية بأصلها</h2>
          <p className="text-sm text-gray-500 mb-4">بيعتمد عليها أكتر من 50 ألف عميل في مصر</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {featuredBrands.map(b => (
              <div
                key={b.id}
                className="h-14 sm:h-16 rounded-xl grid place-items-center font-extrabold text-xs sm:text-sm text-white shadow-sm hover:scale-105 transition cursor-default"
                style={{ background: `linear-gradient(135deg, ${b.color}, ${b.color}cc)` }}
              >
                {b.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Support / Stores ── */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-1 bg-cyan-800 text-white rounded-2xl p-5 space-y-3">
            <h3 className="font-extrabold text-lg">محتاج مساعدة؟</h3>
            <p className="text-cyan-100 text-sm">فريق خدمة العملاء تحت أمرك</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Phone className="size-4" /> {settings.phone || '0100 123 4567'}</div>
              <div className="flex items-center gap-2"><Mail className="size-4" /> {settings.email || 'support@eltahanpharmacy.com'}</div>
              <div className="flex items-center gap-2"><Clock className="size-4" /> {settings.hours || '10ص - 6م'}</div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white border border-cyan-100 rounded-2xl p-5">
            <h3 className="font-extrabold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="size-5 text-cyan-600" /> فروعنا — زورونا بنفسك
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {stores.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  <div className="font-bold text-sm text-gray-800">{s.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.address}</div>
                  <div className="text-xs text-cyan-700 font-semibold mt-1">{s.hours}</div>
                </div>
              ))}
            </div>
            <button
              className="text-cyan-700 text-sm font-bold mt-3 hover:underline"
              onClick={() => setView({ name: 'policy', which: 'stores' })}
            >
              تفاصيل كل الفروع والتوصيل ←
            </button>
          </div>
        </div>
      </section>

      {/* Free shipping progress hint */}
      <section className="max-w-3xl mx-auto px-3 sm:px-4 text-center">
        <p className="text-sm text-gray-600 bg-cyan-50 border border-cyan-100 rounded-2xl p-4">
          🚚 اشترِ بـ <b>{fmtEGP(Number(settings.freeShipThreshold) || 1500)}</b> أو أكتر واحصل على <b>توصيل مجاني</b> لكل مصر!
        </p>
      </section>
    </div>
  )
}
