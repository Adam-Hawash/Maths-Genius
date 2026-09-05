// @ts-nocheck
// Shared AI image grading logic — used by /api/ai/grade-image (direct) and
// /api/homework/submit + /api/exams/submit (in-process) to avoid localhost fetch.

import { db } from '@/lib/db'

const MODELS = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-flash-latest']

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

  var prompt = 'أنت معلم رياضيات خبير جداً وذكي. الطالب رفع صورة لحله.\n\n'
  prompt += 'السؤال: ' + question + '\n\n'
  if (modelAnswer) {
    prompt += 'الإجابة النموذجية: ' + modelAnswer + acceptedAnswersStr + '\n\n'
  }
  prompt += 'إنت ذكي ومفروض تفهم السياق كامل. اتبع الآتي:\n\n'
  prompt += '1. اقرا الصورة كويس جداً - شوف كل المكتوب فيها\n'
  prompt += '2. دور على الإجابة النهائية للطالب - يعني النتيجة الأخيرة اللي وصلها\n'
  prompt += '   - ممكن تكون بعد علامة = الأخيرة\n'
  prompt += '   - ممكن تكون آخر رقم أو تعبير مكتوب\n'
  prompt += '   - ممكن تكون مكتوبة جنبها كلام تاني - خد بس الإجابة النهائية\n'
  prompt += '3. من الإجابة النموذجية، استخرج الإجابة النهائية (بعد آخر = أو آخر نتيجة)\n'
  prompt += '4. قارن الإجابتين النهائيتين:\n'
  prompt += '   - لو متطابقتين أو مكافئتين رياضياً → صحيحة (isCorrect: true)\n'
  prompt += '   - لو مختلفين → خاطئة (isCorrect: false)\n'
  prompt += '5. الإجابات المكافئة تعتبر صحيحة:\n'
  prompt += '   - 1024 = 2^10\n'
  prompt += '   - x^4*y^3 = x4y3\n'
  prompt += '   - 0.5 = 1/2\n'
  prompt += '   - n=5 = n = 5\n'
  prompt += '6. لو الطالب كتب الإجابة النهائية بس بدون خطوات → اعتبرها صحيحة لو مطابقة\n'
  prompt += '7. لو الطالب كتب إجابة نهائية صحيحة بس فيه أخطاء في الخطوات → اعتبرها صحيحة\n\n'
  prompt += 'ارجع JSON فقط:\n'
  prompt += '{"extractedAnswer": "كل المكتوب", "finalAnswer": "الإجابة النهائية بس", "isCorrect": true/false, "feedback": "تعليق قصير"}\n'

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
  var extractedAnswer = parsed.extractedAnswer || ''
  var finalAns = parsed.finalAnswer || ''

  // Combine extracted answer with final answer for display
  var displayExtracted = extractedAnswer
  if (finalAns && finalAns !== extractedAnswer) {
    displayExtracted = extractedAnswer + '\nالإجابة النهائية: ' + finalAns
  }

  return {
    extractedAnswer: displayExtracted,
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

  var prompt = 'أنت معلم رياضيات خبير وذكي. صحح إجابة الطالب.\n\n'
  prompt += 'السؤال: ' + question + '\n\n'
  prompt += 'إجابة الطالب: ' + studentAnswer + '\n\n'
  prompt += 'الإجابة النموذجية: ' + modelAnswer + acceptedStr + '\n\n'
  prompt += 'إنت ذكي ومفروض تفهم السياق. اتبع الآتي:\n'
  prompt += '1. من إجابة الطالب، استخرج الإجابة النهائية (آخر نتيجة أو بعد آخر =)\n'
  prompt += '2. من الإجابة النموذجية، استخرج الإجابة النهائية (بعد آخر =)\n'
  prompt += '3. قارن الإجابتين النهائيتين:\n'
  prompt += '   - لو متطابقتين أو مكافئتين → صحيحة\n'
  prompt += '   - لو مختلفين → خاطئة\n'
  prompt += '4. الإجابات المكافئة تعتبر صحيحة:\n'
  prompt += '   - 1024 = 2^10\n'
  prompt += '   - n=5 = n = 5\n'
  prompt += '   - 0.5 = 1/2\n'
  prompt += '5. لو الطالب كتب الإجابة النهائية بس بدون خطوات → صحيحة لو مطابقة\n'
  prompt += '6. لو فيه إجابة نهائية صحيحة بس خطوات فيها أخطاء → صحيحة\n\n'
  prompt += 'ارجع JSON فقط:\n'
  prompt += '{"isCorrect": true/false, "feedback": "تعليق قصير"}\n'

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
