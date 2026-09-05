// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

// gemini-3.6-flash as requested
const MODEL = 'gemini-3.6-flash'

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
      return NextResponse.json({ reply: 'مرحباً! اكتب سؤالك.' })
    }

    var contextStr = 'أنت مساعد ذكي في منصة Maths Genius. جاوب بالعامية المصرية بسرعة.\nتقدر تشرح رياضيات: أسس، جذور، معادلات، هندسة.\nجاوب بالعامية. استخدم رموز (📚 ✅)'
    if (context.page) contextStr += '\nصفحة: ' + context.page
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe('SELECT name, grade FROM Student WHERE id = ? LIMIT 1', context.studentId)
        if (student && student.length > 0) contextStr += '\nالطالب: ' + (student[0].name || '')
      } catch (e) {}
    }

    var prompt = contextStr + '\n\nسؤال: ' + message + '\n\nالرد:'

    // Try gemini-3.6-flash first, then flash-latest, then 2.0-flash
    var models = [MODEL, 'gemini-flash-latest', 'gemini-2.0-flash']
    
    for (var mi = 0; mi < models.length; mi++) {
      try {
        var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent?key=' + apiKey
        var geminiRes = await fetch(modelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
          }),
        })

        if (geminiRes.ok) {
          var data = await geminiRes.json()
          var text = ''
          try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
          if (text) return NextResponse.json({ reply: text.trim() })
        }
      } catch (e) {}
    }

    return NextResponse.json({ reply: 'أهلاً! اكتب سؤالك تاني 🙏' })
  } catch (error) {
    return NextResponse.json({ reply: 'أهلاً! اكتب سؤالك تاني 🙏' })
  }
}
