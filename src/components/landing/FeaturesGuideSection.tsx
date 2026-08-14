'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Video,
  ClipboardList,
  FileText,
  Layers,
  Trophy,
  Compass,
} from 'lucide-react'

interface GuideCard {
  icon: React.ElementType
  titleAr: string
  titleEn: string
  description: string
  color: string
}

const guideCards: GuideCard[] = [
  {
    icon: BookOpen,
    titleAr: 'تسجيل حسابك',
    titleEn: 'Register',
    description:
      'أنشئ حسابك في المنصة بسرعة وسهولة. اختر صفّك الدراسي وابدأ رحلتك التعليمية فوراً. Create your account quickly and start learning.',
    color: 'bg-[#C49A38]/10 text-[#C49A38] dark:bg-[#C49A38]/15 dark:text-[#E5BE5A]',
  },
  {
    icon: Video,
    titleAr: 'مشاهدة الدروس',
    titleEn: 'Watch Lessons',
    description:
      'تابع شروحات مبسّطة ومتسلسلة لكل درس رياضيات بأسلوب تفاعلي يجعل الفهم أسهل. Watch simplified, step-by-step video lessons.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  {
    icon: ClipboardList,
    titleAr: 'حل الواجبات',
    titleEn: 'Homework',
    description:
      'أكمل واجباتك الأسبوعية وحلّ التمارين لتثبيت المعلومات واختبار فهمك. Complete weekly homework to reinforce your learning.',
    color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    icon: FileText,
    titleAr: 'أداء الامتحانات',
    titleEn: 'Take Exams',
    description:
      'شارك في الامتحانات الدورية لمتابعة مستواك والاستعداد للامتحانات النهائية. Take periodic exams to track your progress.',
    color: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
  },
  {
    icon: Layers,
    titleAr: 'بطاقات تعليمية',
    titleEn: 'Flashcards',
    description:
      'استخدم البطاقات التعليمية لمراجعة المصطلحات والقوانين الرياضية بشكل سريع. Review formulas and terms with flashcards.',
    color: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
  },
  {
    icon: Trophy,
    titleAr: 'تحديات ومسابقات',
    titleEn: 'Challenges',
    description:
      'تنافس مع زملائك في تحديات رياضية ممتعة واربح مراكز متقدمة. Compete in fun math challenges with your classmates.',
    color: 'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  },
]

export default function FeaturesGuideSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Compass className="h-4 w-4" />
            <span>دليلك التعليمي | Learning Guide</span>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            كيف تستخدم المنصة؟ | How to Use the Platform
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            ست خطوات بسيطة لتبدأ رحلتك التعليمية في Maths Genius — Six simple
            steps to begin your learning journey
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guideCards.map((card, index) => (
            <Card
              key={card.titleEn}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
            >
              <CardContent className="p-6 space-y-4">
                {/* Step Number + Icon */}
                <div className="flex items-center gap-3">
                  <div
                    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${card.color}`}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </Badge>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base leading-snug text-foreground">
                  <span className="block">{card.titleAr}</span>
                  <span className="block text-sm text-muted-foreground font-normal mt-0.5">
                    {card.titleEn}
                  </span>
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
