'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Flame, Truck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type HeroTarget = { kind: 'all'; slug?: string } | { kind: 'category'; slug: string } | { kind: 'group'; slug: string }

type Slide = {
  src: string
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  target: HeroTarget
  /** مكان تركيز النص لتفادي تفاصيل الصورة */
  align?: 'start' | 'center'
}

type Props = {
  heroTitle: string
  heroSubtitle: string
  onShopNow: () => void
  onShowOffers: () => void
  onSelectTarget: (t: HeroTarget) => void
}

const SLIDES: Slide[] = [
  {
    src: '/images/hero/hero-main.png',
    eyebrow: 'صيدلية د. وليد التهان',
    title: '', // يُستبدل بعنوان الإعدادات
    subtitle: '', // يُستبدل بنص الإعدادات
    cta: 'تسوّق الآن',
    target: { kind: 'all' },
    align: 'start',
  },
  {
    src: '/images/hero/hero-dermo.png',
    eyebrow: 'درموكير 🧴',
    title: 'العناية بالبشرة زي الصيدليات العالمية',
    subtitle: 'La Roche-Posay وCeraVe وBioderma — منتجات أصلية 100% بخصومات توصل لحد 25%',
    cta: 'اكتشف منتجات العناية',
    target: { kind: 'category', slug: 'skincare' },
    align: 'start',
  },
  {
    src: '/images/hero/hero-baby.png',
    eyebrow: 'الأم والطفل 🍼',
    title: 'كل ما يخص أمك وطفلك في مكان واحد',
    subtitle: 'حفاضات وحليب ومنتجات عناية لطيفة على بشرة طفلك — ماركات موثوقة وأسعار منافسة',
    cta: 'تسوّق قسم الأم والطفل',
    target: { kind: 'group', slug: 'mother-baby' },
    align: 'start',
  },
  {
    src: '/images/hero/hero-vitamins.png',
    eyebrow: 'صيدلية الصحة 💊',
    title: 'فيتامينات ومكملات لطاقة كل يوم',
    subtitle: 'مناعة وعظام وطاقة — مكملات أصلية من أشهر الماركات العالمية بأسعار الجملة',
    cta: 'تسوّق الفيتامينات',
    target: { kind: 'category', slug: 'vitamins-supplements' },
    align: 'start',
  },
]

const AUTOPLAY_MS = 4000

export function Hero({ heroTitle, heroSubtitle, onShopNow, onShowOffers, onSelectTarget }: Props) {
  const slides: Slide[] = SLIDES.map((s, i) =>
    i === 0
      ? {
          ...s,
          title: heroTitle || 'صحتك أمانة عندنا',
          subtitle:
            heroSubtitle ||
            'كل ما تحتاجه من أدوية ومنتجات العناية والتجميل يوصلك لباب البيت — منتجات أصلية 100%.',
        }
      : s
  )

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  // تشغيل أوتوماتيكي كل 4 ثوانٍ — يتوقف عند الهوفر/اللمس
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused])

  function handleTarget(slide: Slide) {
    if (slide.target.kind === 'all') onShopNow()
    else onSelectTarget(slide.target)
  }

  const slide = slides[index]

  return (
    <section
      className="relative overflow-hidden bg-primary/95"
      aria-label="البانر الرئيسي"
      aria-roledescription="سلايدر"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* الصور بسلايدر أوتوماتيكي */}
      <div className="relative h-[420px] w-full sm:h-[440px] md:h-[480px] lg:h-[520px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <img
              src={slide.src}
              alt={slide.title || 'صيدلية د. وليد التهان'}
              className="h-full w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* تدرج للقراءة فوق الصورة */}
        <div className="absolute inset-0 bg-gradient-to-l from-primary/95 via-primary/70 to-primary/25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" aria-hidden="true" />

        {/* النص والأزرار */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-8 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`txt-${index}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="max-w-xl text-white"
              >
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  {slide.eyebrow}
                </span>
                <h1 className="text-2xl font-black leading-snug drop-shadow-sm sm:text-4xl md:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-white/90 sm:block sm:text-base">
                  {slide.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => handleTarget(slide)}
                    className="h-12 min-w-11 rounded-full bg-white px-7 text-sm font-extrabold text-primary shadow-lg hover:bg-white/90"
                  >
                    {slide.cta}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={onShowOffers}
                    className="h-12 min-w-11 rounded-full border-white/40 bg-white/10 px-7 text-sm font-extrabold text-white hover:bg-white/20 hover:text-white"
                  >
                    🔥 شاهد العروض
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* أسهم التنقل */}
        <button
          type="button"
          onClick={prev}
          aria-label="السلايد السابق"
          className="absolute end-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-105 hover:bg-white/35 active:scale-95"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="السلايد التالي"
          className="absolute start-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:scale-105 hover:bg-white/35 active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* النقاط */}
        <div className="absolute bottom-4 start-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rtl:translate-x-1/2" role="tablist" aria-label="اختيار السلايد">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`السلايد ${i + 1}: ${s.eyebrow}`}
              onClick={() => go(i)}
              className={cn(
                'h-2.5 rounded-full transition-all duration-300',
                i === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              )}
            />
          ))}
        </div>

        {/* كروت عائمة — عرض اليوم (جهة الصورة) */}
        <motion.button
          type="button"
          onClick={onShowOffers}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { delay: 0.4, duration: 0.6 },
            y: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' },
          }}
          className="absolute bottom-6 end-4 z-20 hidden w-52 items-center gap-3 rounded-2xl border border-white/40 bg-white/90 p-3.5 text-start shadow-xl backdrop-blur transition hover:bg-white sm:flex md:end-8"
          aria-label="عرض اليوم — اذهب إلى العروض"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <Flame className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-sm font-black text-foreground">عرض اليوم 🔥</span>
            <span className="block text-[11px] font-semibold leading-snug text-muted-foreground">
              اشترِ 2 والثاني بخصم 40% + خصومات لغاية 25%
            </span>
          </span>
        </motion.button>

        {/* كروت عائمة — شحن نفس اليوم (جهة الصورة، بعيدًا عن النص والأزرار) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [0, -5, 0] }}
          transition={{
            opacity: { delay: 0.55, duration: 0.6 },
            y: { repeat: Infinity, duration: 3.8, ease: 'easeInOut' },
          }}
          className="absolute top-6 end-4 z-20 hidden w-48 items-center gap-3 rounded-2xl border border-white/40 bg-white/90 p-3.5 shadow-xl backdrop-blur md:end-8 lg:flex"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Truck className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-sm font-black text-foreground">شحن نفس اليوم</span>
            <span className="block text-[11px] font-semibold leading-snug text-muted-foreground">
              القاهرة والجيزة خلال ساعات 🚚
            </span>
          </span>
        </motion.div>
      </div>
    </section>
  )
}
