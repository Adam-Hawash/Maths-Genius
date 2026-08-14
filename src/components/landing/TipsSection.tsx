'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/stores/app-store'
import { Lightbulb, GraduationCap, Clock, Brain, Pencil, MessageCircle } from 'lucide-react'
import { useState } from 'react'

interface Tip {
  icon: React.ElementType
  titleAr: string
  titleEn: string
  description: string
  color: string
}

const tips: Tip[] = [
  {
    icon: Clock,
    titleAr: 'حدد وقت يومي للمراجعة',
    titleEn: 'Set Daily Review Time',
    description:
      'خصص 20-30 دقيقة كل يوم لمراجعة ما تعلمته. الاستمرارية هي مفتاح التفوّق في الرياضيات. Dedicate 20-30 minutes daily for review.',
    color: 'bg-[#C49A38]/10 text-[#C49A38] dark:bg-[#C49A38]/15 dark:text-[#E5BE5A]',
  },
  {
    icon: Brain,
    titleAr: 'ركز على الفهم وليس الحفظ',
    titleEn: 'Focus on Understanding, Not Memorization',
    description:
      'حاول فهم لماذا وليس كيف فقط. الفهم العميق يبقي المعلومة لفترة أطول ويساعدك في حل مسائل جديدة. Understand why, not just how.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  {
    icon: Pencil,
    titleAr: 'حل مسائل إضافية كل يوم',
    titleEn: 'Solve Extra Problems Daily',
    description:
      'لا تكتفي بالواجبات فقط. حل مسائل إضافية من الكتاب المدرسي لتعزيز مهاراتك. Practice beyond homework for stronger skills.',
    color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    icon: MessageCircle,
    titleAr: 'لا تتردد في السؤال',
    titleEn: 'Never Hesitate to Ask',
    description:
      'إذا لم تفهم شيئاً اسأل فوراً. السؤال الجيد هو بداية الفهم العميق. Ask immediately when something is unclear.',
    color: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
]

export default function TipsSection() {
  const { siteConfig } = useAppStore()
  const instructorPhoto = siteConfig.instructor_photo || ''
  const tipImages = [
    siteConfig.tip1_image || '',
    siteConfig.tip2_image || '',
    siteConfig.tip3_image || '',
  ]
  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [tipLoaded, setTipLoaded] = useState([false, false, false])

  return (
    <section className="py-16 sm:py-20 bg-muted/30" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Lightbulb className="h-4 w-4" />
            <span>نصائح للتفوّق | Tips for Excellence</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            نصائح الأستاذ وائل | Mr. Wael&apos;s Tips
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            نصائح ذهبية من الأستاذ وائل خضير للتفوّق في الرياضيات — Golden
            advice from Mr. Wael Khodier
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Instructor Photo */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden bg-muted shadow-lg transition-shadow duration-300 group-hover:shadow-xl">
                {instructorPhoto ? (
                  <>
                    {!photoLoaded && (
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/5 to-muted" />
                    )}
                    <img
                      src={instructorPhoto}
                      alt="الأستاذ وائل خضير - Mr Wael Khodier"
                      className={`w-full h-full object-cover transition-all duration-700 ${photoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setPhotoLoaded(true)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <GraduationCap className="h-24 w-24" />
                  </div>
                )}
                {/* Subtle overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent h-24 pointer-events-none" />
                <div className="absolute bottom-4 inset-x-0 text-center">
                  <p className="text-white text-sm font-semibold drop-shadow-md">
                    الأستاذ وائل خضير
                  </p>
                  <p className="text-white/70 text-xs drop-shadow-md">
                    Mr. Wael Khodier
                  </p>
                </div>
              </div>
              {/* Decorative accent */}
              <div className="absolute -top-3 -right-3 h-16 w-16 rounded-xl bg-[#C49A38]/20 -z-10" />
              <div className="absolute -bottom-3 -left-3 h-16 w-16 rounded-xl bg-[#C49A38]/10 -z-10" />
            </div>
          </div>

          {/* Tips Cards */}
          <div className="space-y-4">
            {tips.map((tip, idx) => (
              <Card
                key={tip.titleEn}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50 bg-card"
              >
                <CardContent className="p-4 sm:p-5 flex gap-4 items-start">
                  {tipImages[idx] ? (
                    <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-border/50">
                      {!tipLoaded[idx] && <div className="h-full w-full animate-pulse bg-muted" />}
                      <img
                        src={tipImages[idx]}
                        alt={tip.titleAr}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${tipLoaded[idx] ? 'opacity-100' : 'opacity-0 absolute'}`}
                        loading="lazy"
                        onLoad={() => setTipLoaded(prev => { const n = [...prev]; n[idx] = true; return n })}
                      />
                    </div>
                  ) : (
                    <div
                      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${tip.color}`}
                    >
                      <tip.icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                      <span className="block">{tip.titleAr}</span>
                      <span className="block text-xs sm:text-sm text-muted-foreground font-normal mt-0.5">
                        {tip.titleEn}
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
