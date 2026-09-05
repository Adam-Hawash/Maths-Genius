// @ts-nocheck
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { callGemini, hasGeminiKey } from '@/lib/gemini'

export const runtime = 'nodejs'
export const maxDuration = 60

/* ------------------------------------------------------------
 * Image upload support (IMAGES ONLY):
 * - client sends { message, images: [dataURL, ...] }
 * - each dataURL is converted to a Gemini inlineData part
 * - max 4 images per message, each ~5MB binary max
 * ------------------------------------------------------------ */
var MAX_IMAGES = 4
var MAX_B64_LENGTH = 7000000 // ~5MB binary after base64
var DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/

function buildImageParts(images: string[]): any[] {
  var parts: any[] = []
  if (!Array.isArray(images)) return parts
  for (var i = 0; i < images.length && parts.length < MAX_IMAGES; i++) {
    var src = typeof images[i] === 'string' ? images[i] : ''
    var m = DATA_URL_RE.exec(src)
    if (!m) continue
    var data = m[2].replace(/\s/g, '')
    if (!data || data.length > MAX_B64_LENGTH) continue
    parts.push({ inlineData: { mimeType: m[1], data: data } })
  }
  return parts
}

export async function POST(request: Request) {
  try {
    var body = await request.json()
    var message = (body.message || '').trim()
    var context = body.context || {}
    var imageParts = buildImageParts(body.images)

    if (!message && imageParts.length === 0) {
      return NextResponse.json({ error: 'مفيش رسالة' }, { status: 400 })
    }

    if (!hasGeminiKey()) {
      return NextResponse.json({ reply: 'مرحباً! اكتب سؤالك.' })
    }

    // Images were attached but all of them were invalid → tell the user clearly
    var sentImages = Array.isArray(body.images) ? body.images.length : 0
    if (sentImages > 0 && imageParts.length === 0) {
      return NextResponse.json({ reply: 'الصور اللي بعتها مش مقبولة 😅 جرب تبعت صورة PNG أو JPG عادية.' })
    }

    var contextStr = [
      'أنت المساعد الذكي الرسمي لمنصة Maths Genius.',
      'قواعد ثابتة لازم تلتزم بيها في كل رد:',
      '1) اسم المنصة دايماً بالإنجليزي: Maths Genius — ممنوع تقول "عبقري الماث" أو أي ترجمة عربية للاسم.',
      '2) إحنا منصة ماث. استخدم المصطلحات الإنجليزية المدرسية دايماً: Powers مش أسس، Roots مش جذور، Exponents, Equations, Fractions (Numerator / Denominator), Geometry, Algebra, Brackets, Squares, Square roots, Cube roots.',
      '3) ممنوع نهائياً تكتب المصطلحات دي بالعربي: ممنوع "أسس" و"جذور" و"كسور" — دايماً Powers و Roots و Fractions.',
      '4) جاوب بالعامية المصرية بسرعة وباختصار.',
      '5) استخدم رموز (📚 ✅).',
      '6) لو الطالب بعت صورة فيها مسألة، اقرأ المسألة من الصورة وحلها له خطوة بخطوة باختصار.'
    ].join('\n')
    if (context.page) contextStr += '\nصفحة: ' + context.page
    if (context.studentId) {
      try {
        var student = await db.$queryRawUnsafe('SELECT name, grade FROM Student WHERE id = ? LIMIT 1', context.studentId)
        if (student && student.length > 0) contextStr += '\nالطالب: ' + (student[0].name || '')
      } catch (e) {}
    }

    if (!message && imageParts.length > 0) {
      message = 'شوف الصور دي وساعدني فيها.'
    }

    var prompt = contextStr + '\n\nسؤال: ' + message + '\n\nالرد:'

    // Gemini 3.6 first (auto model discovery + key rotation on quota)
    // thinking:'low' → reasoning models stay fast and don't burn the token budget
    // images go FIRST in the parts list so the model sees them before the text
    var parts = imageParts.concat([{ text: prompt }])
    var result = await callGemini({
      parts: parts,
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      timeoutMs: imageParts.length > 0 ? 45000 : 25000,
      thinking: 'low',
    })

    if (result.ok && result.text) {
      return NextResponse.json({ reply: result.text })
    }

    console.error('[AI Assistant] failed:', result.error)
    var busyMsg = 'المساعد مشغول دلوقتي جداً، جرب تاني بعد شوية 🙏'
    if (result.status === 429) busyMsg = 'الحصة اليومية للمساعد الذكي خلصت، جرب بكرة أو بعدين بشوية 🙏'
    return NextResponse.json({ reply: busyMsg })
  } catch (error) {
    return NextResponse.json({ reply: 'المساعد مشغول دلوقتي جداً، جرب تاني بعد شوية 🙏' })
  }
}
