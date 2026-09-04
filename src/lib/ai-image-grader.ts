// @ts-nocheck
// Shared AI image grading logic — used by /api/ai/grade-image (direct) and
// /api/homework/submit + /api/exams/submit (in-process) to avoid localhost fetch.

import { db } from '@/lib/db'

const MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  var lastError = ''
  for (var mi = 0; mi < MODELS.length; mi++) {
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODELS[mi] + ':generateContent?key=' + apiKey
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      })
      if (geminiRes.ok) {
        var data = await geminiRes.json()
        var text = ''
        try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
        return { ok: true, text: text }
      }
      var errBody = ''
      try { errBody = await geminiRes.text() } catch (e) {}
      lastError = MODELS[mi] + ': ' + geminiRes.status + ' ' + errBody.substring(0, 200)
    } catch (e) {
      lastError = MODELS[mi] + ': ' + (e.message || '')
    }
  }
  return { ok: false, error: lastError }
}

function parseAIJson(text: string): any | null {
  if (!text || !text.trim()) return null
  var jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    return null
  }
}

// In-process grade function — fetches media, calls Gemini, returns result.
export async function gradeImageAnswer(params: {
  mediaId: string
  question: string
  modelAnswer?: string
  acceptedAnswers?: string[]
  maxPoints?: number
}): Promise<{
  extractedAnswer: string
  isCorrect: boolean
  feedback: string
  awardedPoints: number
  maxPoints: number
  error?: string
}> {
  var mediaId = params.mediaId
  var question = params.question || ''
  var modelAnswer = params.modelAnswer || ''
  var acceptedAnswers = Array.isArray(params.acceptedAnswers) ? params.acceptedAnswers : []
  var maxPoints = typeof params.maxPoints === 'number' ? params.maxPoints : 5

  if (!mediaId) {
    return { extractedAnswer: '', isCorrect: false, feedback: 'mediaId required', awardedPoints: 0, maxPoints: maxPoints, error: 'mediaId required' }
  }

  var apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
    return { extractedAnswer: '', isCorrect: false, feedback: 'AI غير متاح', awardedPoints: 0, maxPoints: maxPoints, error: 'no api key' }
  }

  // Fetch the media record (image stored as base64)
  var media: any = null
  try {
    media = await db.media.findUnique({ where: { id: mediaId } })
  } catch (e) {
    try {
      var rows = await db.$queryRawUnsafe('SELECT id, filename, fileType, data FROM Media WHERE id = ? LIMIT 1', mediaId)
      media = rows && rows.length > 0 ? rows[0] : null
    } catch (e2) {
      media = null
    }
  }

  if (!media || !media.data) {
    return { extractedAnswer: '', isCorrect: false, feedback: 'الصورة غير موجودة', awardedPoints: 0, maxPoints: maxPoints, error: 'media not found' }
  }

  // Determine mime type
  var mimeType = media.fileType || 'image/jpeg'
  if (!mimeType.startsWith('image/')) {
    if (mimeType.includes('png') || (media.filename || '').endsWith('.png')) mimeType = 'image/png'
    else if (mimeType.includes('webp') || (media.filename || '').endsWith('.webp')) mimeType = 'image/webp'
    else mimeType = 'image/jpeg'
  }

  // Build the prompt
  var acceptedAnswersStr = acceptedAnswers.length > 0
    ? '\n\nإجابات مقبولة أخرى:\n' + acceptedAnswers.map(function(a, i) { return (i + 1) + '. ' + a }).join('\n')
    : ''

  var prompt = 'أنت معلم رياضيات. الطالب رفع صورة لحله لهذا السؤال:\n\n'
  prompt += 'السؤال: ' + question + '\n\n'
  if (modelAnswer) {
    prompt += 'الإجابة النموذجية: ' + modelAnswer + acceptedAnswersStr + '\n\n'
  }
  prompt += 'المطلوب:\n'
  prompt += '1. اقرأ الصورة بدقة واستخرج إجابة الطالب كما هي مكتوبة (نصياً أو رياضياً)\n'
  prompt += '2. قارنها بالإجابة النموذجية\n'
  prompt += '3. حدد إن كانت صحيحة أم خاطئة\n\n'
  prompt += 'أرجع النتيجة بصيغة JSON فقط (بدون أي شرح إضافي):\n'
  prompt += '{\n'
  prompt += '  "extractedAnswer": "نص إجابة الطالب كما هي في الصورة",\n'
  prompt += '  "isCorrect": true أو false,\n'
  prompt += '  "feedback": "تعليق قصير بالعربية - صح أو غلط وليه"\n'
  prompt += '}\n'
  prompt += '\nملاحظات:\n'
  prompt += '- لو الصورة فاضية أو مفيش إجابة مكتوبة فيها، رجع: {"extractedAnswer": "", "isCorrect": false, "feedback": "الصورة فاضية"}\n'
  prompt += '- لو الإجابة النهائية صحيحة حتى لو الخطوات مختلفة، اعتبرها صحيحة\n'
  prompt += '- استخدم الترميز الرياضي العادي (m^2 بدل m²)\n'

  var parts = [
    { text: prompt },
    { inlineData: { mimeType: mimeType, data: media.data } }
  ]

  var result = await callGemini(apiKey, parts)

  if (!result.ok) {
    console.error('[gradeImageAnswer] Gemini failed:', result.error)
    return {
      extractedAnswer: '',
      isCorrect: false,
      feedback: 'فشل التصحيح بالـ AI',
      awardedPoints: 0,
      maxPoints: maxPoints,
      error: result.error,
    }
  }

  var parsed = parseAIJson(result.text || '')
  if (!parsed) {
    console.error('[gradeImageAnswer] Failed to parse:', (result.text || '').substring(0, 200))
    return {
      extractedAnswer: result.text || '',
      isCorrect: false,
      feedback: 'تعذر قراءة نتيجة التصحيح',
      awardedPoints: 0,
      maxPoints: maxPoints,
      error: 'parse failed',
    }
  }

  var isCorrect = parsed.isCorrect === true
  var awardedPoints = isCorrect ? maxPoints : 0

  return {
    extractedAnswer: parsed.extractedAnswer || '',
    isCorrect: isCorrect,
    feedback: parsed.feedback || (isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'),
    awardedPoints: awardedPoints,
    maxPoints: maxPoints,
  }
}

// Extract media IDs from a student answer that contains "[📷 صورة مرفقة: MEDIA_ID]" tags
export function extractImageMediaIds(answerText: string): string[] {
  if (!answerText || typeof answerText !== 'string') return []
  var matches = answerText.match(/\[📷 صورة مرفقة:\s*([^\]\s]+)\]/g) || []
  var ids: string[] = []
  matches.forEach(function(m) {
    var idMatch = m.match(/\[📷 صورة مرفقة:\s*([^\]\s]+)\]/)
    if (idMatch && idMatch[1]) ids.push(idMatch[1])
  })
  return ids
}
