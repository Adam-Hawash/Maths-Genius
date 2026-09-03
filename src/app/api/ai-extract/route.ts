// @ts-nocheck
// FILE: src/app/api/ai-extract/route.ts
// ROUTE: POST /api/ai-extract
// PURPOSE: Extract questions from uploaded file (PDF/image) or URL
//          Returns questions ONLY (does NOT save to database)

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request) {
  try {
    var formData = await request.formData()
    var file = formData.get('file')
    var fileUrl = formData.get('fileUrl') || ''
    var type = formData.get('type') || 'exam'
    var grade = formData.get('grade') || ''

    if ((!file || file.size === 0) && !fileUrl.trim()) {
      return NextResponse.json({ error: 'Upload a file or enter a URL' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not found' }, { status: 500 })
    }

    var base64Data = ''
    var mimeType = ''

    if (file && file.size > 0) {
      var bytes = new Uint8Array(await file.arrayBuffer())
      base64Data = Buffer.from(bytes).toString('base64')
      var fname = (file.name || '').toLowerCase()
      if (fname.endsWith('.pdf')) { mimeType = 'application/pdf' }
      else if (fname.endsWith('.png')) { mimeType = 'image/png' }
      else if (fname.endsWith('.webp')) { mimeType = 'image/webp' }
      else { mimeType = file.type || 'image/jpeg' }
    } else if (fileUrl.trim()) {
      try {
        var fetchRes = await fetch(fileUrl.trim())
        if (!fetchRes.ok) throw new Error('Download failed: ' + fetchRes.status)
        var arrayBuf = await fetchRes.arrayBuffer()
        base64Data = Buffer.from(new Uint8Array(arrayBuf)).toString('base64')
        var ct = fetchRes.headers.get('content-type') || ''
        if (ct.includes('pdf')) { mimeType = 'application/pdf' }
        else if (ct.includes('png')) { mimeType = 'image/png' }
        else if (ct.includes('webp')) { mimeType = 'image/webp' }
        else if (ct.includes('image')) { mimeType = ct }
        else { mimeType = 'image/jpeg' }
      } catch (err) {
        return NextResponse.json({ error: 'Failed to download file' }, { status: 400 })
      }
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'No file data' }, { status: 400 })
    }

    var lines = []
    lines.push('You are an expert math teacher. I will give you a document/image containing math questions.')
    lines.push('IMPORTANT: Extract ONLY the questions that actually exist in this document. Do NOT invent, create, or add any questions that are not in the document.')
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
    lines.push('- Set correct answer index (0=A, 1=B, 2=C, 3=D)')
    lines.push('- Provide a modelAnswer with the step-by-step solution')
    lines.push('')
    lines.push('For "writing" questions:')
    lines.push('- Copy the EXACT question text from the document')
    lines.push('- Set options to empty array []')
    lines.push('- Set correct to -1')
    lines.push('- Provide a modelAnswer with the COMPLETE step-by-step solution (this is the reference answer for grading)')
    lines.push('- Set acceptedAnswers to an array of acceptable final answers (e.g. ["5", "x=5", "x = 5"])')
    lines.push('')
    lines.push('Rules:')
    lines.push('- ALL output text in English')
    lines.push('- Write math using proper math symbols. Use Unicode superscripts for powers: x\u00b2 for squared, x\u00b3 for cubed, x\u2074 for to the power of 4. Use \u221a for square root, \u221b for cubic root. Use \u00d7 for multiplication. Use \u00f7 for division. Do NOT write "squared", "cubed", "to the power of" as words. Do NOT use ^ or * symbols.')
    lines.push('- Do NOT add questions from outside the document')
    lines.push('- Do NOT skip any question from the document')
    lines.push('- Preserve the order of questions as they appear in the document')
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

    var parts = [{ text: prompt }]
    parts.push({ inlineData: { mimeType: mimeType, data: base64Data } })

    var models = ['gemini-3.6-flash', 'gemini-2.5-flash']
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
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          })
        })
        if (geminiRes.ok) { break }
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = models[mi] + ': ' + geminiRes.status
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
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
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
      // MCQ
      return {
        type: 'mcq',
        question: q.question || '',
        options: (q.options || ['N/A', 'N/A', 'N/A', 'N/A']).slice(0, 4),
        correct: typeof q.correct === 'number' ? q.correct : 0,
        points: q.points || 1,
        modelAnswer: q.modelAnswer || ''
      }
    })

    // Stats about extraction
    var mcqCount = extracted.questions.filter(function(q) { return q.type === 'mcq' }).length
    var writingCount = extracted.questions.filter(function(q) { return q.type === 'writing' }).length
    extracted.stats = { mcq: mcqCount, writing: writingCount, total: extracted.questions.length }

    return NextResponse.json({ success: true, extracted: extracted })
  } catch (error) {
    console.error('AI extract error:', error)
    return NextResponse.json({ error: 'Error: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
