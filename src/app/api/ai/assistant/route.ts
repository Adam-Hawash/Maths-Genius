// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

// Gemini 3.6 as primary model, then fallbacks
const MODELS = ['gemini-3.6-flash', 'gemini-flash-latest']

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  var allErrors = []
  for (var mi = 0; mi < MODELS.length; mi++) {
    var model = MODELS[mi]
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      var controller = new AbortController()
      var timeout = setTimeout(function() { controller.abort() }, 20000)
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
        allErrors.push(model + ': ' + geminiRes.status)
      }
    } catch (e: any) {
      allErrors.push(model + ': ' + (e.message || ''))
    }
  }
  return { ok: false, error: allErrors.join(' | ') }
}

export async function POST(request: Request) {
  try {
    var body = await request.json()
    var message = (body.message || '').trim()
    var context = body.context || {}

    if (!message) {
      return NextResponse.json({ error: 'مفيش رسالة' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ reply: 'مفتاح الـ AI مش متظبط في البيئة' })
    }

    var contextStr = 'أنت مساعد ذكي في منصة Maths Genius للرياضيات. جاوب بالعامية المصرية بسرعة وذكاء.\n\nعن المنصة: دروس فيديو، واجبات، امتحانات، تنبيهات، ومجتمع.\nالطالب بيسجل برقم الهاتف وكلمة المرور.\n\nالتابات: الدروس، الواجبات، الامتحانات، التنبيهات، المجتمع.\nلو الحساب مرفوض يتواصل مع المستر. لو قيد المراجعة يستنى.\n\nتقدر تشرح رياضيات: أسس، جذور، معادلات، هندسة، أي حاجة.\n\nقواعد:\n- جاوب بالعامية المصرية\n- جاوب بسرعة وذكاء - افهم السؤال كويس\n- لو رياضي اشرح الخطوات بوضوح\n- استخدم رموز (📚 📝 ✅ 🧮)\n- لو مش فاهم السؤال اسأل توضيح'
    
    if (context.page) {
      contextStr += '\n\nالطالب في صفحة: ' + context.page
    }
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe(
          'SELECT name, grade, status FROM Student WHERE id = ? LIMIT 1',
          context.studentId
        )
        if (student && student.length > 0) {
          contextStr += '\n\nبيانات الطالب:\n- الاسم: ' + (student[0].name || '') + '\n- الصف: ' + (student[0].grade || '') + '\n- الحالة: ' + (student[0].status || '')
        }
      } catch (e) {}
    }

    var parts = [{ text: contextStr + '\n\nسؤال الطالب: ' + message + '\n\nالرد:' }]
    var result = await callGemini(apiKey, parts)

    if (!result.ok || !result.text) {
      return NextResponse.json({
        reply: 'استنى ثانية 🙏 بجهز الرد...',
        debug: result.error || 'no text',
      })
    }

    return NextResponse.json({ reply: result.text.trim() })
  } catch (error: any) {
    console.error('[AI Assistant Error]:', error)
    return NextResponse.json({ reply: 'استنى ثانية 🙏 بجهز الرد...' })
  }
}
