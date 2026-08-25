'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/stores/app-store'
import {
  BookOpen,
  Video,
  ClipboardList,
  FileText,
  Layers,
  Trophy,
  Compass,
} from 'lucide-react'

var GUIDE_ICONS = [BookOpen, Video, ClipboardList, FileText, Layers, Trophy]
var GUIDE_COLORS = [
  'bg-[#C49A38]/10 text-[#C49A38] dark:bg-[#C49A38]/15 dark:text-[#E5BE5A]',
  'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
  'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-rose-400/10 text-rose-400 dark:bg-rose-400/15 dark:text-rose-300',
  'bg-sky-500/10 text-sky-500 dark:bg-sky-500/15 dark:text-sky-400',
  'bg-violet-400/10 text-violet-400 dark:bg-violet-400/15 dark:text-violet-300',
]

export default function FeaturesGuideSection() {
  var { siteConfig } = useAppStore()
  var cfg = siteConfig

  var cards = [
    {
      icon: GUIDE_ICONS[0],
      titleAr: cfg.guide_card1_title || 'اعمل حسابك',
      titleEn: cfg.guide_card1_title_en || 'Register',
      description: cfg.guide_card1_desc || 'اعمل حسابك في المنصة بسرعة. اختار سنتك وابدأ تتعلم فورا.',
      color: GUIDE_COLORS[0],
    },
    {
      icon: GUIDE_ICONS[1],
      titleAr: cfg.guide_card2_title || 'شوف الدروس',
      titleEn: cfg.guide_card2_title_en || 'Watch Lessons',
      description: cfg.guide_card2_desc || 'شوف شروحات مبسطة ومتسلسلة لكل درس بطريقة سهلة تخليك تفهم أسرع.',
      color: GUIDE_COLORS[1],
    },
    {
      icon: GUIDE_ICONS[2],
      titleAr: cfg.guide_card3_title || 'حل الواجبات',
      titleEn: cfg.guide_card3_title_en || 'Homework',
      description: cfg.guide_card3_desc || 'خلص واجباتك الأسبوعية وحل التمارين عشان تثبت المعلومات وتختبر نفسك.',
      color: GUIDE_COLORS[2],
    },
    {
      icon: GUIDE_ICONS[3],
      titleAr: cfg.guide_card4_title || 'ادخل الامتحانات',
      titleEn: cfg.guide_card4_title_en || 'Take Exams',
      description: cfg.guide_card4_desc || 'دخل الامتحانات الدورية عشان تعرف مستواك وتستعد للامتحانات النهائية.',
      color: GUIDE_COLORS[3],
    },
    {
      icon: GUIDE_ICONS[4],
      titleAr: cfg.guide_card5_title || 'كروت مراجعة',
      titleEn: cfg.guide_card5_title_en || 'Flashcards',
      description: cfg.guide_card5_desc || 'استخدم الكروت دي عشان تراجع القوانين والمعادلات بسرعة.',
      color: GUIDE_COLORS[4],
    },
    {
      icon: GUIDE_ICONS[5],
      titleAr: cfg.guide_card6_title || 'تحديات ومسابقات',
      titleEn: cfg.guide_card6_title_en || 'Challenges',
      description: cfg.guide_card6_desc || 'تنافس مع زمايلك في تحديات رياضية ممتعة واكسب مراكز متقدمة.',
      color: GUIDE_COLORS[5],
    },
  ]

  return (
    <section className="py-16 sm:py-20 bg-[#0F0D0A]" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#C49A38]/15 px-4 py-1.5 text-sm font-medium text-[#E5BE5A] border border-[#C49A38]/20">
            <Compass className="h-4 w-4" />
            <span>{cfg.guide_badge || 'دليلك تتعلم'}</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-white">
            {cfg.guide_title || 'إزاي تستخدم المنصة؟'}
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-sm sm:text-base">
            {cfg.guide_subtitle || 'ست خطوات بس عشان تبدأ تتعلم في Maths Genius'}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(function(card, index) {
            return (
              <Card
                key={card.titleEn}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-white/5 bg-[#1A1714]"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Step Number + Icon */}
                  <div className="flex items-center gap-3">
                    <div
                      className={"inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 " + card.color}
                    >
                      <card.icon className="h-6 w-6" />
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-xs font-medium bg-white/5 text-white/50"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-base leading-snug text-white">
                    <span className="block">{card.titleAr}</span>
                    <span className="block text-sm text-white/40 font-normal mt-0.5">
                      {card.titleEn}
                    </span>
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/50 leading-relaxed">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
