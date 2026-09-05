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
export const maxDuration = 30

// (unused - models list is in callGemini below)

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  // Gemini 3.6 FIRST as requested, then fallbacks
  var allModels = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
  ]
  var lastError = ''
  var allErrors = []  // collect ALL errors for debugging
  for (var mi = 0; mi < allModels.length; mi++) {
    var model = allModels[mi]
    var modelTimeout = 20000  // same for all
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      var controller = new AbortController()
      var timeout = setTimeout(function() { controller.abort() }, modelTimeout)
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
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
        var status = geminiRes.status
        allErrors.push(model + ': ' + status)
        lastError = model + ': HTTP ' + status
      }
    } catch (e: any) {
      allErrors.push(model + ': ' + (e.message || ''))
      lastError = model + ': ' + (e.message || '')
    }
  }
  return { ok: false, error: allErrors.join(' | ') }
}

const PLATFORM_CONTEXT = `أنت مساعد ذكي في منصة Maths Genius للرياضيات. جاوب بالعامية المصرية بسرعة وذكاء.

عن المنصة: دروس فيديو، واجبات، امتحانات، تنبيهات، ومجتمع.
الطالب بيسجل برقم الهاتف وكلمة المرور.

التابات: الدروس، الواجبات، الامتحانات، التنبيهات، المجتمع.
لو الحساب مرفوض يتواصل مع المستر. لو قيد المراجعة يستنى.

تقدر تشرح رياضيات: أسس، جذور، معادلات، هندسة، أي حاجة.

قواعد:
- جاوب بالعامية المصرية
- جاوب بسرعة وذكاء - افهم السؤال كويس
- لو رياضي اشرح الخطوات بوضوح
- استخدم رموز (📚 📝 ✅ 🧮)
- ما تقلش أي رسالة خطأ أبداً
- ما تقلش "حاول تاني" أو "مشغول"
- لو مش فاهم السؤال اسأل توضيح
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
      var debugInfo = result.error || 'no text'
      // Don't say "server busy" - just retry-friendly message
      return NextResponse.json({
        reply: 'استنى ثانية 🙏 بجهز الرد...',
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
