// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { callGemini, hasGeminiKey } from '@/lib/gemini'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    var body = await request.json()
    var message = (body.message || '').trim()
    var context = body.context || {}

    if (!message) {
      return NextResponse.json({ error: 'مفيش رسالة' }, { status: 400 })
    }

    if (!hasGeminiKey()) {
      return NextResponse.json({ reply: 'مرحباً! اكتب سؤالك.' })
    }

    var contextStr = [
      'أنت المساعد الذكي الرسمي لمنصة Maths Genius.',
      'قواعد ثابتة لازم تلتزم بيها في كل رد:',
      '1) اسم المنصة دايماً بالإنجليزي: Maths Genius — ممنوع تقول "عبقري الماث" أو أي ترجمة عربية للاسم.',
      '2) إحنا منصة ماث. استخدم المصطلحات الإنجليزية المدرسية دايماً: Powers مش أسس، Roots مش جذور، Exponents, Equations, Fractions (Numerator / Denominator), Geometry, Algebra, Brackets, Squares, Square roots, Cube roots.',
      '3) ممنوع نهائياً تكتب المصطلحات دي بالعربي: ممنوع "أسس" و"جذور" و"كسور" — دايماً Powers و Roots و Fractions.',
      '4) جاوب بالعامية المصرية بسرعة وباختصار.',
      '5) استخدم رموز (📚 ✅).'
    ].join('\n')
    if (context.page) contextStr += '\nصفحة: ' + context.page
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe('SELECT name, grade FROM Student WHERE id = ? LIMIT 1', context.studentId)
        if (student && student.length > 0) contextStr += '\nالطالب: ' + (student[0].name || '')
      } catch (e) {}
    }

    var prompt = contextStr + '\n\nسؤال: ' + message + '\n\nالرد:'

    // Gemini 3.6 first (auto model discovery + key rotation on quota)
    // thinking:'low' → reasoning models stay fast and don't burn the token budget
    var result = await callGemini({
      parts: [{ text: prompt }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      timeoutMs: 25000,
      thinking: 'low',
    })

    if (result.ok && result.text) {
      return NextResponse.json({ reply: result.text })
    }

    console.error('[AI Assistant] failed:', result.error)
    var busyMsg = 'المساعد مشغول دلوقتي جداً، جرب تاني بعد شوية 🙏'
    if (result.status === 429) busyMsg = 'الحصة اليومية للمساعد الذكي خلصت، جرب بكرة أو بعدين بشوية 🙏'
    return NextResponse.json({ reply: busyMsg })
  } catch (error) {
    return NextResponse.json({ reply: 'المساعد مشغول دلوقتي جداً، جرب تاني بعد شوية 🙏' })
  }
}
