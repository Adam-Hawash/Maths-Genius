// @ts-nocheck
// FILE: src/app/api/ai-extract/route.ts
// ROUTE: POST /api/ai-extract
// PURPOSE: Extract questions from uploaded file (PDF/image) or URL
//          Supports 3 modes:
//            1) Single file (questions + answers mixed)
//            2) Separate question file + answer file
//            3) Single file URL
//          Returns questions ONLY (does NOT save to database)

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 180

function toBase64(file: File): Promise<string> {
  return file.arrayBuffer().then(function(buf) {
    return Buffer.from(new Uint8Array(buf)).toString('base64')
  })
}

function getMimeType(file: File): string {
  var fname = (file.name || '').toLowerCase()
  if (fname.endsWith('.pdf')) return 'application/pdf'
  if (fname.endsWith('.png')) return 'image/png'
  if (fname.endsWith('.webp')) return 'image/webp'
  return file.type || 'image/jpeg'
}

export async function POST(request) {
  try {
    var formData = await request.formData()
    var questionFile = formData.get('file') || formData.get('questionFile')
    var answerFile = formData.get('answerFile')
    var fileUrl = formData.get('fileUrl') || formData.get('questionUrl') || ''
    var answerUrl = formData.get('answerUrl') || ''
    var type = formData.get('type') || 'exam'
    var grade = formData.get('grade') || ''

    // Validate: at least question file or question URL must be present
    if ((!questionFile || questionFile.size === 0) && !fileUrl.trim()) {
      return NextResponse.json({ error: 'Upload a question file or enter a URL' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not found' }, { status: 500 })
    }

    // ============= Build inline parts (1 or 2 files) =============
    var parts = []
    var hasQuestionFile = questionFile && questionFile.size > 0
    var hasAnswerFile = answerFile && answerFile.size > 0

    if (hasQuestionFile) {
      var qBase64 = await toBase64(questionFile)
      parts.push({ inlineData: { mimeType: getMimeType(questionFile), data: qBase64 } })
    } else if (fileUrl.trim()) {
      try {
        var fetchRes = await fetch(fileUrl.trim())
        if (!fetchRes.ok) throw new Error('Download failed: ' + fetchRes.status)
        var arrayBuf = await fetchRes.arrayBuffer()
        var qBase64Url = Buffer.from(new Uint8Array(arrayBuf)).toString('base64')
        var ct = fetchRes.headers.get('content-type') || ''
        var qMime = ct.includes('pdf') ? 'application/pdf' : ct.includes('png') ? 'image/png' : ct.includes('webp') ? 'image/webp' : ct.includes('image') ? ct : 'image/jpeg'
        parts.push({ inlineData: { mimeType: qMime, data: qBase64Url } })
      } catch (err) {
        return NextResponse.json({ error: 'Failed to download question file' }, { status: 400 })
      }
    }

    if (hasAnswerFile) {
      var aBase64 = await toBase64(answerFile)
      parts.push({ inlineData: { mimeType: getMimeType(answerFile), data: aBase64 } })
    } else if (answerUrl.trim()) {
      try {
        var aFetchRes = await fetch(answerUrl.trim())
        if (!aFetchRes.ok) throw new Error('Download answer failed: ' + aFetchRes.status)
        var aBuf = await aFetchRes.arrayBuffer()
        var aBase64Url = Buffer.from(new Uint8Array(aBuf)).toString('base64')
        var aCt = aFetchRes.headers.get('content-type') || ''
        var aMime = aCt.includes('pdf') ? 'application/pdf' : aCt.includes('png') ? 'image/png' : aCt.includes('webp') ? 'image/webp' : aCt.includes('image') ? aCt : 'image/jpeg'
        parts.push({ inlineData: { mimeType: aMime, data: aBase64Url } })
      } catch (err) {
        // ignore answer file download errors, continue with just questions
      }
    }

    // ============= Build prompt =============
    var twoFilesMode = parts.length === 2
    var lines = []
    lines.push('You are an expert math teacher. I will give you ' + (twoFilesMode ? 'TWO documents' : 'ONE document') + ' containing math questions.')
    if (twoFilesMode) {
      lines.push('FIRST document = QUESTIONS only (no answers).')
      lines.push('SECOND document = ANSWERS / answer key (contains the solutions for those questions).')
      lines.push('Extract questions from the FIRST document, then MATCH them with their correct answers from the SECOND document.')
    } else {
      lines.push('Extract questions AND their answers from this single document.')
    }
    lines.push('')
    lines.push('IMPORTANT: Extract ONLY the questions that actually exist in the document. Do NOT invent, create, or add any questions that are not in the document.')
    lines.push('If the document has 5 questions, extract exactly those 5. If it has 20, extract all 20.')
    lines.push('')
    lines.push('There are TWO types of questions you should extract:')
    lines.push('1. "mcq" - Multiple Choice Questions: questions with options (A, B, C, D). If the question has options/choices, classify it as "mcq".')
    lines.push('2. "writing" - Essay/Written Questions: questions that require the student to write a full solution (no multiple choices). If the question asks to "solve", "prove", "find", "calculate", "simplify", "factor", "expand", or requires showing work, classify it as "writing".')
    lines.push('')
    lines.push('For "mcq" questions:')
    lines.push('- Copy the EXACT question text from the document (translate to English if needed)')
    lines.push('- Copy the EXACT options from the document (translate to English if needed)')
    lines.push('- If the document has fewer than 4 options, add plausible wrong options')
    lines.push('- If the document has no options, create 4 options with the correct answer included')
    lines.push('- Set correct answer index (0=A, 1=B, 2=C, 3=D) — use the answer from the answer key if available')
    lines.push('- Provide a modelAnswer with the step-by-step solution (from the answer key if available, else derive it)')
    lines.push('')
    lines.push('For "writing" questions:')
    lines.push('- Copy the EXACT question text from the document')
    lines.push('- Set options to empty array []')
    lines.push('- Set correct to -1')
    lines.push('- Provide a modelAnswer with the COMPLETE step-by-step solution (this is the reference answer for grading) — use the answer from the answer key if available')
    lines.push('- Set acceptedAnswers to an array of acceptable final answers (e.g. ["5", "x=5", "x = 5"])')
    lines.push('')
    lines.push('Rules:')
    lines.push('- ALL output text in English')
    lines.push('- Write math using proper math symbols. Use Unicode superscripts for powers: x\u00b2 for squared, x\u00b3 for cubed, x\u2074 for to the power of 4. Use \u221a for square root, \u221b for cubic root. Use \u00d7 for multiplication. Use \u00f7 for division. Do NOT write "squared", "cubed", "to the power of" as words. Do NOT use ^ or * symbols.')
    lines.push('- Do NOT add questions from outside the document')
    lines.push('- Do NOT skip any question from the document')
    lines.push('- Preserve the order of questions as they appear in the document')
    lines.push('- Match each question with its correct answer/solution')
    lines.push('- Grade: ' + grade + ' | Type: ' + type)
    lines.push('')
    lines.push('JSON only (note: questions array contains BOTH mcq and writing questions mixed together):')
    lines.push('{')
    lines.push('  "title": "...",')
    lines.push('  "content": "...",')
    lines.push('  "questions": [')
    lines.push('    {"type":"mcq","question":"...","options":["A","B","C","D"],"correct":0,"points":1,"modelAnswer":"step by step solution"},')
    lines.push('    {"type":"writing","question":"...","options":[],"correct":-1,"points":5,"modelAnswer":"full step by step solution","acceptedAnswers":["5","x=5"]}')
    lines.push('  ],')
    lines.push('  "answerKey": "..."')
    lines.push('}')
    var prompt = lines.join('\n')

    parts.unshift({ text: prompt })

    // ============= Call Gemini (try multiple models) =============
    var models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    var geminiRes = null
    var lastError = ''

    for (var mi = 0; mi < models.length; mi++) {
      try {
        var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent?key=' + apiKey
        geminiRes = await fetch(modelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 16384 }
          })
        })
        if (geminiRes.ok) { break }
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = models[mi] + ': ' + geminiRes.status + ' ' + errBody.substring(0, 200)
        console.error('Model failed:', lastError)
      } catch (e) {
        lastError = models[mi] + ': ' + (e.message || '')
        geminiRes = null
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      return NextResponse.json({ error: 'AI error: ' + lastError }, { status: 500 })
    }

    var geminiData = await geminiRes.json()
    var text = ''
    try { text = geminiData.candidates[0].content.parts[0].text || '' } catch (e) {}

    if (!text.trim()) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response', raw: text.substring(0, 500) }, { status: 500 })
    }

    var extracted = JSON.parse(jsonMatch[0])
    if (!extracted.title) { extracted.title = type + ' - ' + grade }
    if (!extracted.content) { extracted.content = '' }
    if (!Array.isArray(extracted.questions)) { extracted.questions = [] }
    if (!extracted.answerKey) { extracted.answerKey = '' }

    extracted.questions = extracted.questions.map(function(q) {
      var qType = q.type === 'writing' || q.type === 'essay' ? 'writing' : 'mcq'
      if (qType === 'writing') {
        return {
          type: 'writing',
          question: q.question || '',
          options: [],
          correct: -1,
          points: q.points || 5,
          modelAnswer: q.modelAnswer || q.answer || '',
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []
        }
      }
      return {
        type: 'mcq',
        question: q.question || '',
        options: (q.options || ['N/A', 'N/A', 'N/A', 'N/A']).slice(0, 4),
        correct: typeof q.correct === 'number' ? q.correct : 0,
        points: q.points || 1,
        modelAnswer: q.modelAnswer || ''
      }
    })

    var mcqCount = extracted.questions.filter(function(q) { return q.type === 'mcq' }).length
    var writingCount = extracted.questions.filter(function(q) { return q.type === 'writing' }).length
    extracted.stats = { mcq: mcqCount, writing: writingCount, total: extracted.questions.length, twoFilesMode: twoFilesMode }

    return NextResponse.json({ success: true, extracted: extracted })
  } catch (error) {
    console.error('AI extract error:', error)
    return NextResponse.json({ error: 'Error: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
