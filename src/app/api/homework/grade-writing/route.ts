// @ts-nocheck
// POST /api/homework/grade-writing
// PURPOSE: Auto-grade writing/essay questions using AI based on modelAnswer
// Input: { studentId, homeworkId, writingAnswers: [{ question, answer, modelAnswer, acceptedAnswers, points }] }
// Output: { graded: [{ question, answer, modelAnswer, awardedPoints, maxPoints, isCorrect, feedback }] }

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 180

interface WritingAnswer {
  question: string
  answer: string
  modelAnswer?: string
  acceptedAnswers?: string[]
  points: number
}

interface GradedAnswer {
  question: string
  answer: string
  modelAnswer: string
  awardedPoints: number
  maxPoints: number
  isCorrect: boolean
  feedback: string
}

// Quick check: if student answer matches acceptedAnswers directly (case-insensitive, trimmed)
function quickMatch(studentAnswer: string, acceptedAnswers: string[]): boolean {
  if (!studentAnswer || !acceptedAnswers || acceptedAnswers.length === 0) return false
  var cleaned = studentAnswer.trim().toLowerCase().replace(/\s+/g, ' ')
  for (var i = 0; i < acceptedAnswers.length; i++) {
    var acc = (acceptedAnswers[i] || '').trim().toLowerCase().replace(/\s+/g, ' ')
    if (acc && (cleaned === acc || cleaned.endsWith('= ' + acc) || cleaned.endsWith('=' + acc) || cleaned.includes(acc))) {
      return true
    }
  }
  return false
}

