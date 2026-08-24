import { NextRequest, NextResponse } from 'next/server'

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  return JSON.parse(cleaned.slice(start, end + 1))
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileUrl = String(formData.get('fileUrl') || '').trim()
    const type = String(formData.get('type') || 'homework')
    const grade = String(formData.get('grade') || '')
    if ((!file || file.size === 0) && !fileUrl) return NextResponse.json({ error: 'ارفع ملفاً أو أدخل رابطاً صحيحاً' }, { status: 400 })
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'خدمة الذكاء الاصطناعي غير مهيأة في بيئة Vercel' }, { status: 503 })

    let bytes: Uint8Array
    let mimeType = 'application/pdf'
    if (file && file.size > 0) {
      if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'حجم الملف يجب ألا يتجاوز 15 ميجابايت' }, { status: 400 })
      bytes = new Uint8Array(await file.arrayBuffer())
      mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
    } else {
      const response = await fetch(fileUrl)
      if (!response.ok) return NextResponse.json({ error: 'تعذر تحميل الرابط' }, { status: 400 })
      bytes = new Uint8Array(await response.arrayBuffer())
      mimeType = response.headers.get('content-type') || 'application/pdf'
    }

    const prompt = `استخرج كل أسئلة الاختيار من متعدد من الملف. الصف: ${grade}. أعد JSON فقط بالشكل {"questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"points":1}]}. يجب أن يكون correct رقماً من 0 إلى 3.`
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', temperature: 0.1, max_tokens: 8192, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'file', file: { filename: 'source', file_data: `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}` } }] }] }),
    })
    if (!response.ok) { console.error('[v0] AI extraction failed:', response.status); return NextResponse.json({ error: 'تعذر استخراج الأسئلة حالياً، تحقق من إعداد خدمة الذكاء الاصطناعي' }, { status: 502 }) }
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const parsed = extractJson(text)
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : []
    if (!questions.length) return NextResponse.json({ error: 'لم يتم العثور على أسئلة اختيار من متعدد' }, { status: 422 })
    return NextResponse.json({ questions: questions.map((question: any) => ({ question: String(question.question || ''), options: Array.from({ length: 4 }, (_, index) => String(question.options?.[index] || '')), correct: Math.max(0, Math.min(3, Number(question.correct) || 0)), points: Math.max(1, Number(question.points) || 1) })) })
  } catch (error) {
    console.error('[v0] AI extract questions error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الملف' }, { status: 500 })
  }
}
