'use client'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { useEffect, useState } from 'react'
import { FlaskConical, Atom, Users, Microscope, Clock, CalendarClock, Dna } from 'lucide-react'

// عناصر علمية عائمة في الخلفية بدل الرموز الرياضية
var BG_SYMBOLS = [
  { t: 'H', size: 110, top: '5%', right: '5%' },
  { t: 'O₂', size: 88, top: '16%', left: '8%' },
  { t: 'E=mc²', size: 72, top: '50%', left: '4%' },
  { t: 'Na', size: 80, top: '66%', right: '9%' },
  { t: 'H₂O', size: 64, top: '84%', left: '14%' },
  { t: 'Au', size: 60, top: '24%', right: '42%' },
  { t: 'F=ma', size: 56, top: '70%', left: '40%' },
  { t: 'Fe', size: 66, top: '40%', right: '7%' },
  { t: 'λ', size: 54, top: '9%', left: '30%' },
  { t: 'CO₂', size: 62, top: '79%', right: '30%' },
  { t: 'pH', size: 50, top: '33%', left: '48%' },
  { t: 'Ω', size: 58, top: '55%', right: '46%' },
]

// فقاعات صاعدة من "معمل" الهيرو
var BUBBLES = [
  { left: '6%', size: 10, dur: 14, delay: 0 },
  { left: '14%', size: 6, dur: 18, delay: 4 },
  { left: '24%', size: 8, dur: 16, delay: 8 },
  { left: '38%', size: 5, dur: 20, delay: 2 },
  { left: '55%', size: 9, dur: 15, delay: 6 },
  { left: '68%', size: 6, dur: 19, delay: 10 },
  { left: '80%', size: 8, dur: 13, delay: 3 },
  { left: '92%', size: 7, dur: 17, delay: 7 },
]

// حلزون DNA صغير من نقطتين متعاكستين
function MiniHelix() {
  var rows = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <div className="relative h-24 w-10" aria-hidden="true">
      {rows.map(function (i) {
        return (
          <div key={i} className="absolute left-0 right-0 flex items-center justify-between" style={{ top: i * 12 }}>
            <span className="sci-helix-a block h-2 w-2 rounded-full bg-rose-400/90" style={{ animationDelay: (i * -0.22) + 's' }} />
            <span className="block h-px w-4 bg-teal-300/30" />
            <span className="sci-helix-b block h-2 w-2 rounded-full bg-teal-300/90" style={{ animationDelay: (i * -0.22) + 's' }} />
          </div>
        )
      })}
    </div>
  )
}

