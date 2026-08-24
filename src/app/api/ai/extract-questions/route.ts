// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { generateText, Output, jsonSchema } from 'ai'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 300

const MODEL = process.env.AI_EXTRACT_MODEL || 'google/gemini-3-flash'

const QUESTIONS_SCHEMA = jsonSchema({
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correct: { type: 'integer' },
          points: { type: 'number' },
        },
        required: ['question', 'options', 'correct'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
})

function extractJson(text: string) {
  const cleaned = String(text || '').replace(/```json|```/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
}

function normalize(list: any[]) {
  const out: any[] = []
  for (const q of list) {
    const question = String(q?.question || '').trim()
    if (!question) continue
    const rawOptions = Array.isArray(q?.options) ? q.options : []
    const options = Array.from({ length: 4 }, (_, i) => String(rawOptions[i] ?? '').trim() || 'لا يوجد')
    const correct = Math.max(0, Math.min(3, Number.isFinite(Number(q?.correct)) ? Number(q.correct) : 0))
    const points = Math.max(1, Number(q?.points) || 1)
    out.push({ question, options, correct, points })
  }
  return out
}

// Admin can paste a Gemini key in the dashboard; it is stored in SiteConfig.
async function getSavedGeminiKey() {
  try {
    const row = await db.siteConfig.findUnique({ where: { key: 'gemini_api_key' } })
    return row?.value ? String(row.value).trim() : ''
  } catch {
    return ''
  }
}

async function extractWithGemini(apiKey: string, prompt: string, mimeType: string, base64: string) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
      }),
      signal: AbortSignal.timeout(180_000),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error('Gemini ' + res.status + ': ' + detail.slice(0, 300))
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
  const parsed = extractJson(text)
  return Array.isArray(parsed?.questions) ? parsed.questions : []
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
    let filename = 'source.pdf'

    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: 'حجم الملف يجب ألا يتجاوز 20 ميجابايت' }, { status: 400 })
      }
      bytes = new Uint8Array(await file.arrayBuffer())
      const safeName = typeof file.name === 'string' ? file.name : ''
      const extension = safeName.toLowerCase().split('.').pop()
      mimeType = file.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg')
      filename = safeName || filename
    } else {
      let sourceUrl: URL
      try { sourceUrl = new URL(fileUrl) } catch { return NextResponse.json({ error: 'الرابط غير صحيح' }, { status: 400 }) }
      if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
        return NextResponse.json({ error: 'الرابط يجب أن يبدأ بـ http أو https' }, { status: 400 })
      }
      const response = await fetch(sourceUrl, { signal: AbortSignal.timeout(60_000) })
      if (!response.ok) return NextResponse.json({ error: 'تعذر تحميل الرابط' }, { status: 400 })
      bytes = new Uint8Array(await response.arrayBuffer())
      mimeType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() || 'application/pdf'
    }

    // Some servers report a generic type for PDFs; fall back to the magic bytes.
    if (mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream') {
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
      mimeType = isPdf ? 'application/pdf' : 'image/jpeg'
    }

    const allowedMime = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
    if (!allowedMime.has(mimeType)) {
      return NextResponse.json({ error: 'نوع الملف يجب أن يكون PDF أو صورة PNG/JPG/WebP' }, { status: 415 })
    }
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg'

    const prompt =
      'أنت مساعد لمعلّم رياضيات. استخرج كل أسئلة الاختيار من متعدد الموجودة في الملف المرفق' +
      (grade ? ' الخاص بـ' + grade : '') +
      '. لكل سؤال أعد نص السؤال وأربعة اختيارات ورقم الاختيار الصحيح (من 0 إلى 3) وعدد الدرجات. ' +
      'إذا كان السؤال مقاليًا أو ناقص الاختيارات فحوّله إلى اختيار من متعدد بأربعة اختيارات منطقية. ' +
      'اكتب المعادلات بشكل نصي واضح. لا تُعد أي شرح خارج البيانات المطلوبة.'

    const base64 = Buffer.from(bytes).toString('base64')
    const savedGeminiKey = await getSavedGeminiKey()
    const geminiKey = process.env.GEMINI_API_KEY || savedGeminiKey
    const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)

    let questions: any[] = []
    const errors: string[] = []

    // 1) Vercel AI Gateway (zero-config on Vercel / v0)
    if (hasGateway) {
      try {
        const result = await generateText({
          model: MODEL,
          temperature: 0.1,
          output: Output.object({ schema: QUESTIONS_SCHEMA }),
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'file', data: base64, mediaType: mimeType, filename },
              ],
            },
          ],
        })
        const fromOutput = Array.isArray(result.output?.questions) ? result.output.questions : []
        questions = fromOutput.length ? fromOutput : (extractJson(result.text)?.questions || [])
      } catch (err: any) {
        console.error('[v0] AI Gateway extraction failed:', err?.message || err)
        errors.push('Gateway: ' + (err?.message || 'unknown'))
      }
    }

    // 2) Direct Gemini key (env var or the key saved from the admin dashboard)
    if (!questions.length && geminiKey) {
      try {
        questions = await extractWithGemini(geminiKey, prompt, mimeType, base64)
      } catch (err: any) {
        console.error('[v0] Gemini extraction failed:', err?.message || err)
        errors.push('Gemini: ' + (err?.message || 'unknown'))
      }
    }

    if (!hasGateway && !geminiKey) {
      return NextResponse.json(
        { error: 'خدمة الذكاء الاصطناعي غير مهيأة. أضف مفتاح Gemini من الإعدادات أو فعّل Vercel AI Gateway.' },
        { status: 503 },
      )
    }

    const normalized = normalize(questions)
    if (!normalized.length) {
      return NextResponse.json(
        { error: 'لم يتم العثور على أسئلة في الملف. جرّب ملفاً أوضح أو صورة بجودة أعلى.', detail: errors.join(' | ') },
        { status: 422 },
      )
    }

    return NextResponse.json({ questions: normalized, model: hasGateway ? MODEL : 'gemini-2.5-flash' })
  } catch (error: any) {
    console.error('[v0] AI extract questions error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الملف: ' + (error?.message || '') }, { status: 500 })
  }
}
