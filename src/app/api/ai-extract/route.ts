import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var file = formData.get('file') as File | null
    var fileUrl = formData.get('fileUrl') as string || ''
    var type = formData.get('type') as string || 'homework'
    var grade = formData.get('grade') as string || ''

    if ((!file || file.size === 0) && !fileUrl.trim()) {
      return NextResponse.json({ error: 'ارفع ملف أو أدخل رابط' }, { status: 400 })
    }

    var apiKey = 'AQ.Ab8RN6J1lUbn5oxF_0PsuobEDkoAEoRR5BcTZx1HVJEnIkN46Q'

    var base64Data = ''
    var mimeType = ''

    if (file && file.size > 0) {
      var bytes = new Uint8Array(await file.arrayBuffer())
      base64Data = Buffer.from(bytes).toString('base64')
      mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    } else if (fileUrl.trim()) {
      try {
        var fetchRes = await fetch(fileUrl.trim())
        if (!fetchRes.ok) throw new Error('فشل تحميل الرابط')
        var arrayBuf = await fetchRes.arrayBuffer()
        base64Data = Buffer.from(new Uint8Array(arrayBuf)).toString('base64')
        var ct = fetchRes.headers.get('content-type') || ''
        mimeType = ct.includes('pdf') ? 'application/pdf' : ct.includes('image') ? ct : 'image/jpeg'
      } catch (err: any) {
        return NextResponse.json({ error: 'فشل تحميل الملف: ' + (err.message || '') }, { status: 400 })
      }
    }

    var prompt = type === 'exam'
      ? 'أنت خبير في استخراج أسئلة الامتحانات. حلل هذا الملف واستخرج:\n- عنوان الامتحان\n- محتوى تعريفي قصير\n- جميع الأسئلة (اختيار من متعدد MCQ فقط - 4 اختيارات لكل سؤال ورقم الصحيح 0-3)\n- نموذج الإجابة إن وُجد\n\nالصف: ' + grade + '\n\nرد بـ JSON فقط:\n{"title":"عنوان","content":"وصف","questions":[{"question":"نص","options":["أ","ب","ج","د"],"correct":0,"points":1}],"answerKey":"نموذج"}'
      : 'أنت خبير في استخراج أسئلة الواجبات. حلل هذا الملف واستخرج:\n- عنوان الواجب\n- محتوى تعريفي قصير\n- جميع الأسئلة (اختيار من متعدد MCQ فقط - 4 اختيارات لكل سؤال ورقم الصحيح 0-3)\n- نموذج الإجابة إن وُجد\n\nالصف: ' + grade + '\n\nرد بـ JSON فقط:\n{"title":"عنوان","content":"وصف","questions":[{"question":"نص","options":["أ","ب","ج","د"],"correct":0,"points":1}],"answerKey":"نموذج"}'

    var parts: any[] = [{ text: prompt }]
    parts.push({ inlineData: { mimeType: mimeType.includes('pdf') ? 'application/pdf' : mimeType, data: base64Data } })

    var geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 8192 } }),
    })

    if (!geminiRes.ok) {
      var errText = await geminiRes.text()
      console.error('Gemini error:', geminiRes.status, errText)
      return NextResponse.json({ error: 'خطأ من Gemini: ' + geminiRes.status }, { status: 500 })
    }

    var geminiData = await geminiRes.json()
    var text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text.trim()) {
      return NextResponse.json({ error: 'لم يتم استخراج أي نص' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'لم يتم التعرف على JSON' }, { status: 500 })
    }

    var extracted = JSON.parse(jsonMatch[0])
    if (!extracted.title) extracted.title = (type === 'exam' ? 'امتحان' : 'واجب') + ' - ' + grade
    if (!extracted.content) extracted.content = ''
    if (!Array.isArray(extracted.questions)) extracted.questions = []
    if (!extracted.answerKey) extracted.answerKey = ''

    extracted.questions = extracted.questions.map(function(q: any) {
      return {
        question: q.question || '',
        options: (q.options || ['لا يوجد','لا يوجد','لا يوجد','لا يوجد']).slice(0, 4),
        correct: typeof q.correct === 'number' ? q.correct : 0,
        points: q.points || 1,
      }
    })

    return NextResponse.json({ success: true, extracted: extracted })
  } catch (error: any) {
    console.error('AI extract error:', error)
    return NextResponse.json({ error: 'خطأ: ' + (error.message || 'Unknown') }, { status: 500 })
  }
} 

