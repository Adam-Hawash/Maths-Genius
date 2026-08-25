'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAppStore, GRADES } from '@/stores/app-store'
import { toast } from 'sonner'

var gradeIcons: Record<string, string> = {
  'الصف السادس الابتدائي': '6',
  'الصف الأول الاعدادي': '1',
  'الصف الثاني الاعدادي': '2',
  'الصف الثالث الاعدادي': '3',
  'أولى بكالوريا': 'B',
}

var grades = GRADES.map(function(g) { return { id: g, name: g, icon: gradeIcons[g] || g[0] } })

export function GradesSection() {
  var { siteConfig } = useAppStore()
  var cfg = siteConfig

  var handleGradeClick = function(gradeName: string) {
    toast.info('سجل دخولك الأول عشان توصل لدروس ' + gradeName)
    useAppStore.getState().setView('auth-login')
  }

  return (
    <section className="py-12 sm:py-20 bg-[#0F0D0A]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold sm:text-3xl text-white">{cfg.grades_title || 'السنات الدراسية'}</h2>
          <p className="mt-3 text-white/40 max-w-2xl mx-auto">
            {cfg.grades_subtitle || 'اختار سنتك عشان توصل للمحتوى بتاعك'}
          </p>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {grades.map(function(grade) {
            return (
              <Card
                key={grade.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#C49A38]/30 border-white/5 bg-[#1A1714]"
                onClick={function() { handleGradeClick(grade.name) }}
              >
                <CardContent className="p-4 sm:p-6 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C49A38]/10 group-hover:bg-[#C49A38]/20 transition-colors">
                    <span className="text-xl font-bold text-[#E5BE5A]">
                      {grade.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight text-white">
                      {grade.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
