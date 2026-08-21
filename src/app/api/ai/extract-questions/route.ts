// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileUrl = formData.get('fileUrl') as string | null

    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 })
    }

    var imageBase64 = ''
    var mimeType = ''

    if (file) {
      var bytes = await file.arrayBuffer()
      var buffer = Buffer.from(bytes)
      imageBase64 = buffer.toString('base64')
      mimeType = file.type || 'image/png'
    } else if (fileUrl) {
      var res = await fetch(fileUrl)
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch file from URL' }, { status: 400 })
      }
      var arrayBuf = await res.arrayBuffer()
      var buf = Buffer.from(arrayBuf)
      imageBase64 = buf.toString('base64')
      var contentType = res.headers.get('content-type') || ''
      mimeType = contentType || 'image/png'
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set in Vercel env vars' }, { status: 500 })
    }

    var prompt = 'أنت معلم رياضيات خبير. استخرج كل الأسئلة من هذه الصفحة/الصورة. لكل سؤال اكتب: رقم السؤال، نص السؤال كاملاً، الإجابة الصحيحة، و4 اختيارات (إذا كان سؤال اختيار من متعدد) أو \"لا يوجد\" إذا كان سؤال حر. رد بـ JSON فقط بدون أي نص إضافي بهذا الشكل بالضبط: {\"questions\": [{\"question\": \"نص السؤال\", \"options\": [\"اختيار1\", \"اختيار2\", \"اختيار3\", \"اختيار4\"], \"correct\": 0}]} ملاحظات: correct = index الاختيار الصحيح (0-3)، إذا السؤال حر حط options كلها \"لا يوجد\" و correct = 0، لو فيها معادلات اكتبها بالعادي، استخرج كل الأسئلة الموجودة.'

    var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey

    var body = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType, data: imageBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    }

    var response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      var errText = await response.text()
      console.error('Gemini error:', errText)
      return NextResponse.json({ error: 'AI service error: ' + response.status }, { status: 500 })
    }

    var data = await response.json()
    var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text

    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response as JSON' }, { status: 500 })
    }

    var parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
    }

    var questions = parsed.questions || []
    var validQuestions = questions.map(function(q: any) {
      var opts = Array.isArray(q.options) ? q.options : ['لا يوجد', 'لا يوجد', 'لا يوجد', 'لا يوجد']
      while (opts.length < 4) opts.push('لا يوجد')
      var correct = typeof q.correct === 'number' ? q.correct : 0
      if (correct < 0 || correct > 3) correct = 0
      return { question: q.question || '', options: opts.slice(0, 4), correct: correct }
    }).filter(function(q: any) { return q.question.trim().length > 0 })

    return NextResponse.json({ success: true, questions: validQuestions, totalExtracted: validQuestions.length })
  } catch (error: any) {
    console.error('Extract questions error:', error)
    return NextResponse.json({ error: 'Extraction failed: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}
