import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var file = formData.get('file') as File | null
    var fileUrl = formData.get('fileUrl') as string | null
    var type = formData.get('type') as string || 'homework'

    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'الرجاء رفع ملف أو إدخال رابط' }, { status: 400 })
    }

    var imageBase64 = ''
    var mimeType = ''

    if (file) {
      var bytes = await file.arrayBuffer()
      var buffer = Buffer.from(bytes)
      imageBase64 = buffer.toString('base64')
      mimeType = file.type || 'image/png'
    } else if (fileUrl) {
      try {
        var res = await fetch(fileUrl)
        if (!res.ok) {
          return NextResponse.json({ error: 'فشل جلب الملف من الرابط' }, { status: 400 })
        }
        var arrayBuf = await res.arrayBuffer()
        var buf = Buffer.from(arrayBuf)
        imageBase64 = buf.toString('base64')
        var contentType = res.headers.get('content-type') || ''
        mimeType = contentType || 'image/png'
      } catch (fetchErr: any) {
        return NextResponse.json({ error: 'فشل جلب الملف: ' + (fetchErr.message || '') }, { status: 400 })
      }
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: 'مفتاح GEMINI_API_KEY غير موجود في الإعدادات. اذهب إلى إعدادات Vercel → Environment Variables وأضف المفتاح.',
        errorKey: 'GEMINI_API_KEY',
        errorHint: 'احصل على المفتاح من https://aistudio.google.com/apikey وأضفه في Vercel Dashboard → Settings → Environment Variables'
      }, { status: 500 })
    }

    var isExam = type === 'exam'
    var prompt = ''
    if (isExam) {
      prompt = 'أنت معلم رياضيات خبير. هذا امتحان. استخرج كل الأسئلة من هذه الصفحة/الصورة. لكل سؤال اكتب: رقم السؤال، نص السؤال كاملاً، 4 اختيارات، الإجابة الصحيحة، ودرجة السؤال. رد بـ JSON فقط بدون أي نص إضافي بهذا الشكل بالضبط: {"questions": [{"question": "نص السؤال", "options": ["اختيار1", "اختيار2", "اختيار3", "اختيار4"], "correct": 0, "points": 5}]} ملاحظات: correct = index الاختيار الصحيح (0-3)، points = درجة السؤال (الافتراضي 5 إذا لم تحدد)، لو فيها معادلات اكتبها بالعادي، استخرج كل الأسئلة الموجودة.'
    } else {
      prompt = 'أنت معلم رياضيات خبير. هذا واجب. استخرج كل الأسئلة من هذه الصفحة/الصورة. لكل سؤال اكتب: رقم السؤال، نص السؤال كاملاً، 4 اختيارات، والإجابة الصحيحة. رد بـ JSON فقط بدون أي نص إضافي بهذا الشكل بالضبط: {"questions": [{"question": "نص السؤال", "options": ["اختيار1", "اختيار2", "اختيار3", "اختيار4"], "correct": 0}]} ملاحظات: correct = index الاختيار الصحيح (0-3)، لو فيها معادلات اكتبها بالعادي، استخرج كل الأسئلة الموجودة.'
    }

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

    var response
    try {
      response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (fetchErr: any) {
      return NextResponse.json({ error: 'فشل الاتصال بخدمة Gemini: ' + (fetchErr.message || '') }, { status: 500 })
    }

    if (!response.ok) {
      var errText = ''
      try { errText = await response.text() } catch(e) { errText = '' }
      console.error('Gemini error:', response.status, errText)
      if (response.status === 400) {
        return NextResponse.json({ error: 'خطأ في طلب Gemini — تأكد أن المفتاح صحيح وملف الصورة سليم' }, { status: 500 })
      }
      if (response.status === 403 || response.status === 401) {
        return NextResponse.json({ error: 'مفتاح GEMINI_API_KEY غير صالح أو منتهي. جرب مفتاح جديد من https://aistudio.google.com/apikey' }, { status: 500 })
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'تم تجاوز حد الاستخدام — انتظر قليلاً وحاول مرة أخرى' }, { status: 500 })
      }
      return NextResponse.json({ error: 'خطأ في خدمة الذكاء الاصطناعي: ' + response.status }, { status: 500 })
    }

    var data
    try {
      data = await response.json()
    } catch(e) {
      return NextResponse.json({ error: 'فشل تحليل رد الذكاء الاصطناعي' }, { status: 500 })
    }

    var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text

    if (!text) {
      var blockReason = (data.candidates && data.candidates[0] && data.candidates[0].finishReason) || ''
      if (blockReason === 'SAFETY') {
        return NextResponse.json({ error: 'تم حظر الرد بسبب سياسة الأمان — جرب صورة أخرى أو أعد صياغة المحتوى' }, { status: 500 })
      }
      return NextResponse.json({ error: 'لم يرد الذكاء الاصطناعي بأي نتيجة. تأكد أن الصورة تحتوي على أسئلة واضحة.' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'لم يتم تحليل رد الذكاء الاصطناعي كـ JSON. جرب صورة أوضح.', aiRawText: text.substring(0, 200) }, { status: 500 })
    }

    var parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      return NextResponse.json({ error: 'صيغة JSON غير صحيحة من الذكاء الاصطناعي. جرب صورة أخرى.' }, { status: 500 })
    }

    var questions = parsed.questions || []
    var validQuestions = questions.map(function(q: any) {
      var opts = Array.isArray(q.options) ? q.options : ['لا يوجد', 'لا يوجد', 'لا يوجد', 'لا يوجد']
      while (opts.length < 4) opts.push('لا يوجد')
      var correct = typeof q.correct === 'number' ? q.correct : 0
      if (correct < 0 || correct > 3) correct = 0
      if (isExam) {
        return { question: q.question || '', options: opts.slice(0, 4), correct: correct, points: typeof q.points === 'number' ? q.points : 5 }
      } else {
        return { question: q.question || '', options: opts.slice(0, 4), correct: correct }
      }
    }).filter(function(q: any) { return q.question.trim().length > 0 })

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'لم يتم استخراج أي أسئلة من الصورة. تأكد أن الصورة تحتوي على أسئلة واضحة ومقروءة.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, questions: validQuestions, totalExtracted: validQuestions.length, type: type })
  } catch (error: any) {
    console.error('Extract questions error:', error)
    return NextResponse.json({ error: 'فشل الاستخراج: ' + (error.message || 'خطأ غير معروف') }, { status: 500 })
  }
}
