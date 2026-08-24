import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 120

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
    const fileEntry = formData.get('file')
    const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null
    const rawFileUrl = formData.get('fileUrl')
    const fileUrl = typeof rawFileUrl === 'string' ? rawFileUrl.trim() : ''
    const rawGrade = formData.get('grade')
    const grade = typeof rawGrade === 'string' ? rawGrade.trim() : ''
    if (!file && !fileUrl) {
      return NextResponse.json({ error: 'ارفع ملفاً أو أدخل رابطاً صحيحاً' }, { status: 400 })
    }

    let bytes: Uint8Array
    let mimeType = 'application/pdf'
    if (file) {
      if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'حجم الملف يجب ألا يتجاوز 15 ميجابايت' }, { status: 400 })
      bytes = new Uint8Array(await file.arrayBuffer())
      const safeName = typeof file.name === 'string' ? file.name : ''
      const extension = safeName.toLowerCase().split('.').pop()
      mimeType = file.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg')
    } else {
      let sourceUrl: URL
      try { sourceUrl = new URL(fileUrl) } catch { return NextResponse.json({ error: 'الرابط غير صحيح' }, { status: 400 }) }
      if (!['http:', 'https:'].includes(sourceUrl.protocol)) return NextResponse.json({ error: 'الرابط يجب أن يبدأ بـ http أو https' }, { status: 400 })
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) return NextResponse.json({ error: 'تعذر تحميل الرابط' }, { status: 400 })
      bytes = new Uint8Array(await response.arrayBuffer())
      mimeType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() || 'application/pdf'
    }

    // Normalize the media type to something the model accepts.
    const allowedMime = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
    if (!allowedMime.has(mimeType)) {
      // Word/other documents are not directly supported; ask for PDF/image.
      return NextResponse.json({ error: 'نوع الملف يجب أن يكون PDF أو صورة PNG/JPG/WebP' }, { status: 415 })
    }

    const prompt = `أنت مساعد لاستخراج أسئلة الاختيار من متعدد من ملفات المدرّسين.
استخرج كل أسئلة الاختيار من متعدد الموجودة في الملف المرفق. الصف الدراسي: ${grade || 'غير محدد'}.
أعد JSON فقط بالشكل التالي بدون أي شرح أو نص خارج الـ JSON:
{"questions":[{"question":"نص السؤال","options":["الاختيار الأول","الاختيار الثاني","الاختيار الثالث","الاختيار الرابع"],"correct":0,"points":1}]}
قواعد مهمة:
- كل سؤال يجب أن يحتوي على 4 اختيارات بالضبط. لو الاختيارات أقل من 4 أكملها بقيم منطقية.
- "correct" رقم من 0 إلى 3 يدل على ترتيب الإجابة الصحيحة.
- لو لم تجد أي أسئلة اختيار من متعدد أعد {"questions":[]}.`

    let text = ''
    try {
      const result = await generateText({
        // AI Gateway (connected in this project) resolves this provider/model string with no API key needed.
        model: 'google/gemini-2.5-flash',
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'file', mediaType: mimeType, data: bytes },
            ],
          },
        ],
      })
      text = result.text || ''
    } catch (aiError: any) {
      console.error('[v0] AI extraction failed:', aiError?.message || aiError)
      return NextResponse.json({ error: 'تعذر الاتصال بخدمة الذكاء الاصطناعي. تأكد من تفعيل AI Gateway وحاول مرة أخرى.' }, { status: 502 })
    }

    const parsed = extractJson(text)
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : []
    if (!questions.length) return NextResponse.json({ error: 'لم يتم العثور على أسئلة اختيار من متعدد في الملف' }, { status: 422 })

    return NextResponse.json({
      questions: questions.map((q: any) => ({
        question: String(q.question || ''),
        options: Array.from({ length: 4 }, (_, i) => String(q.options?.[i] || '')),
        correct: Math.max(0, Math.min(3, Number(q.correct) || 0)),
        points: Math.max(1, Number(q.points) || 1),
      })),
    })
  } catch (error) {
    console.error('[v0] AI extract questions error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الملف' }, { status: 500 })
  }
}
