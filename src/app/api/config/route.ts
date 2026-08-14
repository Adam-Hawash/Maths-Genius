// @ts-nocheck
import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

var DEFAULTS = {
  hero_badge: 'منصة تعليمية متكاملة | Comprehensive Learning Platform',
  hero_title_line1: 'Maths Genius',
  hero_title_line2: 'Mr Wael Khodier',
  hero_subtitle: 'نبسّط لك الرياضيات ونجعلها سهلة وممتعة! Algebra, Geometry, Formulas, Cheat Sheets — واجبات أسبوعية، امتحانات منتظمة، ومتابعة مستمرة لتقدّمك الأكاديمي.',
  hero_stat1_value: '8+',
  hero_stat1_label: 'Grade Levels',
  hero_stat2_value: '100+',
  hero_stat2_label: 'Video Lessons',
  hero_stat3_value: '24/7',
  hero_stat3_label: 'Progress Tracking',
  instructor_name: 'Mr Wael Khodier',
  instructor_title: 'Mathematics Specialist | معلم الرياضيات المتخصص',
  instructor_photo: '',
  feature1_title: 'شرح مبسط | Simplified Explanations',
  feature1_desc: 'شرح واضح ومبسط لكل درس رياضيات بطريقة تساعد الطالب على الفهم السريع والاستيعاب العميق لمفاهيم Algebra و Geometry الأساسية.',
  feature2_title: 'فهم العمليات | Deep Understanding',
  feature2_desc: 'نركّز على فهم العمليات الرياضية من الجذور وليس الحفظ فقط، مما يبني قدرة حقيقية على حل أي مسألة في Formulas و Problem Solving.',
  feature3_title: 'حل المسائل | Step-by-Step Solutions',
  feature3_desc: 'حل خطوة بخطوة للمسائل المعقدة مع Cheat Sheets وملخصات بصرية تسهّل الفهم والتذكّر.',
  feature4_title: 'تحضير وامتحانات | Reviews & Exams',
  feature4_desc: 'تحضير شامل ومراجعات دورية واختبارات أسبوعية لضمان التفوّج والاستعداد الكامل للامتحانات النهائية.',
  social_facebook: '',
  social_whatsapp_channel: '',
  social_instagram: '',
  social_youtube: '',
  resend_api_key: '',
  hero_developer_url: 'https://hero-developer-portfolio-11.vercel.app',
  gallery_title: 'صور طلابي الأعزاء | My Beloved Students',
  gallery_subtitle: 'لحظات مميزة من رحلتنا التعليمية — Moments from our educational journey',
  footer_brand: 'Maths Genius',
  footer_copyright: 'جميع الحقوق محفوظة لـ أدهم حواش',
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
    return NextResponse.json(DEFAULTS)
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
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
