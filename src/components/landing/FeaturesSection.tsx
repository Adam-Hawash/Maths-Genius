'use client'

import { useAppStore } from '@/stores/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Brain, Puzzle, ClipboardCheck } from 'lucide-react'

export function FeaturesSection() {
  const { siteConfig } = useAppStore()
  const cfg = siteConfig

  const features = [
    {
      icon: BookOpen,
      title: cfg.feature1_title || 'شرح سهل وبسيط',
      description: cfg.feature1_desc || 'شرح واضح وبسيط لكل درس رياضيات بطريقة تخليك تفهم بسرعة وتحب المادة.',
      color: 'bg-[#C49A38]/10 text-[#C49A38] dark:bg-[#C49A38]/15 dark:text-[#E5BE5A]',
    },
    {
      icon: Brain,
      title: cfg.feature2_title || 'فهم مش مجرد حفظ',
      description: cfg.feature2_desc || 'بنركز إنك تفهم الرياضيات من الأساس مش بس تحفظها، عشان تقدر تحل أي مسألة.',
      color: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    },
    {
      icon: Puzzle,
      title: cfg.feature3_title || 'حل خطوة بخطوة',
      description: cfg.feature3_desc || 'بنحل معاك المسائل الصعبة خطوة بخطوة مع ملخصات و qrds تبسط عليك.',
      color: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
    {
      icon: ClipboardCheck,
      title: cfg.feature4_title || 'امتحانات ومراجعات',
      description: cfg.feature4_desc || 'تحضير شامل وامتحانات أسبوعية عشان تتفوق وتجيب أعلى الدرجات.',
      color: 'bg-rose-400/10 text-rose-400 dark:bg-rose-400/15 dark:text-rose-300',
    },
  ]

  return (
    <section className="py-16 sm:py-20 bg-[#0F0D0A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold sm:text-3xl text-white">{cfg.features_title || 'ليه تختارنا؟'}</h2>
          <p className="mt-3 text-white/40 max-w-2xl mx-auto">
            {cfg.features_subtitle || 'تجربة تعليمية مختلفة بتجمع بين الشرح السهل والتطبيق العملي'}
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-white/5 bg-[#1A1714]"
            >
              <CardContent className="p-6 space-y-4">
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base leading-snug text-white">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
