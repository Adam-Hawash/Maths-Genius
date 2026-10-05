'use client'

/* ============================================================
   (ص119) الفيديو التعريفي عن المستر — نفس ميزة Zicola-Math بالظبط
   ============================================================
   - المفتاح في SiteConfig: teacher_video_url (نفس منطق intro_video_url)
   - فاضي → القسم مش بيظهر خالص من الـ DOM
   - مكانه: قبل قسم المعرض (GallerySection) بالظبط — نفس زيكولا.
   - العرض على المشغل الموحد ConfigVideoPlayer (نفس IntroVideoSection).
   - العنوان بيقرأ اسم المستر المعروض في المنصة (instructor_name) —
     افتراضي «مستر وائل خضير» زي هوية Maths-Genius.
   ============================================================ */

import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { useT, useLangStore } from '@/lib/i18n'
import { introVideoKind } from '@/lib/intro-video'
import { ConfigVideoPlayer } from '@/components/landing/ConfigVideoPlayer'

export function TeacherVideoSection() {
  const T = useT()
  const lang = useLangStore(function (s) { return s.lang })
  const siteConfig = useAppStore((s) => s.siteConfig)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(String(siteConfig?.teacher_video_url || '').trim())
  }, [siteConfig])

  /* مفيش فيديو → مفيش سكشن أصلًا في الـ DOM (زي IntroVideoSection) */
  const kind = introVideoKind(url)
  if (kind === 'none') return null

  /* اسم المستر المعروض في المنصة — نفس مصدر الهيرو (instructor_name)
     مع نفس الافتراضي، والعنوان بيتكوّن حسب لغة الزائر */
  var arName = String((siteConfig as any)?.instructor_name || '').trim() || 'مستر وائل خضير'
  var enName = String((siteConfig as any)?.instructor_name_en || '').trim() || 'Mr. Wael Khodair'
  var heading = lang === 'en' ? 'Get to know ' + enName : 'تعرّف على ' + arName

  return (
    <section id="teacher-video" className="relative py-10 sm:py-14 bg-[#0F0D0A] border-t border-white/5">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#C49A38]/15 px-4 py-1.5 text-sm font-medium text-[#E5BE5A] border border-[#C49A38]/20">
            <GraduationCap className="h-4 w-4" />
            {T('فيديو عن المستر', 'About the Teacher')}
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
            {heading}
          </h2>
        </div>

        <div className="relative rounded-2xl overflow-hidden border-2 border-[#C49A38]/30 shadow-2xl bg-black">
          <div className="aspect-video">
            <ConfigVideoPlayer url={url} title={T('فيديو عن المستر', 'About the Teacher')} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default TeacherVideoSection
