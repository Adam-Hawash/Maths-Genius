// @ts-nocheck
// POST /api/homework/submit - Submit homework answers, auto-grade, save result, return score + wrong answers

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Ensure table exists
async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS HomeworkResult (
        id TEXT PRIMARY KEY,
        homeworkId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        maxScore REAL NOT NULL DEFAULT 100,
        answers TEXT DEFAULT '',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    // Try adding columns if missing
    try { await db.$executeRawUnsafe('ALTER TABLE HomeworkResult ADD COLUMN answers TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE HomeworkResult ADD COLUMN submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP') } catch(e) {}
  } catch (e) {
    console.error('Ensure HomeworkResult table error:', e)
  }
}

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var homeworkId = body.homeworkId
    var answers = body.answers

    if (!studentId || !homeworkId) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Ensure table exists
    await ensureTable()

    // Check double submission
    try {
      var existing = await db.$queryRawUnsafe(
        'SELECT id, score, maxScore FROM HomeworkResult WHERE studentId = ? AND homeworkId = ? LIMIT 1',
        studentId, homeworkId
      )
      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          result: { id: existing[0].id, score: existing[0].score, maxScore: existing[0].maxScore },
        }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing hw error:', e)
    }

    // Fetch homework questions using raw SQL
    var homework = null
    try {
      var hwRows = await db.$queryRawUnsafe(
        'SELECT id, title, questions FROM Homework WHERE id = ? LIMIT 1',
        homeworkId
      )
      homework = hwRows && hwRows.length > 0 ? hwRows[0] : null
    } catch (e) {
      console.error('Fetch homework error:', e)
      return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 })
    }
    if (!homework) {
      return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 })
    }

    // Parse questions
    var mcq = []
    var writingQuestions = []
    if (homework.questions) {
      try {
        var raw = typeof homework.questions === 'string' ? JSON.parse(homework.questions) : homework.questions
        if (Array.isArray(raw)) {
          raw.forEach(function(q) {
            // Detect writing: type field, OR options are empty/N/A
            var isWriting = q.type === 'writing' || q.type === 'essay'
            if (!isWriting && Array.isArray(q.options)) {
              var allNA = q.options.length > 0 && q.options.every(function(o) { return !o || o === 'N/A' || o === 'لا يوجد' || String(o).trim() === '' })
              if (allNA) isWriting = true
            }
            if (!isWriting && (!q.options || q.options.length === 0)) {
              isWriting = true
            }
            if (isWriting) {
              writingQuestions.push(q)
            } else {
              mcq.push(q)
            }
          })
        }
      } catch (e) {
        console.error('Parse homework questions error:', e)
      }
    }
    if (mcq.length === 0 && writingQuestions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة في الواجب' }, { status: 400 })
    }

    // Auto-grade MCQ with points support
    var score = 0
    var maxScore = 0
    var wrongQuestions = []

    mcq.forEach(function(q, i) {
      var qText = q.question || q.q || ''
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts
      var opts = Array.isArray(q.options) ? q.options : []
      var correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (correctIdx < 0 || correctIdx >= opts.length) { correctIdx = 0 }

      var studentAnswer = undefined
      if (Array.isArray(answers)) {
        studentAnswer = answers[i]
      } else if (answers !== null && typeof answers === 'object') {
        studentAnswer = answers[i] !== undefined ? answers[i] : answers[String(i)]
      }

      if (studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === correctIdx) {
        score += pts
      } else {
        wrongQuestions.push({
          question: qText,
          studentAnswer: (typeof studentAnswer === 'number' && opts[studentAnswer])
            ? String.fromCharCode(65 + studentAnswer) + ') ' + opts[studentAnswer]
            : 'لم يتم الإجابة',
          correctAnswer: opts[correctIdx]
            ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx]
            : '',
        })
      }
    })

    if (maxScore === 0) { maxScore = mcq.length }

    // Add writing questions to maxScore (auto 0 - admin will grade later)
    var writingAnswers: any[] = []
    writingQuestions.forEach(function(q, i) {
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts

      var qText = q.question || q.q || ''
      var studentText = ''
      var mcqLen = mcq.length
      var writingIdx = i
      // Try to get writing answer (offset by mcq length since answers is a flat array indexed by question order)
      try {
        if (Array.isArray(answers)) {
          studentText = answers[mcqLen + writingIdx] || ''
        } else if (answers && typeof answers === 'object') {
          studentText = answers[mcqLen + writingIdx] || answers[String(mcqLen + writingIdx)] || ''
        }
      } catch (e) {}

      writingAnswers.push({
        question: qText,
        answer: typeof studentText === 'string' ? studentText : String(studentText || ''),
        points: pts,
        modelAnswer: q.modelAnswer || q.answer || '',
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
        needsGrading: true,
      })
    })

    // Save result with score
    var resultId = 'hwr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var answersJson = ''
    if (answers !== undefined && answers !== null) {
      try { answersJson = JSON.stringify(answers) } catch(e) { answersJson = '' }
    }

    try {
      await db.$executeRawUnsafe(
        'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore, answers) VALUES (?, ?, ?, ?, ?, ?)',
        resultId, studentId, homeworkId, score, maxScore, answersJson
      )
    } catch (insertErr) {
      console.error('Insert homework result error:', insertErr)
      // Retry without answers column
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore) VALUES (?, ?, ?, ?, ?)',
          resultId, studentId, homeworkId, score, maxScore
        )
      } catch (retryErr) {
        console.error('Retry insert homework result error:', retryErr)
        return NextResponse.json({ error: 'حصلت مشكلة في حفظ النتيجة' }, { status: 500 })
      }
    }

    // AI grading for writing questions - inline (no external fetch)
    var writingScore = 0
    var gradedWriting: any[] = []
    var aiGraded = false
    if (writingAnswers.length > 0) {
      var apiKey = process.env.GEMINI_API_KEY || ''
      
      // First pass: quick match against acceptedAnswers
      for (var wi = 0; wi < writingAnswers.length; wi++) {
        var wa = writingAnswers[wi]
        var pts = wa.points || 5
        var studentAns = (wa.answer || '').trim()
        var modelAns = (wa.modelAnswer || '').trim()
        
        // Empty answer
        if (!studentAns || studentAns === '[📷 صورة مرفقة]') {
          gradedWriting[wi] = {
            question: wa.question,
            answer: wa.answer || '',
            modelAnswer: modelAns,
            awardedPoints: 0,
            maxPoints: pts,
            isCorrect: false,
            feedback: 'Not answered',
          }
          continue
        }
        
        // Quick match against acceptedAnswers
        var quickCorrect = false
        if (wa.acceptedAnswers && wa.acceptedAnswers.length > 0) {
          var cleanedStudent = studentAns.toLowerCase().replace(/\s+/g, ' ')
          for (var ai = 0; ai < wa.acceptedAnswers.length; ai++) {
            var acc = (wa.acceptedAnswers[ai] || '').trim().toLowerCase().replace(/\s+/g, ' ')
            if (acc && (cleanedStudent === acc || cleanedStudent.includes(acc) || acc.includes(cleanedStudent))) {
              quickCorrect = true
              break
            }
          }
        }
        
        if (quickCorrect) {
          gradedWriting[wi] = {
            question: wa.question,
            answer: studentAns,
            modelAnswer: modelAns,
            awardedPoints: pts,
            maxPoints: pts,
            isCorrect: true,
            feedback: 'Correct answer',
          }
          writingScore += pts
          continue
        }
        
        // If no modelAnswer, can't grade
        if (!modelAns) {
          gradedWriting[wi] = {
            question: wa.question,
            answer: studentAns,
            modelAnswer: '',
            awardedPoints: 0,
            maxPoints: pts,
            isCorrect: false,
            feedback: 'No model answer available for grading',
          }
          continue
        }
        
        // Need AI grading
        gradedWriting[wi] = {
          question: wa.question,
          answer: studentAns,
          modelAnswer: modelAns,
          awardedPoints: 0,
          maxPoints: pts,
          isCorrect: false,
          feedback: 'Pending AI grading...',
          needsAI: true,
        }
      }
      
      // AI grading pass (if API key available)
      if (apiKey) {
        var needAI = gradedWriting.filter(function(g: any) { return g.needsAI })
        if (needAI.length > 0) {
          try {
            var gradeLines = []
            gradeLines.push('You are an expert math teacher grading student answers.')
            gradeLines.push('For each question, compare the student answer with the model answer.')
            gradeLines.push('Focus on the FINAL ANSWER - if the final answer matches, it is correct.')
            gradeLines.push('')
            gradeLines.push('Rules:')
            gradeLines.push('- If the student final answer matches the model answer, give full credit (isCorrect: true)')
            gradeLines.push('- If the final answer is correct but steps are missing, give 50% credit')
            gradeLines.push('- If steps are correct but final answer is wrong, give 30% credit')
            gradeLines.push('- If completely wrong or unrelated, give 0 (isCorrect: false)')
            gradeLines.push('- If the student answer is empty, give 0 and isCorrect: false, feedback: "Not answered"')
            gradeLines.push('- Round awarded points to nearest integer')
            gradeLines.push('- Provide brief feedback in English')
            gradeLines.push('- Use Unicode math symbols (√ ² ³ × ÷ π)')
            gradeLines.push('')
            gradeLines.push('Return JSON array ONLY:')
            gradeLines.push('[{"index":0,"awardedPoints":5,"isCorrect":true,"feedback":"brief feedback"}]')
            gradeLines.push('')
            gradeLines.push('Questions to grade:')
            
            needAI.forEach(function(g: any, idx: number) {
              gradeLines.push('--- Question ' + idx + ' (max ' + g.maxPoints + ' pts) ---')
              gradeLines.push('Student answer: ' + g.answer)
              gradeLines.push('Model answer: ' + g.modelAnswer)
              gradeLines.push('')
            })
            
            var aiModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
            var aiSuccess = false
            for (var mi = 0; mi < aiModels.length; mi++) {
              try {
                var modelUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + aiModels[mi] + ':generateContent?key=' + apiKey
                var aiRes = await fetch(modelUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: gradeLines.join('\n') }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
                  })
                })
                if (aiRes.ok) {
                  var aiData = await aiRes.json()
                  var aiText = ''
                  try { aiText = aiData.candidates[0].content.parts[0].text || '' } catch (e) {}
                  var aiMatch = aiText.match(/\[[\s\S]*\]/)
                  if (aiMatch) {
                    var aiResults = JSON.parse(aiMatch[0])
                    if (Array.isArray(aiResults)) {
                      needAI.forEach(function(g: any, idx: number) {
                        // Find this graded item in gradedWriting
                        for (var gi = 0; gi < gradedWriting.length; gi++) {
                          if (gradedWriting[gi] === g) {
                            var aiRes2 = aiResults.find(function(r: any) { return r.index === idx })
                            if (aiRes2) {
                              var awarded = Math.min(Math.max(Math.round(aiRes2.awardedPoints || 0), 0), g.maxPoints)
                              gradedWriting[gi].awardedPoints = awarded
                              gradedWriting[gi].isCorrect = aiRes2.isCorrect === true || awarded >= (g.maxPoints * 0.5)
                              gradedWriting[gi].feedback = aiRes2.feedback || (aiRes2.isCorrect ? 'Correct' : 'Incorrect')
                              gradedWriting[gi].needsAI = false
                              writingScore += awarded
                            }
                            break
                          }
                        }
                      })
                      aiSuccess = true
                      break
                    }
                  }
                }
              } catch (e) {
                console.error('AI model', aiModels[mi], 'failed:', e.message)
              }
            }
            aiGraded = aiSuccess
          } catch (aiErr) {
            console.error('AI grading error:', aiErr)
          }
        } else {
          aiGraded = true // All were quick-matched
        }
      }
      
      // Mark any remaining pending items
      for (var pi = 0; pi < gradedWriting.length; pi++) {
        if (gradedWriting[pi] && gradedWriting[pi].needsAI && !aiGraded) {
          gradedWriting[pi].isCorrect = false
          gradedWriting[pi].feedback = 'Not graded (AI unavailable) - answer: ' + gradedWriting[pi].answer
          gradedWriting[pi].needsAI = false
        }
        // Ensure modelAnswer and steps are always shown
        if (!gradedWriting[pi].modelAnswer) {
          gradedWriting[pi].modelAnswer = writingAnswers[pi] ? (writingAnswers[pi].modelAnswer || '') : ''
        }
      }
      
      score += writingScore
    }

    // Update the saved result with the final score (MCQ + writing)
    if (aiGraded && writingScore > 0) {
      try {
        await db.$executeRawUnsafe(
          'UPDATE HomeworkResult SET score = ? WHERE id = ?',
          score, resultId
        )
      } catch (updateErr) {
        console.error('Update score error:', updateErr)
      }
    }

    // Return result WITH score and wrong questions (for both student and teacher)
    return NextResponse.json({
      success: true,
      submitted: true,
      result: {
        id: resultId,
        score: score,
        maxScore: maxScore,
        submittedAt: new Date().toISOString(),
        wrongQuestions: wrongQuestions,
        writingAnswers: aiGraded ? gradedWriting : writingAnswers,
        hasWritingQuestions: writingAnswers.length > 0,
        writingGraded: aiGraded,
        writingScore: writingScore,
      },
    })
  } catch (error) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'حصلت مشكلة في تسليم الواجب' }, { status: 500 })
  }
}