export async function POST(request) {
  try {
    var body = await request.json()
    var writingAnswers: WritingAnswer[] = body.writingAnswers || []
    var studentId = body.studentId
    var homeworkId = body.homeworkId

    if (!writingAnswers || writingAnswers.length === 0) {
      return NextResponse.json({ success: true, graded: [], totalAwarded: 0, totalMax: 0 })
    }

    var apiKey = process.env.GEMINI_API_KEY || ''
    var graded: GradedAnswer[] = []
    var totalAwarded = 0
    var totalMax = 0

    // First pass: quick accept if exact match with acceptedAnswers
    var needAI: WritingAnswer[] = []
    for (var i = 0; i < writingAnswers.length; i++) {
      var wa = writingAnswers[i]
      totalMax += wa.points || 0

      // If student answer is empty, give 0
      if (!wa.answer || wa.answer.trim() === '' || wa.answer.trim() === '[📷 صورة مرفقة]') {
        graded[i] = {
          question: wa.question,
          answer: wa.answer || '',
          modelAnswer: wa.modelAnswer || '',
          awardedPoints: 0,
          maxPoints: wa.points || 0,
          isCorrect: false,
          feedback: 'لم يتم تقديم إجابة'
        }
        continue
      }

      // Quick check against acceptedAnswers
      if (wa.acceptedAnswers && wa.acceptedAnswers.length > 0 && quickMatch(wa.answer, wa.acceptedAnswers)) {
        graded[i] = {
          question: wa.question,
          answer: wa.answer,
          modelAnswer: wa.modelAnswer || '',
          awardedPoints: wa.points || 0,
          maxPoints: wa.points || 0,
          isCorrect: true,
          feedback: 'الإجابة صحيحة ✓ (تطابقت مع الإجابات المقبولة)'
        }
        totalAwarded += wa.points || 0
        continue
      }

      // If no modelAnswer, can't grade — skip to AI
      if (!wa.modelAnswer) {
        graded[i] = {
          question: wa.question,
          answer: wa.answer,
          modelAnswer: '',
          awardedPoints: 0,
          maxPoints: wa.points || 0,
          isCorrect: false,
          feedback: 'لا توجد إجابة نموذجية للتصحيح — يحتاج تصحيح يدوي'
        }
        continue
      }

      needAI.push(wa)
      // Placeholder until AI grades it
      graded[i] = {
        question: wa.question,
        answer: wa.answer,
        modelAnswer: wa.modelAnswer,
        awardedPoints: 0,
        maxPoints: wa.points || 0,
        isCorrect: false,
        feedback: 'بانتظار التصحيح بالـ AI...'
      }
    }

    // If AI not configured, return quick-graded results
    if (!apiKey || needAI.length === 0) {
      // Recalculate total
      var recalculatedTotal = 0
      for (var k = 0; k < graded.length; k++) { recalculatedTotal += graded[k].awardedPoints }
      return NextResponse.json({
        success: true,
        graded: graded,
        totalAwarded: recalculatedTotal,
        totalMax: totalMax,
        aiUsed: false,
        message: needAI.length === 0 ? 'تم التصحيح السريع' : 'AI غير متاح - تم استخدام التصحيح السريع فقط'
      })
    }

    // ============= AI Grading =============
    // Build one big prompt with all questions needing AI grading
    var lines = []
    lines.push('You are an expert math teacher grading student answers.')
    lines.push('For each question, compare the student answer with the model answer.')
    lines.push('Award partial credit if the student shows correct steps but has minor errors.')
    lines.push('')
    lines.push('Rules:')
    lines.push('- If the student answer is mathematically equivalent to the model answer, give full credit')
    lines.push('- If the final answer is correct but steps are missing, give 50% credit')
    lines.push('- If steps are correct but final answer is wrong, give 30% credit')
    lines.push('- If completely wrong or unrelated, give 0')
    lines.push('- Round awarded points to nearest integer (0, 1, 2, ..., up to maxPoints)')
    lines.push('- Provide brief feedback in English explaining the score')
    lines.push('- Use Unicode math symbols (√ ² ³ × ÷ π) — do not use LaTeX')
    lines.push('')
    lines.push('Return JSON array ONLY with this exact structure:')
    lines.push('[{"index":0,"awardedPoints":5,"isCorrect":true,"feedback":"brief feedback"},...]')
    lines.push('The index must match the question index in the input.')
    lines.push('')
    lines.push('Questions to grade:')

    needAI.forEach(function(wa, idx) {
      lines.push('--- Question ' + idx + ' (max ' + (wa.points || 0) + ' pts) ---')
      lines.push('Question: ' + wa.question)
      lines.push('Student answer: ' + wa.answer)
      lines.push('Model answer: ' + (wa.modelAnswer || '(none)'))
      if (wa.acceptedAnswers && wa.acceptedAnswers.length > 0) {
        lines.push('Accepted final answers: ' + wa.acceptedAnswers.join(' | '))
      }
      lines.push('')
    })

    var prompt = lines.join('\n')
    var parts = [{ text: prompt }]

    // Try multiple models
    var models = ['gemini-2.5-flash', 'gemini-1.5-flash']
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
      } catch (e) {
        lastError = models[mi] + ': ' + (e.message || '')
        geminiRes = null
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      // AI failed - return quick-graded results with note
      var quickTotal = 0
      for (var j = 0; j < graded.length; j++) { quickTotal += graded[j].awardedPoints }
      return NextResponse.json({
        success: true,
        graded: graded,
        totalAwarded: quickTotal,
        totalMax: totalMax,
        aiUsed: false,
        message: 'فشل التصحيح بالـ AI - يحتاج تصحيح يدوي: ' + lastError
      })
    }

    var geminiData = await geminiRes.json()
    var text = ''
    try { text = geminiData.candidates[0].content.parts[0].text || '' } catch (e) {}

    // Parse JSON array from response
    var jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        var aiResults = JSON.parse(jsonMatch[0])
        if (Array.isArray(aiResults)) {
          // Apply AI results back to graded array
          needAI.forEach(function(wa, idx) {
            // Find original index in graded array
            var origIdx = -1
            for (var x = 0; x < graded.length; x++) {
              if (graded[x].question === wa.question && graded[x].answer === wa.answer) {
                origIdx = x
                break
              }
            }
            if (origIdx === -1) return

            // Find matching AI result
            var aiRes = aiResults.find(function(r) { return r.index === idx })
            if (aiRes) {
              var awarded = Math.min(Math.max(Math.round(aiRes.awardedPoints || 0), 0), wa.points || 0)
              graded[origIdx].awardedPoints = awarded
              graded[origIdx].isCorrect = awarded >= (wa.points * 0.5)
              graded[origIdx].feedback = aiRes.feedback || (aiRes.isCorrect ? 'صحيح' : 'غير صحيح')
              totalAwarded += awarded
            }
          })
        }
      } catch (parseErr) {
        console.error('AI grade parse error:', parseErr)
      }
    }

    // Recalculate total
    var finalTotal = 0
    for (var f = 0; f < graded.length; f++) { finalTotal += graded[f].awardedPoints }

    return NextResponse.json({
      success: true,
      graded: graded,
      totalAwarded: finalTotal,
      totalMax: totalMax,
      aiUsed: true
    })
  } catch (error) {
    console.error('Grade writing error:', error)
    return NextResponse.json({ error: 'Error: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
