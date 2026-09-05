// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

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
      return NextResponse.json({ reply: 'عفواً، مفتاح الـ AI غير مضبوط في البيئة.' }, { status: 500 })
    }

    var contextStr = `أنت مساعد ذكي في منصة Maths Genius للmath. جاوب بالعامية المصرية بسرعة وذكاء.`
    if (context.page) {
      contextStr += '\n\nالصفحة الحالية: ' + context.page
    }

    // استدعاء المباشر والصريح لنموذج جيميناي من غير تعقيد
    var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey
    
    var geminiRes = await fetch(modelUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: contextStr + '\n\nسؤال المستخدم: ' + message }]
        }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1000 }
      })
    })

    var data = await geminiRes.json()

    if (!geminiRes.ok) {
      // إرجاع تفاصيل الخطأ الحقيقي مباشرة بدل رسائل الأعذار المخفية
      return NextResponse.json({ 
        reply: 'عاد خطأ من سيرفر جيميناي: ' + (data.error?.message || JSON.stringify(data)) 
      }, { status: 200 })
    }

    var replyText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!replyText) {
      return NextResponse.json({ reply: 'لم يتم استلام نص من النموذج.' }, { status: 200 })
    }

    return NextResponse.json({ reply: replyText.trim() })

  } catch (error: any) {
    console.error('[AI Assistant Error]:', error)
    return NextResponse.json({ reply: 'خطأ تقني في السيرفر: ' + error.message }, { status: 200 })
  }
}
