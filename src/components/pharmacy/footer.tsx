'use client'

import { useState } from 'react'
import { Facebook, Instagram, Youtube, Phone, MapPin, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type PolicyKey = 'terms' | 'privacy' | 'shipping' | 'branches' | null

const POLICIES: Record<Exclude<PolicyKey, null>, { title: string; body: string[] }> = {
  terms: {
    title: 'الشروط والأحكام',
    body: [
      'باستخدامك لمتجر صيدلية د. وليد التهان الإلكتروني فإنك توافق على الشروط والأحكام التالية.',
      'الأسعار المعروضة بالجنيه المصري وتشمل ضريبة القيمة المضافة، ويحق للصيدلية تحديث الأسعار دون إشعار مسبق مع الحفاظ على أسعار الطلبات المؤكدة.',
      'الأدوية المعروضة هي أدوية بدون وصفة طبية ومستحضرات تجميل ومستلزمات، ولا نستبدل أو نعدل أي وصفة طبية. في حال وجود استفسار دوائي يرجى التواصل مع الصيادلة المعتمدين لدينا.',
      'يحق للمتجر رفض أو إلغاء أي طلب في حال وجود خطأ في السعر أو نفاد الكمية مع إشعار العميل واسترداد أي مبالغ مدفوعة.',
      'كل المحتوى والشعارات والصور مملوكة للصيدلية ولا يجوز استخدامها دون إذن كتابي.',
    ],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    body: [
      'خصوصيتك أمانة. نجمع فقط البيانات اللازمة لتنفيذ طلبك: الاسم، رقم الهاتف، العنوان، وبيانات الطلب.',
      'لا نبيع أو نشارك بياناتك الشخصية مع أي طرف ثالث لأغراض تسويقية، وتُستخدم حصريًا لتجهيز وتوصيل الطلبات والتواصل معك بخصوصها.',
      'نستخدم اتصالات مشفرة (HTTPS) لحماية البيانات أثناء النقل، ويتم الاحتفاظ بسجلات الطلبات للمدة القانونية المطلوبة.',
      'يمكنك طلب حذف بياناتك أو تعديلها في أي وقت بالتواصل مع الدعم.',
    ],
  },
  shipping: {
    title: 'الشحن والاسترجاع',
    body: [
      'توصيل نفس اليوم: متاح داخل القاهرة والجيزة للطلبات المؤكدة قبل الساعة 4 عصرًا.',
      'سوبر سيفر: 2-3 أيام عمل لجميع المحافظات بأقل رسوم شحن.',
      'شحن المحافظات: 2-7 أيام عمل حسب الوجه البحري أو القبلي.',
      'الشحن مجاني للطلبات التي تتجاوز الحد المعلن في المتجر.',
      'الاسترجاع: يحق لك استرجاع أو استبدال أي منتج خلال 14 يومًا من الاستلام بشرط أن يكون بحالته الأصلية ومغلق الغلاف — باستثناء الأدوية ومنتجات العناية المفتوحة لأسباب صحية.',
      'في حال وصول منتج تالف أو خطأ في التجهيز نتحمل كامل رسوم الاستبدال والشحن.',
    ],
  },
  branches: {
    title: 'فروع المتاجر',
    body: [
      '🩺 الفرع الرئيسي — القاهرة: شارع عباس العقاد، مدينة نصر (يوميًا 9 ص - 12 م).',
      '🩺 فرع الجيزة: شارع جامعة الدول العربية، المهندسين (يوميًا 9 ص - 11 م).',
      '🩺 فرع الإسكندرية: طريق الحرية، محرم بك (يوميًا 10 ص - 10 م).',
      '📞 خدمة العملاء والاستفسارات الدوائية متاحة من 10 صباحًا حتى 6 مساءً.',
    ],
  },
}

type Props = {
  onOpenAdmin: () => void
  supportPhone?: string
}

export function Footer({ onOpenAdmin, supportPhone }: Props) {
  const [policy, setPolicy] = useState<PolicyKey>(null)

  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl">
                ⚕️
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-base font-extrabold">صيدلية د. وليد التهان</span>
                <span className="text-[10px] text-background/60" dir="ltr">
                  Dr. Walid El-Tahan Pharmacy
                </span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-background/70">
              صيدليتك الموثوقة أونلاين — أدوية وفيتامينات ومستحضرات عناية أصلية 100% توصلك لباب
              البيت في كل محافظات مصر.
            </p>
            <div className="flex gap-2">
              <SocialLink href="#" label="فيسبوك">
                <Facebook className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="إنستجرام">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="يوتيوب">
                <Youtube className="h-4 w-4" />
              </SocialLink>
              {supportPhone && (
                <SocialLink href={`tel:${supportPhone}`} label="اتصل بنا">
                  <Phone className="h-4 w-4" />
                </SocialLink>
              )}
            </div>
          </div>

          {/* Links */}
          <nav aria-label="روابط مهمة" className="space-y-2">
            <h3 className="mb-3 text-sm font-extrabold">روابط مهمة</h3>
            {(
              [
                ['terms', 'الشروط والأحكام'],
                ['privacy', 'سياسة الخصوصية'],
                ['shipping', 'الشحن والاسترجاع'],
                ['branches', 'فروع المتاجر'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPolicy(key)}
                className="block text-sm text-background/70 transition hover:text-background"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold">تواصل معنا</h3>
            <p className="flex items-center gap-2 text-xs text-background/70">
              <MapPin className="h-4 w-4 shrink-0" />
              القاهرة — شارع عباس العقاد، مدينة نصر
            </p>
            {supportPhone && (
              <p className="flex items-center gap-2 text-xs text-background/70">
                <Phone className="h-4 w-4 shrink-0" />
                <span dir="ltr">{supportPhone}</span> — الدعم من 10 صباحًا حتى 6 مساءً
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAdmin}
              className="gap-1.5 border-background/20 bg-transparent text-xs text-background/70 hover:bg-background/10 hover:text-background"
            >
              <Lock className="h-3.5 w-3.5" />
              دخول لوحة التحكم
            </Button>
          </div>
        </div>

        <div className="mt-8 border-t border-background/10 pt-4 text-center text-xs text-background/50">
          © {new Date().getFullYear()} صيدلية د. وليد التهان — جميع الحقوق محفوظة
        </div>
      </div>

      {/* Policy modal */}
      <Dialog open={policy !== null} onOpenChange={(o) => !o && setPolicy(null)}>
        <DialogContent className="ph-scroll max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-start">
            <DialogTitle>{policy ? POLICIES[policy].title : ''}</DialogTitle>
            <DialogDescription>معلومات رسمية من صيدلية د. وليد التهان</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {policy &&
              POLICIES[policy].body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background transition hover:bg-primary hover:text-white"
    >
      {children}
    </a>
  )
}
