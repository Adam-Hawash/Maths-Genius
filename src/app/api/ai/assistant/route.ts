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

// Single model for fast response - no fallback chain to slow down
const FAST_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODELS = ['gemini-1.5-flash']
// (no longer used - replaced with hardcoded array inside callGemini)

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  // Use gemini-2.5-flash (verified working in Google's API)
  // Fallback to gemini-1.5-flash if first fails
  var allModels = ['gemini-2.5-flash', 'gemini-1.5-flash']
  var lastError = ''
  for (var mi = 0; mi < allModels.length; mi++) {
    var model = allModels[mi]
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      // Per-request timeout (15s for first, 20s for fallback)
      var controller = new AbortController()
      var timeoutMs = mi === 0 ? 15000 : 20000
      var timeout = setTimeout(function() { controller.abort() }, timeoutMs)
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
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
        // Capture error body for debugging
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = model + ': HTTP ' + geminiRes.status + ' - ' + errBody.substring(0, 200)
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
أنت "مساعد Maths Genius" - ذكاء اصطناعي بيساعد الطلاب في منصة "Maths Genius" التعليمية للرياضيات.

عن المنصة:
- منصة تعليمية للرياضيات للأستاذ/مستر وائل خضير
- فيها: دروس فيديو، واجبات، امتحانات، إعلانات، ومجتمع للأسئلة بين الطلاب
- الطالب بيسجل دخوله برقم الهاتف وكلمة المرور

محتوى الصفحات:
1. **الصفحة الرئيسية**: فيها الدخول والتسجيل وأهم الإحصائيات (عدد الدروس، الواجبات، الامتحانات)
2. **تاب الدروس**: فيديوهات الأستاذ، تقدر تشوفها وتتبع تقدمك
3. **تاب الواجبات**: واجبات فيها أسئلة اختيارات (MCQ) أو أسئلة مقالية
   - في الأسئلة المقالية تقدر تكتب إجابتك أو ترفع صورة لحلك
   - الـ AI بيمر على الصورة ويستخرج الإجابة ويصححها
4. **تاب الامتحانات**: امتحانات بنفس نظام الواجبات
5. **تاب إعلانات المستر**: إعلانات من الأستاذ
6. **تاب أسئلة وزملاء**: أسئلة ومشاركات مع زملائك

إزاي الطالب يستخدم المنصة:
- لو واجب/امتحان مكتوب عليه "محتاجة تتسلم" أو "لسه متقدمتش" لازم يخلصه
- يدخل على البوابة الكاملة من زرار "يلا ندخل صفحتنا"
- لو في مشكلة في تسجيل الدخول:
  * ممكن يكون كلمة المرور غلط
  * ممكن الحساب لسه قيد المراجعة (pending) - يستنى موافقة المستر
  * ممكن الحساب مرفوض - يتواصل مع المستر
- لو رفضت صورة في إجابة مقالية، الـ AI بيمر عليها ويصححها

قواعد الإجابة:
- إجابات قصيرة ومفيدة بالعامية المصرية
- لو السؤال مش واضح، اسأل توضيح
- لو السؤال خارج المنصة، اعتذر بإدب
- لو الطالب محتاج مساعدة تقنية، اشرح له خطوة بخطوة
- استخدم رموز تعبيرية مناسبة (✅ 📚 📝 ❓)
- ماتطولش في الإجابة - 3-4 أسطر كحد أقصى
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
      return NextResponse.json({
        reply: 'مش قادر أرد دلوقتي. حاول تاني بعدين 🙏',
        debug: result.error || 'no text',
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
