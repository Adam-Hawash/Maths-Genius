'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/stores/app-store'
import { Lightbulb, Clock, Brain, Pencil, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'

var TIP_ICONS = [Clock, Brain, Pencil, MessageCircle]
var TIP_COLORS = [
  'bg-[#C49A38]/10 text-[#C49A38] dark:bg-[#C49A38]/15 dark:text-[#E5BE5A]',
  'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-rose-400/10 text-rose-400 dark:bg-rose-400/15 dark:text-rose-300',
]

export default function TipsSection() {
  var { siteConfig, setSiteConfig, configLoaded } = useAppStore()

  var initialCfg = (typeof window !== 'undefined' && (window as any).__INITIAL_CONFIG__) || {}
  var cfg = configLoaded ? siteConfig : (Object.keys(siteConfig).length > 0 ? siteConfig : initialCfg)

  useEffect(function() {
    if (!configLoaded && Object.keys(siteConfig).length === 0) {
      fetch('/api/config')
        .then(function(r) { return r.json() })
        .then(function(data) {
          setSiteConfig(data)
          useAppStore.getState().setConfigLoaded(true)
        })
        .catch(function() {})
    }
  }, [configLoaded, siteConfig, setSiteConfig])

  var tipsBgImage = cfg.tips_bg_image || ''
  var tipsSectionImage = cfg.tips_section_image || ''
  var tipImages = [
    cfg.tip1_image || '',
    cfg.tip2_image || '',
    cfg.tip3_image || '',
  ]
  var [tipLoaded, setTipLoaded] = useState([false, false, false, false])
  var [bgLoaded, setBgLoaded] = useState(false)
  var [sectionImgLoaded, setSectionImgLoaded] = useState(false)

  var tips = [
    {
      icon: TIP_ICONS[0],
      titleAr: cfg.tips_card1_title || 'حط وقت كل يوم للمراجعة',
      titleEn: cfg.tips_card1_title_en || 'Set Daily Review Time',
      description: cfg.tips_card1_desc || 'خصص 20-30 دقيقة كل يوم تراجع اللي اتعلمته. الاستمرارية هي سر التفوق.',
      color: TIP_COLORS[0],
    },
    {
      icon: TIP_ICONS[1],
      titleAr: cfg.tips_card2_title || 'ركز على الفهم مش الحفظ',
      titleEn: cfg.tips_card2_title_en || 'Focus on Understanding',
      description: cfg.tips_card2_desc || 'حاول تفهم ليه المشكلة مش بس تحفظ الحل. الفهم بيخلي المعلومة تثبت أكتر.',
      color: TIP_COLORS[1],
    },
    {
      icon: TIP_ICONS[2],
      titleAr: cfg.tips_card3_title || 'حل مسائل زيادة كل يوم',
      titleEn: cfg.tips_card3_title_en || 'Solve Extra Problems',
      description: cfg.tips_card3_desc || 'ماتكتفيش بالواجبات بس. حل مسائل زيادة من الكتاب عشان تقوى أكتر.',
      color: TIP_COLORS[2],
    },
    {
      icon: TIP_ICONS[3],
      titleAr: cfg.tips_card4_title || 'ماتترددش تسأل',
      titleEn: cfg.tips_card4_title_en || 'Never Hesitate to Ask',
      description: cfg.tips_card4_desc || 'لو حاسس إنك مش فاهم حاجة، اسأل فورا. السؤال الصح هو أول خطوة للفهم.',
      color: TIP_COLORS[3],
    },
  ]

  function renderTipCard(tip, idx) {
    return (
      <Card
        key={tip.titleEn}
        className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-white/5 bg-[#1A1714]"
      >
        <CardContent className="p-4 sm:p-5 flex gap-4 items-start">
          {tipImages[idx] ? (
            <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-white/10 relative">
              {!tipLoaded[idx] && <div className="h-full w-full animate-pulse bg-white/5" />}
              <Image
                src={tipImages[idx]}
                alt={tip.titleAr}
                width={44}
                height={44}
                className={"h-full w-full object-cover transition-opacity duration-300 " + (tipLoaded[idx] ? 'opacity-100' : 'opacity-0 absolute')}
                onLoad={function() { setTipLoaded(function(prev) { var n = [...prev]; n[idx] = true; return n }) }}
              />
            </div>
          ) : (
            <div
              className={"inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 " + tip.color}
            >
              <tip.icon className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-1.5 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-white leading-snug">
              <span className="block">{tip.titleAr}</span>
              <span className="block text-xs sm:text-sm text-white/40 font-normal mt-0.5">
                {tip.titleEn}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              {tip.description}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="py-16 sm:py-20 relative bg-[#0F0D0A]" dir="rtl">
      {/* Background image */}
      {tipsBgImage && (
        <>
          {!bgLoaded && (
            <div className="absolute inset-0 animate-pulse bg-white/5" />
          )}
          <Image
            src={tipsBgImage}
            alt=""
            fill
            className={"object-cover -z-10 transition-opacity duration-500 " + (bgLoaded ? 'opacity-100' : 'opacity-0')}
            priority
            onLoad={function() { setBgLoaded(true) }}
          />
          <div className="absolute inset-0 -z-10 bg-[#0F0D0A]/80" />
        </>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C49A38]/15 px-4 py-1.5 text-sm font-medium text-[#E5BE5A] border border-[#C49A38]/20">
            <Lightbulb className="h-4 w-4" />
            <span>{cfg.tips_badge || 'نصائح مهمة'}</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-white">
            {cfg.tips_title || 'نصائح عشان تتفوق في الرياضيات'}
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base">
            {cfg.tips_subtitle || 'نصائح ذهبية هتساعدك تتفوق'}
          </p>
        </div>

        {/* Two-column layout: Tips + Image */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8 items-start">
          {/* Tips column */}
          <div className="order-2 lg:order-2 space-y-4">
            {tips.map(function(tip, idx) {
              return renderTipCard(tip, idx)
            })}
          </div>

          {/* Image column */}
          {tipsSectionImage && (
            <div className="order-1 lg:order-1">
              <div className="lg:sticky lg:top-24 relative rounded-2xl overflow-hidden shadow-xl border border-white/10">
                {!sectionImgLoaded && (
                  <div className="w-full aspect-[3/4] animate-pulse bg-white/5" />
                )}
                <Image
                  src={tipsSectionImage}
                  alt="نصائح مستر وائل"
                  width={400}
                  height={533}
                  className={"w-full aspect-[3/4] object-cover transition-opacity duration-500 " + (sectionImgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0')}
                  onLoad={function() { setSectionImgLoaded(true) }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
