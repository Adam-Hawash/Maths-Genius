// @ts-nocheck
// ============================================================
// FILE: src/app/api/ai/extract-questions/route.ts
// ROUTE: POST /api/ai/extract-questions
// PURPOSE: Extract questions from file or image using Gemini 3.6 (Primary) & Gemini 2.5 (Fallback)
// ============================================================

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request) {
  try {
    var formData = await request.formData()
    var file = formData.get('file')
    var fileUrl = formData.get('fileUrl') || ''
    var grade = formData.get('grade') || ''

    if (!grade.trim()) {
      return NextResponse.json({ error: 'Grade is required' }, { status: 400 })
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
        if (!fetchRes.ok) throw new Error('Failed to download: ' + fetchRes.status)
        var arrayBuf = await fetchRes.arrayBuffer()
        base64Data = Buffer.from(new Uint8Array(arrayBuf)).toString('base64')
        var ct = fetchRes.headers.get('content-type') || ''
        if (ct.includes('pdf')) { mimeType = 'application/pdf' }
        else if (ct.includes('png')) { mimeType = 'image/png' }
        else if (ct.includes('webp')) { mimeType = 'image/webp' }
        else if (ct.includes('image')) { mimeType = ct }
        else { mimeType = 'image/jpeg' }
      } catch (err) {
        return NextResponse.json({ error: 'Failed to download file: ' + (err.message || '') }, { status: 400 })
      }
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'No file data found' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not found' }, { status: 500 })
    }

    var lines = []
    lines.push('You are an expert math teacher. Analyze this ' + (mimeType === 'application/pdf' ? 'PDF document' : 'image') + ' carefully.')
    lines.push('Extract ALL math questions from it. For each question:')
    lines.push('- Extract the full question text in English')
    lines.push('- Provide exactly 4 answer options (A, B, C, D)')
    lines.push('- Identify the correct answer index (0=A, 1=B, 2=C, 3=D)')
    lines.push('- Each question is worth 1 point')
    lines.push('')
    lines.push('Rules:')
    lines.push('- Write ALL questions and options in English only')
    lines.push('- Write equations and numbers normally')
    lines.push('- If a question has fewer than 4 options, add plausible wrong options')
    lines.push('- Extract as many questions as you can find')
    lines.push('- Grade level: ' + grade)
    lines.push('')
    lines.push('Respond with JSON only, no additional text:')
    lines.push('{"questions": [{"question": "question text", "options": ["A", "B", "C", "D"], "correct": 0}]}')
    var prompt = lines.join('\n')

    var parts = [{ text: prompt }]
    parts.push({ inlineData: { mimeType: mimeType, data: base64Data } })

    // تحديد الموديلات: جيمناي 3.6 هو الأساسي، وجيمناي 2.5 هو الاحتياطي
    var models = ['gemini-3.6-flash', 'gemini-2.5-flash']
    var geminiRes = null
    var lastError = ''

    for (var mi = 0; mi < models.length; mi++) {
      try {
        var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent?key=' + apiKey
        console.log('Trying AI model:', models[mi])
        
        geminiRes = await fetch(modelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          }),
        })

        if (geminiRes.ok) {
          console.log('Successfully used model:', models[mi])
          break
        }

        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = models[mi] + ': ' + geminiRes.status + ' ' + errBody.substring(0, 300)
        console.error('Model failed:', lastError)
      } catch (e) {
        lastError = models[mi] + ': ' + (e.message || '')
        console.error('Model exception:', lastError)
        geminiRes = null
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      return NextResponse.json({ error: 'AI extraction error: ' + lastError }, { status: 500 })
    }

    var geminiData = await geminiRes.json()
    var text = ''
    try {
      text = geminiData.candidates[0].content.parts[0].text || ''
    } catch (e) {}

    if (!text.trim()) {
      return NextResponse.json({ error: 'No response text from AI' }, { status: 500 })
    }

    var jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response as JSON' }, { status: 500 })
    }

    var parsed = JSON.parse(jsonMatch[0])
    var extractedQuestions = (parsed.questions || []).map(function(q) {
      var opts = Array.isArray(q.options) ? q.options.slice() : ['N/A', 'N/A', 'N/A', 'N/A']
      while (opts.length < 4) opts.push('N/A')
      return { 
        question: q.question || '', 
        options: opts.slice(0, 4), 
        correct: typeof q.correct === 'number' ? q.correct : 0 
      }
    }).filter(function(q) { return q.question.trim().length > 0 })

    if (extractedQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions extracted. Make sure the file has clear questions.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      questions: extractedQuestions
    })

  } catch (error) {
    console.error('Extraction route error:', error)
    return NextResponse.json({ error: 'Error: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
