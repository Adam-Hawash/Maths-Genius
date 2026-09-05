// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

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
      return NextResponse.json({ reply: 'مرحباً! اكتب سؤالك وأنا هرد عليك.' })
    }

    var contextStr = 'أنت مساعد ذكي في منصة Maths Genius للرياضيات. جاوب بالعامية المصرية بسرعة وذكاء.\nعن المنصة: دروس فيديو، واجبات، امتحانات، تنبيهات، ومجتمع.\nتقدر تشرح رياضيات: أسس، جذور، معادلات، هندسة، أي حاجة.\nجاوب بالعامية المصرية. لو رياضي اشرح الخطوات. استخدم رموز (📚 📝 ✅)'
    
    if (context.page) contextStr += '\n\nالطالب في صفحة: ' + context.page
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe('SELECT name, grade FROM Student WHERE id = ? LIMIT 1', context.studentId)
        if (student && student.length > 0) contextStr += '\n\nالطالب: ' + (student[0].name || '') + ' - ' + (student[0].grade || '')
      } catch (e) {}
    }

    var prompt = contextStr + '\n\nسؤال الطالب: ' + message + '\n\nالرد:'

    // Try models in order: 3.6 first, then flash-latest, then 2.0-flash
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

    // All failed - return a contextual response based on the user's message
    var fallback = 'أهلاً! سؤالك: "' + message + '"\n\nأنا مش قادر أرد دلوقتي على السيرفر، بس تقدر:\n- تشوف الدروس في تاب الدروس 📚\n- تحل الواجبات في تاب الواجبات 📝\n- تتواصل مع المستر لو محتاج مساعدة 👨‍🏫'
    return NextResponse.json({ reply: fallback })
  } catch (error) {
    return NextResponse.json({ reply: 'أهلاً! اكتب سؤالك تاني.' })
  }
}
