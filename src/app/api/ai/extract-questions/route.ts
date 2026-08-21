import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileUrl = formData.get('fileUrl') as string | null

    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 })
    }

    var isPdf = false
    var imageBase64 = ''
    var mimeType = ''

    if (file) {
      var bytes = await file.arrayBuffer()
      var buffer = Buffer.from(bytes)
      imageBase64 = buffer.toString('base64')
      mimeType = file.type || ''
      isPdf = mimeType === 'application/pdf' || file.name.endsWith('.pdf')
    } else if (fileUrl) {
      var res = await fetch(fileUrl)
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch file from URL' }, { status: 400 })
      }
      var arrayBuf = await res.arrayBuffer()
      var buf = Buffer.from(arrayBuf)
      imageBase64 = buf.toString('base64')
      var contentType = res.headers.get('content-type') || ''
      mimeType = contentType
      isPdf = contentType === 'application/pdf' || fileUrl.toLowerCase().endsWith('.pdf')
    }

    var prompt = 'أنت معلم رياضيات خبير. استخرج كل الأسئلة من هذه الصفحة/الصورة/الملف. لكل سؤال اكتب: رقم السؤال، نص السؤال كاملاً، الإجابة الصحيحة، و4 اختيارات (إذا كان سؤال اختيار من متعدد) أو "لا يوجد" إذا كان سؤال حر. رد بـ JSON فقط بدون أي نص إضافي بهذا الشكل بالضبط: {"questions": [{"question": "نص السؤال", "options": ["اختيار1", "اختيار2", "اختيار3", "اختيار4"], "correct": 0}]} ملاحظات: correct = index الاختيار الصحيح (0-3)، إذا السؤال حر حط options كلها "لا يوجد" و correct = 0، لو فيها معادلات اكتبها بالعادي، استخرج كل الأسئلة الموجودة.'

    var parts: any[] = [{ text: prompt }]

    var geminiModel = 'gemini-2.0-flash'
    var geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + geminiModel + ':generateContent?key=' + apiKey

    if (isPdf) {
      parts.push({ inlineData: { mimeType: 'application/pdf', data: imageBase64 } })
    } else {
      if (!mimeType || !mimeType.startsWith('image/')) {
        mimeType = 'image/png'
      }
      parts.push({ inlineData: { mimeType: mimeType, data: imageBase64 } })
    }

    var body = {
      contents: [{ parts: parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    }

    var response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      var errText = await response.text()
      console.error('Gemini error:', response.status, errText)
      if (isPdf) {
        return NextResponse.json({ error: 'فشل استخراج الأسئلة من ملف PDF. جرب ترفع صورة للأسئلة بدل PDF.' }, { status: 500 })
      }
      return NextResponse.json({ error: 'AI service error: ' + response.status }, { status: 500 })
    }

    var data = await response.json()
    var text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response: ' + text.substring(0, 200) }, { status: 500 })
    }

    var parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from AI' }, { status: 500 })
    }

    var questions = Array.isArray(parsed.questions) ? parsed.questions : []
    var validQuestions = questions.map(function(q: any) {
      var opts = Array.isArray(q.options) ? q.options : ['لا يوجد', 'لا يوجد', 'لا يوجد', 'لا يوجد']
      while (opts.length < 4) opts.push('لا يوجد')
      var correct = typeof q.correct === 'number' ? q.correct : 0
      if (correct < 0 || correct > 3) correct = 0
      return { question: q.question || '', options: opts.slice(0, 4), correct: correct }
    }).filter(function(q: any) { return q.question.trim().length > 0 })

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على أسئلة صالحة. تأكد أن الملف يحتوي على أسئلة واضحة.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, questions: validQuestions, totalExtracted: validQuestions.length })
  } catch (error: any) {
    console.error('Extract questions error:', error)
    return NextResponse.json({ error: 'Extraction failed: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}

