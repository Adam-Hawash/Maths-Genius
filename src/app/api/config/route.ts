// @ts-nocheck
import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

var DEFAULTS = {
  navbar_brand: 'Maths Genius',
  navbar_subtitle: 'Mr Wael Khodier',
  hero_badge: 'منصة تعليمية متكاملة | Comprehensive Learning Platform',
  hero_title_line1: 'Maths Genius',
  hero_title_line2: 'Mr Wael Khodier',
  hero_subtitle: 'نبسّط لك الرياضيات ونجعلها سهلة وممتعة!',
  hero_stat1_value: '8+',
  hero_stat1_label: 'Grade Levels',
  hero_stat2_value: '100+',
  hero_stat2_label: 'Video Lessons',
  hero_stat3_value: '24/7',
  hero_stat3_label: 'Progress Tracking',
  hero_developer_url: 'https://hero-developer-portfolio-11.vercel.app',
  instructor_name: 'Mr Wael Khodier',
  instructor_title: 'Mathematics Specialist | معلم الرياضيات المتخصص',
  instructor_photo: '',
  features_title: 'لماذا تختارنا؟ | Why Choose Us?',
  features_subtitle: 'نقدّم لك تجربة تعليمية فريدة',
  feature1_title: 'شرح مبسط',
  feature1_desc: 'شرح واضح ومبسط لكل درس',
  feature2_title: 'فهم العمليات',
  feature2_desc: 'نركّز على الفهم من الجذور',
  feature3_title: 'حل المسائل',
  feature3_desc: 'حل خطوة بخطوة',
  feature4_title: 'تحضير وامتحانات',
  feature4_desc: 'تحضير شامل ومراجعات دورية',
  grades_title: 'السنوات الدراسية',
  grades_subtitle: 'اختر صفك الدراسي',
  tips_badge: 'نصائح للتفوّق',
  tips_title: 'نصائح الأستاذ وائل',
  tips_subtitle: 'نصائح ذهبية',
  tips_card1_title: 'حدد وقت يومي للمراجعة',
  tips_card1_title_en: 'Set Daily Review Time',
  tips_card1_desc: 'خصص 20-30 دقيقة كل يوم',
  tips_card2_title: 'ركز على الفهم وليس الحفظ',
  tips_card2_title_en: 'Focus on Understanding',
  tips_card2_desc: 'حاول فهم لماذا وليس كيف فقط',
  tips_card3_title: 'حل مسائل إضافية',
  tips_card3_title_en: 'Solve Extra Problems',
  tips_card3_desc: 'لا تكتفي بالواجبات فقط',
  tips_card4_title: 'لا تتردد في السؤال',
  tips_card4_title_en: 'Never Hesitate to Ask',
  tips_card4_desc: 'إذا لم تفهم شيئاً اسأل فوراً',
  guide_badge: 'دليلك التعليمي',
  guide_title: 'كيف تستخدم المنصة؟',
  guide_subtitle: 'ست خطوات بسيطة',
  guide_card1_title: 'تسجيل حسابك',
  guide_card1_title_en: 'Register',
  guide_card1_desc: 'أنشئ حسابك في المنصة',
  guide_card2_title: 'مشاهدة الدروس',
  guide_card2_title_en: 'Watch Lessons',
  guide_card2_desc: 'تابع شروحات مبسّطة',
  guide_card3_title: 'حل الواجبات',
  guide_card3_title_en: 'Homework',
  guide_card3_desc: 'أكمل واجباتك الأسبوعية',
  guide_card4_title: 'أداء الامتحانات',
  guide_card4_title_en: 'Take Exams',
  guide_card4_desc: 'شارك في الامتحانات الدورية',
  guide_card5_title: 'بطاقات تعليمية',
  guide_card5_title_en: 'Flashcards',
  guide_card5_desc: 'استخدم البطاقات التعليمية',
  guide_card6_title: 'تحديات ومسابقات',
  guide_card6_title_en: 'Challenges',
  guide_card6_desc: 'تنافس مع زملائك',
  gallery_title: 'صور طلابي الأعزاء',
  gallery_subtitle: 'لحظات مميزة',
  social_facebook: '',
  social_whatsapp_channel: '',
  social_instagram: '',
  social_youtube: '',
  whatsapp_number: '201017201680',
  footer_brand: 'Maths Genius',
  footer_copyright: 'جميع الحقوق محفوظة لـ أدهم حواش',
  resend_api_key: '',
}

export async function GET() {
  try {
    var configs = await db.siteConfig.findMany()
    var map = Object.assign({}, DEFAULTS)
    for (var i = 0; i < configs.length; i++) {
      var c = configs[i]
      map[c.key] = c.value
    }
    return NextResponse.json(map)
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json(Object.assign({ _error: error.message }, DEFAULTS))
  }
}

export async function PUT(request) {
  try {
    var body = await request.json()
    var keys = Object.keys(body)

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var value = body[key]
      await safeWrite(function(k, v) {
        return function() {
          return db.siteConfig.upsert({
            where: { key: k },
            update: { value: v, updatedAt: new Date() },
            create: { key: k, value: v },
          })
        }
      }(key, value))
    }

    return NextResponse.json({ message: 'Config updated' })
  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json({ error: 'Failed to update config', detail: error.message, code: error.code }, { status: 500 })
  }
}