export default function HeroSection() {
  const {
    setView,
    siteConfig,
    setSiteConfig,
    configLoaded,
    stats,
  } = useAppStore()

  const [fallbackBgExists, setFallbackBgExists] = useState(false)
  const [fallbackPhotoExists, setFallbackPhotoExists] = useState(false)

  var initialCfg = (typeof window !== 'undefined' && (window as any).__INITIAL_CONFIG__) || {}
  var cfg = configLoaded ? siteConfig : (Object.keys(siteConfig).length > 0 ? siteConfig : initialCfg)

  useEffect(() => {
    if (!configLoaded && Object.keys(siteConfig).length === 0) {
      fetch('/api/config')
        .then((r) => r.json())
        .then((data) => {
          setSiteConfig(data)
          useAppStore.getState().setConfigLoaded(true)
        })
        .catch(() => {})
    }
  }, [configLoaded, setSiteConfig, siteConfig])

  useEffect(() => {
    var hasDbBg = !!(siteConfig.hero_bg_image || '')
    var hasDbPhoto = !!(siteConfig.instructor_photo || '')
    if (!hasDbBg) {
      var img = new Image()
      img.onload = function () { setFallbackBgExists(true) }
      img.onerror = function () { setFallbackBgExists(false) }
      img.src = '/images/science-cover.png'
    } else {
      setFallbackBgExists(false)
    }
    if (!hasDbPhoto) {
      var img2 = new Image()
      img2.onload = function () { setFallbackPhotoExists(true) }
      img2.onerror = function () { setFallbackPhotoExists(false) }
      img2.src = '/images/instructor.png'
    } else {
      setFallbackPhotoExists(false)
    }
  }, [siteConfig.hero_bg_image, siteConfig.instructor_photo])

  const dbPhoto = cfg.instructor_photo || ''
  const dbBg = cfg.hero_bg_image || ''
  const heroPhoto = dbPhoto || '/images/instructor.png'
  const heroBg = dbBg || '/images/science-cover.png'

  const showBg = !!dbBg || fallbackBgExists
  const showPhoto = !!dbPhoto || fallbackPhotoExists

  return (
    <section className="relative overflow-hidden bg-[#04201D]" dir="rtl">
      {/* الخلفية: رموز علمية + فقاعات + ذرة ضخمة */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* رموز كيمياء وفيزياء باهتة */}
        {BG_SYMBOLS.map(function (s, i) {
          return (
            <div
              key={i}
              className="absolute font-bold text-white/[0.045] leading-none select-none"
              style={{ top: s.top, right: s.right, left: s.left, fontSize: s.size }}
            >
              {s.t}
            </div>
          )
        })}

        {/* جزيئات سداسية باهتة */}
        <svg className="absolute text-white/[0.05] sci-spin-slow" style={{ top: '6%', left: '18%', width: '70px', height: '70px' }} viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.6">
          <polygon points="30,6 50,18 50,42 30,54 10,42 10,18" />
          <circle cx="30" cy="6" r="3" fill="currentColor" />
          <circle cx="50" cy="42" r="3" fill="currentColor" />
        </svg>
        <svg className="absolute text-white/[0.05]" style={{ top: '58%', right: '18%', width: '55px', height: '55px' }} viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.6">
          <polygon points="30,6 50,18 50,42 30,54 10,42 10,18" />
        </svg>

        {/* ذرة ضخمة تدور ببطء (3 مدارات) */}
        <svg className="absolute text-teal-300/[0.07] sci-spin-slow" style={{ bottom: '-60px', left: '-60px', width: '300px', height: '300px' }} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2">
          <ellipse cx="100" cy="100" rx="90" ry="38" />
          <ellipse cx="100" cy="100" rx="90" ry="38" transform="rotate(60 100 100)" />
          <ellipse cx="100" cy="100" rx="90" ry="38" transform="rotate(120 100 100)" />
          <circle cx="100" cy="100" r="10" fill="currentColor" stroke="none" />
        </svg>

        {/* فقاعات صاعدة */}
        {BUBBLES.map(function (b, i) {
          return (
            <span
              key={i}
              className="sci-bubble absolute bottom-0 rounded-full border border-teal-300/40 bg-teal-400/10"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                animationDuration: b.dur + 's',
                animationDelay: b.delay + 's',
              }}
            />
          )
        })}

        {/* نقاط ملونة متحركة (نفس نظام ماث جينيس بألوان ساينس) */}
        <div className="hero-dot hero-dot-1 w-1 h-1 rounded-full" style={{ top: '8%', right: '15%', background: '#2dd4bf', boxShadow: '0 0 4px #2dd4bf' }} />
        <div className="hero-dot hero-dot-2 w-1 h-1 rounded-full" style={{ top: '12%', left: '25%', background: '#fb7185', boxShadow: '0 0 4px #fb7185' }} />
        <div className="hero-dot hero-dot-3 w-1 h-1 rounded-full" style={{ top: '20%', right: '40%', background: '#34d399', boxShadow: '0 0 4px #34d399' }} />
        <div className="hero-dot hero-dot-4 w-1 h-1 rounded-full" style={{ top: '6%', left: '55%', background: '#fbbf24', boxShadow: '0 0 4px #fbbf24' }} />
        <div className="hero-dot hero-dot-5 w-1 h-1 rounded-full" style={{ top: '28%', right: '8%', background: '#2dd4bf', boxShadow: '0 0 4px #2dd4bf' }} />
        <div className="hero-dot hero-dot-6 w-1 h-1 rounded-full" style={{ top: '32%', left: '15%', background: '#fb923c', boxShadow: '0 0 4px #fb923c' }} />
        <div className="hero-dot hero-dot-7 w-1 h-1 rounded-full" style={{ top: '38%', right: '35%', background: '#34d399', boxShadow: '0 0 4px #34d399' }} />
        <div className="hero-dot hero-dot-8 w-1 h-1 rounded-full" style={{ top: '25%', left: '45%', background: '#5eead4', boxShadow: '0 0 4px #5eead4' }} />
        <div className="hero-dot hero-dot-1 w-1 h-1 rounded-full" style={{ top: '48%', left: '8%', background: '#fbbf24', boxShadow: '0 0 4px #fbbf24' }} />
        <div className="hero-dot hero-dot-3 w-1 h-1 rounded-full" style={{ top: '52%', right: '20%', background: '#fb7185', boxShadow: '0 0 4px #fb7185' }} />
        <div className="hero-dot hero-dot-5 w-1 h-1 rounded-full" style={{ top: '45%', left: '55%', background: '#2dd4bf', boxShadow: '0 0 4px #2dd4bf' }} />
        <div className="hero-dot hero-dot-2 w-1 h-1 rounded-full" style={{ top: '65%', right: '10%', background: '#fb923c', boxShadow: '0 0 4px #fb923c' }} />
        <div className="hero-dot hero-dot-4 w-1 h-1 rounded-full" style={{ top: '70%', left: '20%', background: '#34d399', boxShadow: '0 0 4px #34d399' }} />
        <div className="hero-dot hero-dot-6 w-1 h-1 rounded-full" style={{ top: '75%', right: '30%', background: '#5eead4', boxShadow: '0 0 4px #5eead4' }} />
        <div className="hero-dot hero-dot-8 w-1 h-1 rounded-full" style={{ top: '62%', left: '45%', background: '#fbbf24', boxShadow: '0 0 4px #fbbf24' }} />
        <div className="hero-dot hero-dot-7 w-1 h-1 rounded-full" style={{ top: '88%', right: '15%', background: '#2dd4bf', boxShadow: '0 0 4px #2dd4bf' }} />
        <div className="hero-dot hero-dot-1 w-1 h-1 rounded-full" style={{ top: '92%', left: '35%', background: '#fb7185', boxShadow: '0 0 4px #fb7185' }} />
      </div>

      {/* بانر أعلى الهيرو (لو مرفوع من لوحة التحكم أو الصورة الافتراضية) */}
      {showBg && (
        <div className="relative w-full">
          <img
            src={heroBg}
            alt="Dr. Shaimaa Selim Science Banner"
            className="w-full h-auto max-h-[360px] object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04201D]/30 via-transparent to-[#04201D]" />
        </div>
      )}

      {/* توهجات جانبية */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute bottom-20 left-20 h-72 w-72 rounded-full bg-emerald-500/8 blur-[80px]" />
        <div className="absolute top-1/2 left-1/3 h-60 w-60 rounded-full bg-amber-500/5 blur-[90px]" />
      </div>

      {/* تدرج الخلفية الأساسي */}
      {!showBg && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#04201D] via-[#0A2E2A] to-[#04201D] -z-10" />
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* النص */}
          <div className="space-y-6 text-center lg:text-right order-2 lg:order-1">
            {/* شارة */}
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 px-4 py-1.5 text-sm font-medium text-teal-300 border border-teal-400/25">
              <FlaskConical className="h-4 w-4" />
              <span>
                {cfg.hero_badge ||
                  'منصة علوم تفاعلية | Interactive Science Platform'}
              </span>
            </div>

            {/* العنوان */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              <span className="block text-transparent bg-clip-text bg-gradient-to-l from-teal-300 via-teal-400 to-emerald-400">
                {cfg.hero_title_line1 || 'Dr. Shaimaa Selim Science'}
              </span>
              <span className="block mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/85">
                {cfg.hero_title_line2 || 'دكتور شيماء سليم'}
              </span>
            </h1>

            {/* الوصف */}
            <p className="max-w-xl text-white/70 text-base sm:text-lg leading-relaxed lg:mx-0 mx-auto">
              {cfg.hero_subtitle ||
                'علوم بتتحس وبتجرب بإيدك! مختبر كيمياء تفاعلي، تجارب فيزيائية مباشرة، أطلس أحياء ثلاثي الأبعاد، ورحلة في باطن الأرض — شرح فيديو، واجبات، وامتحانات ومتابعة مستمرة لتقدّمك.'}
            </p>

            {/* أزرار */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                className="text-base px-8 py-6 min-h-[44px] bg-teal-500 hover:bg-teal-400 text-[#04201D] font-bold transition-colors duration-200 shadow-lg shadow-teal-500/25"
                onClick={() => setView('auth-register')}
              >
                اعمل حسابك
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 min-h-[44px] border-teal-400/40 text-teal-300 hover:bg-teal-400/10 hover:text-teal-200 transition-colors duration-200"
                onClick={() => setView('auth-login')}
              >
                عندك حساب؟ ادخل هنا
              </Button>
            </div>

            {/* زر مواعيد السنتر */}
            <div className="pt-2 flex justify-center lg:justify-start">
              <Button
                variant="outline"
                size="lg"
                className="text-sm px-6 py-4 min-h-[44px] border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors duration-200 gap-2"
                onClick={() => window.location.href = '/schedule'}
              >
                <CalendarClock className="h-4 w-4" />
                مواعيد السنتر
              </Button>
            </div>

            {/* Developer branding */}
            <div className="pt-4 flex flex-col items-center lg:items-start gap-1">
              <a
                href={cfg.hero_developer_url || 'https://prime-developer-portfolio-11.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white/60 hover:text-teal-300 transition-colors"
              >
                {cfg.hero_developer_label || 'Hero Developer'}
              </a>
              <div className="h-px w-16 bg-white/10" />
              <a
                href={cfg.hero_developer_url || 'https://prime-developer-portfolio-11.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/40 font-light tracking-wider hover:text-teal-300 transition-colors"
              >
                {cfg.footer_made_by_label || 'Made by Adam Hawash'}
              </a>
            </div>

            {/* إحصائيات */}
            <div className="flex items-center justify-center lg:justify-start gap-8 pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Microscope className="h-4 w-4 text-teal-400/70" />
                  <p className="text-2xl font-bold text-teal-300">
                    {stats?.totalVideos
                      ? stats.totalVideos
                      : cfg.hero_stat1_value || '100+'}
                  </p>
                </div>
                <p className="text-xs text-white/70">
                  {cfg.hero_stat1_label || 'Video Lessons | درس فيديو'}
                </p>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="h-4 w-4 text-teal-400/70" />
                  <p className="text-2xl font-bold text-teal-300">
                    {stats?.approvedStudents
                      ? stats.approvedStudents
                      : cfg.hero_stat2_value || '500+'}
                  </p>
                </div>
                <p className="text-xs text-white/70">
                  {cfg.hero_stat2_label || 'Students | طالب'}
                </p>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="h-4 w-4 text-teal-400/70" />
                  <p className="text-2xl font-bold text-teal-300">
                    {cfg.hero_stat3_value || '24/7'}
                  </p>
                </div>
                <p className="text-xs text-white/70">
                  {cfg.hero_stat3_label || 'Tracking | متابعة'}
                </p>
              </div>
            </div>
          </div>

          {/* صورة الدكتورة — النواة الذرة: مدارات وإلكترونات وأيقونات ساينس حوالين الصورة */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2 -mt-4 sm:-mt-8">
            <div className="relative group">
              {/* توهج تركواز */}
              <div className="absolute -inset-4 bg-gradient-to-br from-teal-400/35 via-teal-500/15 to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-80" />

              {/* مدار 1: إلكترون واحد سريع */}
              <div className="sci-orbit absolute -inset-7 sm:-inset-9 rounded-full border border-teal-300/25 pointer-events-none" aria-hidden="true">
                <span className="absolute -top-1.5 left-1/2 -ml-1.5 block h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" />
              </div>
              {/* مدار 2: إلكترونان عكس دوران */}
              <div className="sci-orbit-rev absolute -inset-12 sm:-inset-16 rounded-full border border-dashed border-teal-300/20 pointer-events-none" aria-hidden="true">
                <span className="absolute -top-1.5 left-1/2 -ml-1.5 block h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_12px_#fb7185]" />
                <span className="absolute -bottom-1.5 left-1/2 -ml-1.5 block h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
              </div>

              {/* أيقونات ساينس عائمة حوالين الصورة: بيكر + DNA + مجهر + ذرة */}
              <div className="sci-float absolute -top-7 -right-6 z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-300/30 bg-[#062B27]/90 shadow-xl backdrop-blur-sm" aria-hidden="true">
                <FlaskConical className="h-7 w-7 text-emerald-400" />
              </div>
              <div className="sci-float-slow absolute top-1/4 -left-8 sm:-left-12 z-10 hidden sm:flex flex-col items-center gap-1 rounded-2xl border border-rose-300/25 bg-[#062B27]/90 px-3 py-2.5 shadow-xl backdrop-blur-sm" aria-hidden="true">
                <MiniHelix />
                <span className="text-[10px] font-bold text-rose-300/90">DNA</span>
              </div>
              <div className="sci-float-fast absolute -bottom-8 -right-7 z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-[#062B27]/90 shadow-xl backdrop-blur-sm" aria-hidden="true">
                <Microscope className="h-7 w-7 text-amber-400" />
              </div>
              <div className="sci-float absolute -bottom-4 -left-5 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/25 bg-[#062B27]/90 shadow-xl backdrop-blur-sm" aria-hidden="true">
                <Atom className="h-6 w-6 text-teal-300" />
              </div>
              <div className="sci-float-slow absolute -top-4 -left-6 z-10 hidden lg:flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/25 bg-[#062B27]/90 shadow-xl backdrop-blur-sm" aria-hidden="true">
                <Dna className="h-6 w-6 text-emerald-300" />
              </div>

              {/* إطار الصورة المربع */}
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-2xl overflow-hidden border-2 border-teal-400/40 gold-glow bg-[#062B27] shadow-2xl">
                {showPhoto ? (
                  <img
                    src={heroPhoto}
                    alt={cfg.instructor_name || 'Dr. Shaimaa Selim'}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: '50% 50%' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-teal-300/30">
                    <Atom className="h-24 w-24" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* شارة الاسم */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#03201C] border border-teal-400/40 rounded-full px-5 py-2 shadow-lg">
                <p className="text-teal-200 font-bold text-sm tracking-wider whitespace-nowrap">
                  {cfg.instructor_name || 'دكتور شيماء سليم'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
