'use client'

/* ============================================================
   (G-2) قسم «إزاي تستخدم المنصة؟» — فيديو اختياري بيتحكم فيه الأدمن
   ============================================================
   القاعدة الصارمة بطلب المستر:
   - لو الأدمن ضاف فيديو (لينك أو ملف) → السكشن يظهر ويشتغل.
   - لو ما ضافش (howto_video_url فاضي) → السكشن **مش موجود في الـ DOM
     نهائيًا** (return null — لا div فاضي ولا placeholder).
   القيمة بتتقرا من نفس مصدر إعدادات الأدمن (siteConfig في الستور —
   /api/config) فأي تغيير من لوحة التحكم بيوصّل للطالب بعد reload.
   لينك → iframe embed (يوتيوب/درايف/vimeo بتطبيع تلقائي)
   ملف مرفوع → <video controls> من /api/files/<id>
   ============================================================ */

import { useAppStore } from '@/stores/app-store'
import { Card, CardContent } from '@/components/ui/card'
import { toEmbedUrl, isPlatformFile } from '@/lib/howto-video'
import { MonitorPlay } from 'lucide-react'

export function HowToVideoSection() {
  let siteConfig = useAppStore(function (s) { return s.siteConfig })
  let rawUrl = String(siteConfig.howto_video_url || '').trim()
  let kind = String(siteConfig.howto_video_kind || 'link')

  /* (G-2) إخفاء شرطي صارم — مفيش قيمة = مفيش سكشن خالص */
  if (!rawUrl) return null

  let isFile = kind === 'file' || isPlatformFile(rawUrl)

  return (
    <section id="how-to-video" className="py-12 sm:py-20" aria-label="إزاي تستخدم المنصة">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold sm:text-3xl flex items-center justify-center gap-2">
            <MonitorPlay className="h-6 w-6 text-primary" aria-hidden="true" />
            إزاي تستخدم المنصة؟
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            شاهد الفيديو ده لخطوات بسيطة توضح لك طريقة استخدام المنصة والاستفادة من كل مميزاتها
          </p>
        </div>
        <Card className="mx-auto max-w-4xl bg-card border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-3 sm:p-6">
            {isFile ? (
              /* ملف مرفوع من الجهاز — مشغل المنصة */
              <video
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-lg bg-black aspect-video"
                src={rawUrl}
              >
                متصفحك لا يدعم تشغيل الفيديو — جرّب متصفح أحدث.
              </video>
            ) : (
              /* لينك خارجي — مشغّل مدمج (يوتيوب/درايف/vimeo) */
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={toEmbedUrl(rawUrl)}
                  title="فيديو إزاي تستخدم المنصة"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default HowToVideoSection
