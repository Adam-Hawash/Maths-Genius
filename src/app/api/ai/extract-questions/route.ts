import { NextRequest, NextResponse } from 'next/server'

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileUrl = String(formData.get('fileUrl') || '').trim()
    const grade = String(formData.get('grade') || '')
    if ((!file || file.size === 0) && !fileUrl) return NextResponse.json({ error: 'ارفع ملفاً أو أدخل رابطاً صحيحاً' }, { status: 400 })

    let bytes: Uint8Array
    let mimeType = 'application/pdf'
    let filename = 'source.pdf'
    if (file && file.size > 0) {
      if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'حجم الملف يجب ألا يتجاوز 15 ميجابايت' }, { status: 400 })
      bytes = new Uint8Array(await file.arrayBuffer())
      mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
      filename = file.name || filename
    } else {
      const response = await fetch(fileUrl)
      if (!response.ok) return NextResponse.json({ error: 'تعذر تحميل الرابط' }, { status: 400 })
      bytes = new Uint8Array(await response.arrayBuffer())
      mimeType = response.headers.get('content-type')?.split(';')[0] || 'application/pdf'
    }

    const prompt = `استخرج كل أسئلة الاختيار من متعدد من الملف. الصف: ${grade}. أعد JSON فقط بالشكل {"questions":[{"question":"...","options":["...","...","...","..."],"correct":0,"points":1}]}. يجب أن يكون correct رقماً من 0 إلى 3، ولا تضف أي شرح خارج JSON.`
    const base64 = Buffer.from(bytes).toString('base64')
    const geminiKey = process.env.GEMINI_API_KEY
    let response: Response

    if (geminiKey) {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(geminiKey), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }),
      })
    } else if (process.env.AI_GATEWAY_API_KEY) {
      response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
        body: JSON.stringify({ model: 'google/gemini-2.5-flash', temperature: 0.1, max_tokens: 8192, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'file', file: { filename, file_data: `data:${mimeType};base64,${base64}` } }] }] }),
      })
    } else return NextResponse.json({ error: 'خدمة الذكاء الاصطناعي غير مهيأة في بيئة Vercel' }, { status: 503 })

    if (!response.ok) {
      console.error('[v0] AI extraction failed:', response.status, await response.text().catch(() => ''))
      return NextResponse.json({ error: 'تعذر استخراج الأسئلة حالياً. تحقق من صلاحية مفتاح Gemini وحجم الملف.' }, { status: 502 })
    }
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || data.choices?.[0]?.message?.content || ''
    const parsed = extractJson(text)
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : []
    if (!questions.length) return NextResponse.json({ error: 'لم يتم العثور على أسئلة اختيار من متعدد' }, { status: 422 })
    return NextResponse.json({ questions: questions.map((q: any) => ({ question: String(q.question || ''), options: Array.from({ length: 4 }, (_, i) => String(q.options?.[i] || '')), correct: Math.max(0, Math.min(3, Number(q.correct) || 0)), points: Math.max(1, Number(q.points) || 1) })) })
  } catch (error) {
    console.error('[v0] AI extract questions error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الملف' }, { status: 500 })
  }
}
