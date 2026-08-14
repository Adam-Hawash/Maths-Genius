import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULTS: Record<string, string> = {
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
  gallery_title: 'صور طلابي الأعزاء | My Beloved Students',
  gallery_subtitle: 'لحظات مميزة من رحلتنا التعليمية — Moments from our educational journey',
}

export async function GET() {
  try {
    const configs = await db.siteConfig.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const c of configs) {
      map[c.key] = c.value
    }
    return NextResponse.json(map)
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json(DEFAULTS)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updates: Record<string, string> = body

    for (const [key, value] of Object.entries(updates)) {
      await db.siteConfig.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value },
      })
    }

    return NextResponse.json({ message: 'Config updated' })
  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
