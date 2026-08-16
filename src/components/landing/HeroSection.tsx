'use client'

import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { useEffect, useState } from 'react'
// ✅ التحسين 1: next/image بدل <img>
import Image from 'next/image'
import { Award, GraduationCap, Users, BookOpen, Clock } from 'lucide-react'

export default function HeroSection() {
  const {
    setShowStudentRegister,
    setShowStudentLogin,
    siteConfig,
    setSiteConfig,
    configLoaded,
    stats,
  } = useAppStore()

  const [heroLoaded, setHeroLoaded] = useState(false)
  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [fallbackBgExists, setFallbackBgExists] = useState(false)
  const [fallbackPhotoExists, setFallbackPhotoExists] = useState(false)

  // Use server-injected config instantly, fallback to fetch
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

  // Check if fallback images exist by preloading them
  useEffect(() => {
    var hasDbBg = !!(siteConfig.hero_bg_image || '')
    var hasDbPhoto = !!(siteConfig.instructor_photo || '')
    if (!hasDbBg) {
      var img = new Image()
      img.onload = function () { setFallbackBgExists(true) }
      img.src = '/images/hero-bg.jpg'
    } else {
      setFallbackBgExists(false)
    }
    if (!hasDbPhoto) {
      var img2 = new Image()
      img2.onload = function () { setFallbackPhotoExists(true) }
      img2.src = '/images/instructor.jpg'
    } else {
      setFallbackPhotoExists(false)
    }
  }, [siteConfig.hero_bg_image, siteConfig.instructor_photo])

  const dbPhoto = cfg.instructor_photo || ''
  const dbBg = cfg.hero_bg_image || ''
  const heroPhoto = dbPhoto || '/images/instructor.jpg'
  const heroBg = dbBg || '/images/hero-bg.jpg'

  const showBg = !!dbBg || fallbackBgExists
  const showPhoto = !!dbPhoto || fallbackPhotoExists

  return (
    <section className="relative overflow-hidden bg-[#0F0D0A]" dir="rtl">
      {/* ✅ التحسين 2 + 4: بانر الـ hero بـ priority + أبعاد واضحة */}
      {showBg && (
        <div className="relative w-full">
          {!heroLoaded && (
            <div className="w-full h-auto max-h-[360px] bg-gradient-to-br from-[#1A1714] via-[#0F0D0A] to-[#1A1714] animate-pulse" style={{ minHeight: '200px' }} />
          )}
          <Image
            src={heroBg}
            alt="Maths Genius Banner"
            width={1600}
            height={360}
            className={`w-full h-auto max-h-[360px] object-cover object-center transition-opacity duration-300 ${heroLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
            priority
            onLoad={function() { setHeroLoaded(true) }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0D0A] via-[#0F0D0A]/50 to-transparent" />
        </div>
      )}

      {/* Ambient light effects */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-[#C49A38]/10 blur-[100px]" />
        <div className="absolute bottom-20 left-20 h-72 w-72 rounded-full bg-[#C49A38]/5 blur-[80px]" />
        <div className="absolute top-16 left-10 text-[#C49A38]/10 text-6xl font-light select-none hidden lg:block">
          a2+b2=c2
        </div>
        <div className="absolute bottom-32 right-16 text-[#C49A38]/8 text-5xl font-light select-none hidden lg:block">
          f(x)
        </div>
        <div className="absolute top-1/2 left-1/3 text-[#C49A38]/6 text-4xl font-light select-none hidden xl:block">
          sum int pi
        </div>
      </div>

      {!showBg && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F0D0A] via-[#1A1714] to-[#0F0D0A] -z-10" />
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Text Content */}
          <div className="space-y-6 text-center lg:text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#C49A38]/15 px-4 py-1.5 text-sm font-medium text-[#E5BE5A] border border-[#C49A38]/20">
              <Award className="h-4 w-4" />
              <span>
                {cfg.hero_badge ||
                  'Comprehensive Learning Platform | منصة تعليمية متكاملة'}
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white">
              <span className="block text-[#E5BE5A]">
                {cfg.hero_title_line1 || 'Maths Genius'}
              </span>
              <span className="block mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold text-white/80">
                {cfg.hero_title_line2 || 'Mr Wael Khodier'}
              </span>
            </h1>

            <p className="max-w-xl text-white/60 text-base sm:text-lg leading-relaxed lg:mx-0 mx-auto">
              {cfg.hero_subtitle ||
                'نبسّط لك الرياضيات ونجعلها سهلة وممتعة! Algebra, Geometry, Formulas, Cheat Sheets — واجبات أسبوعية، امتحانات منتظمة، ومتابعة مستمرة لتقدّمك الأكاديمي.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                className="text-base px-8 py-6 min-h-[44px] bg-[#C49A38] hover:bg-[#D4A843] text-white font-semibold transition-colors duration-200"
                onClick={() => setShowStudentRegister(true)}
              >
                سجّل الآن | Register Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 min-h-[44px] border-[#C49A38]/40 text-[#E5BE5A] hover:bg-[#C49A38]/10 hover:text-[#E5BE5A] transition-colors duration-200"
                onClick={() => setShowStudentLogin(true)}
              >
                لديّ حساب | I Have an Account
              </Button>
            </div>

            <div className="pt-4 flex flex-col items-center lg:items-start gap-1">
              <a
                href={cfg.hero_developer_url || 'https://hero-developer-portfolio-11.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white/50 hover:text-[#E5BE5A] transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-[#E5BE5A]/50"
              >
                Hero Developer
              </a>
              <div className="h-px w-16 bg-white/10" />
              <a
                href={cfg.hero_developer_url || 'https://hero-developer-portfolio-11.vercel.app'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/30 font-light tracking-wider hover:text-[#E5BE5A] transition-colors"
              >
                Made by Adam Hawash
              </a>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <BookOpen className="h-4 w-4 text-[#E5BE5A]/60" />
                  <p className="text-2xl font-bold text-[#E5BE5A]">
                    {stats?.totalVideos
                      ? stats.totalVideos
                      : cfg.hero_stat1_value || '100+'}
                  </p>
                </div>
                <p className="text-xs text-white/40">
                  {cfg.hero_stat1_label || 'Video Lessons | دروس فيديو'}
                </p>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="h-4 w-4 text-[#E5BE5A]/60" />
                  <p className="text-2xl font-bold text-[#E5BE5A]">
                    {stats?.approvedStudents
                      ? stats.approvedStudents
                      : cfg.hero_stat2_value || '500+'}
                  </p>
                </div>
                <p className="text-xs text-white/40">
                  {cfg.hero_stat2_label || 'Students | طالب'}
                </p>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock className="h-4 w-4 text-[#E5BE5A]/60" />
                  <p className="text-2xl font-bold text-[#E5BE5A]">
                    {cfg.hero_stat3_value || '24/7'}
                  </p>
                </div>
                <p className="text-xs text-white/40">
                  {cfg.hero_stat3_label || 'Tracking | متابعة'}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ التحسين 2 + 4: صورة المدرس بـ priority + أبعاد واضحة */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="relative group">
              <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-[#E5BE5A]/30 via-[#C49A38]/10 to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-80" />
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full overflow-hidden border-2 border-[#C49A38]/30 gold-glow bg-[#1A1714]">
                {showPhoto ? (
                  <>
                    {!photoLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#2A1F00] via-[#1A1714] to-[#0F0D0A]" />
                    )}
                    <Image
                      src={heroPhoto}
                      alt={cfg.instructor_name || 'Mr Wael Khodier'}
                      width={320}
                      height={320}
                      className={`w-full h-full object-cover transition-all duration-300 ${photoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                      priority
                      onLoad={function() { setPhotoLoaded(true) }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C49A38]/30">
                    <GraduationCap className="h-24 w-24" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1A1714] border border-[#C49A38]/30 rounded-full px-4 py-1.5">
                <p className="text-[#E5BE5A] font-bold text-sm tracking-wider">
                  {(cfg.hero_title_line1 || 'Maths Genius').toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
