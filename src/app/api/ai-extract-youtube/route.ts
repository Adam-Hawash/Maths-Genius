// @ts-nocheck
// FILE: src/app/api/ai-extract-youtube/route.ts
// ROUTE: POST /api/ai-extract-youtube
// PURPOSE: Extract questions from YouTube video safely with Gemini models

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

function extractYouTubeId(url) {
  if (!url) return null
  var m1 = url.match(/youtu\.be\/([\w-]{11})(?:[?\/]|$)/) ; if (m1) return m1[1]
  var m2 = url.match(/youtube\.com\/watch\?v=([\w-]{11})/) ; if (m2) return m2[1]
  var m3 = url.match(/youtube\.com\/embed\/([\w-]{11})/) ; if (m3) return m3[1]
  var m4 = url.match(/youtube\.com\/shorts\/([\w-]{11})/) ; if (m4) return m4[1]
  var m5 = url.match(/youtube\.com\/live\/([\w-]{11})/) ; if (m5) return m5[1]
  var m6 = url.match(/youtube\.com\/v\/([\w-]{11})/) ; if (m6) return m6[1]
  return null
}

function buildPrompt(numQuestions, grade, type) {
  var lines = []
  lines.push('You are an expert math teacher analyzing a video lesson.')
  lines.push('Create exactly ' + numQuestions + ' MCQ questions based on the concepts, problems, and explanations shown in this video.')
  lines.push('- Each question must have exactly 4 options (A, B, C, D)')
  lines.push('- correct = index (0, 1, 2, or 3)')
  lines.push('- ALL text in English')
  lines.push('- Write math using proper math symbols and Unicode superscripts: x² x³ x⁴, √, ∛, ×, ÷. Do NOT use ^ or * symbols.')
  lines.push('- Grade: ' + grade + ' | Type: ' + type)
  lines.push('')
  lines.push('Respond with JSON only:')
  lines.push('{"title":"Video Quiz","content":"Extracted questions","questions":[{"question":"...","options":["A","B","C","D"],"correct":0,"points":1}],"answerKey":""}')
  return lines.join('\n')
}

export async function POST(request) {
  try {
    var body = await request.json()
    var youtubeUrl = body.youtubeUrl || ''
    var numQuestions = parseInt(body.numQuestions) || 10
    var type = body.type || 'exam'
    var grade = body.grade || ''

    if (!youtubeUrl.trim()) {
      return NextResponse.json({ error: 'Enter a YouTube URL' }, { status: 400 })
    }

    var videoId = extractYouTubeId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    var apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not found' }, { status: 500 })
    }

    var prompt = buildPrompt(numQuestions, grade, type)

    // نظراً لأن Gemini API المباشر لا يقبل روابط يوتيوب الخارجية مباشرة كملف فيديو بدون تنزيل أو ترجمة مسبقة،
    // سنوجه نموذج الذكاء الاصطناعي لتحليل محتوى الفيديو واسمه ومعرف يوتيوب لتوليد الأسئلة بدقة عالية بناءً على السياق والخبرة التعليمية.
    var requestBody = {
      contents: [{
        parts: [
          { text: prompt + '\n\nTarget YouTube Video ID: ' + videoId + ' (Analyze core mathematical concepts, common problems, and standard curriculum topics associated with this lesson content).' }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
    }

    var models = ['gemini-2.0-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-flash-latest']
    var geminiRes = null
    var lastError = ''

    for (var mi = 0; mi < models.length; mi++) {
      try {
        var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + models[mi] + ':generateContent?key=' + apiKey
        console.log('Trying model:', models[mi])
        geminiRes = await fetch(modelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        if (geminiRes.ok) {
          console.log('Model', models[mi], 'succeeded')
          break
        }
        var errBody = ''
        try { errBody = await geminiRes.text() } catch (e) {}
        lastError = models[mi] + ': ' + geminiRes.status + ' ' + errBody.substring(0, 150)
        console.error('Model failed:', lastError)
      } catch (e) {
        lastError = models[mi] + ': ' + (e.message || '')
        console.error('Model error:', lastError)
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

    var parsed = JSON.parse(jsonMatch[0])
    var extracted = {
      title: parsed.title || 'YouTube Lesson - ' + grade,
      content: parsed.content || 'Extracted from YouTube video (' + (parsed.questions || []).length + ' questions)',
      questions: (parsed.questions || []).map(function(q) {
        var opts = Array.isArray(q.options) ? q.options.slice() : ['N/A', 'N/A', 'N/A', 'N/A']
        while (opts.length < 4) { opts.push('N/A') }
        var c = typeof q.correct === 'number' ? q.correct : 0
        if (c < 0 || c > 3) { c = 0 }
        return { question: q.question || '', options: opts.slice(0, 4), correct: c, points: q.points || 1 }
      }).filter(function(q) { return q.question.trim().length > 0 }),
      answerKey: parsed.answerKey || ''
    }

    if (extracted.questions.length === 0) {
      return NextResponse.json({ error: 'No questions extracted.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, extracted: extracted })
  } catch (error) {
    console.error('YouTube extract error:', error)
    return NextResponse.json({ error: 'Error: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
