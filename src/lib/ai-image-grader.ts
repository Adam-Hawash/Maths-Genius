// @ts-nocheck
// Shared AI image grading logic — used by /api/ai/grade-image (direct) and
// /api/homework/submit + /api/exams/submit (in-process) to avoid localhost fetch.

import { db } from '@/lib/db'

const MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-flash-latest']

async function callGemini(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  var lastError = ''
  for (var mi = 0; mi < MODELS.length; mi++) {
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODELS[mi] + ':generateContent?key=' + apiKey
      // Per-request timeout (10s for first model, 15s for fallbacks)
      var controller = new AbortController()
      var timeoutMs = mi === 0 ? 10000 : 15000
      var timeoutHandle = setTimeout(function() { controller.abort() }, timeoutMs)
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutHandle)
      if (geminiRes.ok) {
        var data = await geminiRes.json()
        var text = ''
        try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
        if (text) return { ok: true, text: text }
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
  var rawMediaId = (params.mediaId || '').trim()
  // If mediaId is a path like /api/files/ID, extract the ID segment
  var mediaId = rawMediaId
  if (rawMediaId.indexOf('/') >= 0) {
    var lastSlash = rawMediaId.lastIndexOf('/')
    mediaId = rawMediaId.substring(lastSlash + 1).trim()
  }
  mediaId = mediaId.replace(/^["']|["']$/g, '')
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

// Extract media IDs from a student answer that contains image attachment tags.
// Supports two formats:
//   1. [📷 صورة مرفقة: MEDIA_ID]              → returns ['MEDIA_ID']
//   2. [📷 صورة مرفقة: /api/files/MEDIA_ID]   → returns ['MEDIA_ID']
//   3. [📷 صورة مرفقة: /some/path/MEDIA_ID]   → returns ['MEDIA_ID']
export function extractImageMediaIds(answerText: string): string[] {
  if (!answerText || typeof answerText !== 'string') return []
  var matches = answerText.match(/\[📷\s*صورة\s*مرفقة:\s*([^\]]+?)\]/g) || []
  var ids: string[] = []
  matches.forEach(function(m) {
    var idMatch = m.match(/\[📷\s*صورة\s*مرفقة:\s*([^\]]+?)\]/)
    if (idMatch && idMatch[1]) {
      var raw = idMatch[1].trim()
      // Strip surrounding quotes
      raw = raw.replace(/^["']|["']$/g, '')
      // If it's a path like /api/files/ID or anything/ID, take the last segment
      var lastSlash = raw.lastIndexOf('/')
      var mediaId = lastSlash >= 0 ? raw.substring(lastSlash + 1) : raw
      mediaId = mediaId.trim()
      if (mediaId) ids.push(mediaId)
    }
  })
  return ids
}

// ============= AI TEXT GRADING =============
// Grades a writing answer (no image) against the model answer using Gemini.
// Returns: { isCorrect, awardedPoints, feedback } or null if AI fails.
export async function gradeTextAnswer(params: {
  question: string
  studentAnswer: string
  modelAnswer: string
  acceptedAnswers?: string[]
  maxPoints?: number
}): Promise<{
  extractedAnswer: string
  isCorrect: boolean
  feedback: string
  awardedPoints: number
  maxPoints: number
} | null> {
  var question = params.question || ''
  var studentAnswer = params.studentAnswer || ''
  var modelAnswer = params.modelAnswer || ''
  var acceptedAnswers = Array.isArray(params.acceptedAnswers) ? params.acceptedAnswers : []
  var maxPoints = typeof params.maxPoints === 'number' ? params.maxPoints : 5

  if (!studentAnswer || !modelAnswer) return null

  var apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) return null

  var acceptedStr = acceptedAnswers.length > 0
    ? '\nإجابات مقبولة أخرى:\n' + acceptedAnswers.map(function(a, i) { return (i + 1) + '. ' + a }).join('\n')
    : ''

  var prompt = 'أنت معلم رياضيات محترم. صحح إجابة الطالب ده السؤال:\n\n'
  prompt += 'السؤال: ' + question + '\n\n'
  prompt += 'إجابة الطالب: ' + studentAnswer + '\n\n'
  prompt += 'الإجابة النموذجية: ' + modelAnswer + acceptedStr + '\n\n'
  prompt += 'المطلوب:\n'
  prompt += '1. قارن الإجابة النهائية للطالب بالإجابة النموذجية\n'
  prompt += '2. لو الإجابة النهائية صح، اعتبرها صحيحة навn لو الخطوات ناقصة\n'
  prompt += '3. لو الإجابة النهائية غلط، اعتبرها خاطئة\n\n'
  prompt += 'أرجع JSON فقط:\n'
  prompt += '{\n'
  prompt += '  "isCorrect": true أو false,\n'
  prompt += '  "feedback": "تعليق قصير بالعربية - صح أو غلط وليه"\n'
  prompt += '}\n'

  var parts = [{ text: prompt }]
  var result = await callGeminiShared(apiKey, parts)
  if (!result.ok || !result.text) return null

  var parsed = parseAIJsonShared(result.text)
  if (!parsed) return null

  var isCorrect = parsed.isCorrect === true
  return {
    extractedAnswer: studentAnswer,
    isCorrect: isCorrect,
    feedback: parsed.feedback || (isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'),
    awardedPoints: isCorrect ? maxPoints : 0,
    maxPoints: maxPoints,
  }
}

// Shared helpers (re-used by gradeImageAnswer + gradeTextAnswer)
async function callGeminiShared(apiKey: string, parts: any[]): Promise<{ ok: boolean; text?: string; error?: string }> {
  var lastError = ''
  for (var mi = 0; mi < MODELS.length; mi++) {
    try {
      var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODELS[mi] + ':generateContent?key=' + apiKey
      var controller = new AbortController()
      var timeoutMs = mi === 0 ? 15000 : 20000
      var timeoutHandle = setTimeout(function() { controller.abort() }, timeoutMs)
      var geminiRes = await fetch(modelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutHandle)
      if (geminiRes.ok) {
        var data = await geminiRes.json()
        var text = ''
        try { text = data.candidates[0].content.parts[0].text || '' } catch (e) {}
        if (text) return { ok: true, text: text }
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

function parseAIJsonShared(text: string): any | null {
  if (!text || !text.trim()) return null
  var jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch (e) {
    return null
  }
}
