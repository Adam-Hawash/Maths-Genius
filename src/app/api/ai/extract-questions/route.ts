// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const grade = formData.get('grade') as string | null
    const fileUrl = formData.get('fileUrl') as string | null

    if (!type || (!file && !fileUrl)) {
      return NextResponse.json({ error: 'الملف أو الرابط ونوع المحتوى مطلوبان' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ميزة الاستخراج بالذكاء الاصطناعي غير متاحة حالياً' }, { status: 503 })
    }

    var base64Data = ''
    var mimeType = ''

    if (file) {
      const bytes = await file.arrayBuffer()
      base64Data = Buffer.from(bytes).toString('base64')
      mimeType = file.type || 'application/octet-stream'
    }

    const typeLabel = type === 'homework' ? 'واجب' : 'امتحان'
    const prompt = 'أنت مساعد تعليمي متخصص في استخراج الأسئلة. هذا ' + typeLabel + ' للصف ' + (grade || 'غير محدد') + '. استخرج كل الأسئلة بالترتيب مع خياراتها والإجابات الصحيحة. أجب بصيغة JSON فقط: {"title":"","questions":[{"question":"","options":[],"correct":0}],"answerKey":""}'

    var parts = [{ text: prompt }]
    if (base64Data && mimeType) {
      parts.push({ inlineData: { mimeType: mimeType, data: base64Data } })
    } else if (fileUrl) {
      parts.push({ fileData: { mimeType: 'application/pdf', fileUri: fileUrl } })
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
        })
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'خطأ في خدمة الذكاء الاصطناعي' }, { status: 502 })
    }

    const data = await response.json()
    var resultText = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || ''

    const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) resultText = jsonMatch[1].trim()

    let extracted
    try { extracted = JSON.parse(resultText) }
    catch { extracted = { title: typeLabel, content: resultText, questions: [], answerKey: '' } }

    return NextResponse.json({ success: true, type, grade: grade || '', extracted })
  } catch (err) {
    return NextResponse.json({ error: 'خطأ في استخراج المحتوى' }, { status: 500 })
  }
}
