// @ts-nocheck
// POST /api/ai/assistant
// Body: { message: string, context?: { page?: string, studentId?: string } }
// Returns: { reply: string }
//
// AI assistant that knows about the platform - can help students with:
// - Navigation issues
// - How to submit homework/exams
// - How to upload images
// - General questions about the platform

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 20

// (unused - models list is in callGemini below)

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  // Models in order of preference. All these are valid for v1beta generateContent API.
  // gemini-3.6-flash is requested first (will be used when Google releases it).
  // gemini-1.5-flash and gemini-1.5-pro are deprecated - replaced with -latest variants.
  var allModels = [
    'gemini-3.6-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ]
  var lastError = ''
  for (var mi = 0; mi < allModels.length; mi++) {
    var model = allModels[mi]
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      // Per-request timeout (10s for fast model, 15s for fallback)
      var controller = new AbortController()
      var timeoutMs = mi === 0 ? 10000 : 15000
      var timeout = setTimeout(function() { controller.abort() }, timeoutMs)
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (geminiRes.ok) {
        var data = await geminiRes.json()
        var text = ''
        try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
        if (text) return { ok: true, text: text }
      } else {
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = model + ': HTTP ' + geminiRes.status + ' - ' + errBody.substring(0, 150)
        console.error('[AI Assistant] ' + lastError)
      }
    } catch (e: any) {
      lastError = model + ': ' + (e.message || '')
      console.error('[AI Assistant] ' + lastError)
    }
  }
  return { ok: false, error: lastError }
}

const PLATFORM_CONTEXT = `
أنت "مساعد Maths Genius" - ذكاء اصطناعي ذكي بيساعد الطلاب في منصة "Maths Genius" التعليمية للرياضيات للأستاذ/مستر وائل خضير.

أنت مساعد ذكي حقيقي - جاوب على أي سؤال بشكل مفيد وواضح. مش بس أسئلة عن المنصة، أي سؤال.

عن المنصة:
- منصة تعليمية للرياضيات لمستر وائل خضير
- فيها: دروس فيديو، واجبات، امتحانات، إعلانات، ومجتمع للأسئلة بين الطلاب
- الطالب بيسجل دخوله برقم الهاتف وكلمة المرور

محتوى الصفحات:
1. الصفحة الرئيسية: الدخول والتسجيل وأهم الإحصائيات
2. تاب الدروس: فيديوهات الأستاذ، تقدر تشوفها وتتبع تقدمك
3. تاب الواجبات: واجبات فيها أسئلة اختيارات (MCQ) أو أسئلة مقالية
   - في الأسئلة المقالية تقدر تكتب إجابتك أو ترفع صورة لحلك
   - الـ AI بيمر على الصورة ويستخرج الإجابة ويصححها
4. تاب الامتحانات: امتحانات بنفس نظام الواجبات
5. تاب إعلانات المستر: إعلانات من الأستاذ
6. تاب أسئلة وزملاء: أسئلة ومشاركات مع زملائك

إزاي الطالب يستخدم المنصة:
- لو واجب/امتحان مكتوب عليه "محتاجة تتسلم" أو "لسه متقدمتش" لازم يخلصه
- يدخل على البوابة الكاملة من زرار "يلا ندخل صفحتنا"
- لو في مشكلة في تسجيل الدخول:
  * ممكن يكون كلمة المرور غلط
  * ممكن الحساب لسه قيد المراجعة (pending) - يستنى موافقة المستر
  * ممكن الحساب مرفوض - يتواصل مع المستر
- لو رفع صورة في إجابة مقالية، الـ AI بيمر عليها ويصححها

أنت كمان تقدر تشرح أي مفهوم رياضي:
- الأسس والجذور
- المعادلات
- الهندسة
- التفاضل والتكامل
- الإحصاء
- أي حاجة في الرياضيات

قواعد الإجابة:
- جاوب بالعامية المصرية البسيطة
- اشرح بوضوح وبالتفصيل لو السؤال محتاج شرح
- لو السؤال رياضي، اشرح الخطوات
- لو السؤال عن المنصة، جاوب بوضوح
- استخدم رموز تعبيرية مناسبة (✅ 📚 📝 ❓ 🧮)
- الإجابة تكون مفيدة وكاملة - مش قصيرة جداً
- لو السؤال مش واضح، اسأل توضيح بس بحب
- ما تقلش "مش قادر" - حاول تساعد دايماً
`

export async function POST(request: Request) {
  try {
    var body = await request.json()
    var message = (body.message || '').trim()
    var context = body.context || {}

    if (!message) {
      return NextResponse.json({ error: 'مفيش رسالة' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'الرسالة طويلة جداً (الحد 500 حرف)' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({
        reply: 'الـ AI مش متاح دلوقتي. حاول تاني بعدين أو تواصل مع المستر 👨‍🏫',
      })
    }

    // Build context for the AI
    var contextStr = PLATFORM_CONTEXT
    if (context.page) {
      contextStr += '\n\nالطالب دلوقتي في صفحة: ' + context.page
    }
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe(
          'SELECT name, grade, status FROM Student WHERE id = ? LIMIT 1',
          context.studentId
        )
        if (student && student.length > 0) {
          contextStr += '\n\nبيانات الطالب:\n- الاسم: ' + (student[0].name || 'مش معروف') + '\n- الصف: ' + (student[0].grade || 'مش معروف') + '\n- الحالة: ' + (student[0].status || 'مش معروف')
        }
      } catch (e) {}
    }

    var parts = [
      { text: contextStr + '\n\nسؤال الطالب: ' + message + '\n\nالرد:' }
    ]

    var result = await callGemini(apiKey, parts)

    if (!result.ok || !result.text) {
      // Check if it was a rate-limit error
      var debugInfo = result.error || 'no text'
      var isRateLimit = debugInfo.indexOf('429') >= 0 || debugInfo.indexOf('503') >= 0 || debugInfo.indexOf('quota') >= 0
      return NextResponse.json({
        reply: isRateLimit
          ? 'السيرفر مشغول دلوقتي بسبب كثرة الطلبات 🤯. استنى دقيقة وحاول تاني 🙏'
          : 'مش قادر أرد دلوقتي. حاول تاني بعدين 🙏',
        debug: debugInfo,
      })
    }

    return NextResponse.json({ reply: result.text.trim() })
  } catch (error: any) {
    console.error('[AI Assistant] Error:', error)
    return NextResponse.json({
      reply: 'حصلت مشكلة. حاول تاني 🙏',
      error: error.message,
    })
  }
}
