// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

// ONLY gemini-3.6-flash as requested - no fallbacks, no other models
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
      return NextResponse.json({ reply: 'مرحباً! أنا مساعد Maths Genius. اكتب سؤالك وأنا هرد عليك.' })
    }

    var contextStr = 'أنت مساعد ذكي في منصة Maths Genius للرياضيات. جاوب بالعامية المصرية بسرعة وذكاء.\n\nعن المنصة: دروس فيديو، واجبات، امتحانات، تنبيهات، ومجتمع.\nالطالب بيسجل برقم الهاتف وكلمة المرور.\n\nتقدر تشرح رياضيات: أسس، جذور، معادلات، هندسة، أي حاجة.\n\nقواعد:\n- جاوب بالعامية المصرية\n- جاوب بسرعة وذكاء\n- لو رياضي اشرح الخطوات\n- استخدم رموز (📚 📝 ✅)'
    
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
          contextStr += '\n\nبيانات الطالب:\n- الاسم: ' + (student[0].name || '') + '\n- الصف: ' + (student[0].grade || '')
        }
      } catch (e) {}
    }

    var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + apiKey

    // Retry up to 3 times on 429 (quota) - wait between retries
    var lastError = ''
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        var controller = new AbortController()
        var timeout = setTimeout(function() { controller.abort() }, 20000)
        var geminiRes = await fetch(modelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextStr + '\n\nسؤال الطالب: ' + message + '\n\nالرد:' }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (geminiRes.ok) {
          var data = await geminiRes.json()
          var text = ''
          try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
          if (text) return NextResponse.json({ reply: text.trim() })
        }

        var status = geminiRes.status
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = MODEL + ': ' + status

        // If 429 (rate limit), wait and retry
        if (status === 429 && attempt < 2) {
          await new Promise(function(r) { setTimeout(r, 3000) })
          continue
        }
        // If 404 (model not found), don't retry
        if (status === 404) break
      } catch (e) {
        lastError = MODEL + ': ' + (e.message || '')
        if (attempt < 2) {
          await new Promise(function(r) { setTimeout(r, 2000) })
          continue
        }
      }
    }

    // ALL attempts failed - return friendly message (NO error messages)
    return NextResponse.json({ reply: 'مرحباً! أنا مساعد Maths Genius 🧮\nمحتاج أساعدك في إيه؟\n- شرح درس 📚\n- حل مسألة ✅\n- سؤال عن المنصة 📝\nاكتب سؤالك!' })
  } catch (error) {
    return NextResponse.json({ reply: 'مرحباً! أنا مساعد Maths Genius 🧮 اكتب سؤالك!' })
  }
}
