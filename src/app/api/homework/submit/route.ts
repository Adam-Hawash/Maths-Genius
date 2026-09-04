// @ts-nocheck
// POST /api/homework/submit - Submit homework answers, auto-grade, save result, return score + wrong answers

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gradeImageAnswer, gradeTextAnswer, extractImageMediaIds } from '@/lib/ai-image-grader'

export const runtime = 'nodejs'
export const maxDuration = 120

// Ensure table exists
async function ensureTable() {
  try {
    // Try creating the table fresh (will be ignored if already exists)
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
    } catch (e) {}

    // Check if submittedAt column exists. If not, rebuild the table.
    // SQLite ALTER TABLE ADD COLUMN with non-constant default is NOT supported by Turso/libsql,
    // so we need to rebuild the table.
    var needsRebuild = false
    try {
      var cols = await db.$queryRawUnsafe('PRAGMA table_info(HomeworkResult)')
      var hasSubmittedAt = (cols || []).some(function(c) { return c.name === 'submittedAt' })
      var hasAnswers = (cols || []).some(function(c) { return c.name === 'answers' })
      if (!hasSubmittedAt) {
        needsRebuild = true
      }
    } catch (e) {
      // PRAGMA failed, probably table doesn't exist - the CREATE above will have made it
    }

    if (needsRebuild) {
      try {
        // Rebuild: rename old table, create fresh, copy data with default submittedAt, drop old
        await db.$executeRawUnsafe('ALTER TABLE HomeworkResult RENAME TO HomeworkResult_old')
        await db.$executeRawUnsafe(`
          CREATE TABLE HomeworkResult (
            id TEXT PRIMARY KEY,
            homeworkId TEXT NOT NULL,
            studentId TEXT NOT NULL,
            score REAL NOT NULL DEFAULT 0,
            maxScore REAL NOT NULL DEFAULT 100,
            answers TEXT DEFAULT '',
            submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
        // Copy existing data (handle both cases: with/without answers column)
        try {
          await db.$executeRawUnsafe(`
            INSERT INTO HomeworkResult (id, homeworkId, studentId, score, maxScore, answers, submittedAt)
            SELECT id, homeworkId, studentId, score, maxScore,
                   CASE WHEN answers IS NULL OR answers = '' THEN '' ELSE answers END,
                   CURRENT_TIMESTAMP
            FROM HomeworkResult_old
          `)
        } catch (copyErr) {
          // Old table may not have answers column - try without it
          try {
            await db.$executeRawUnsafe(`
              INSERT INTO HomeworkResult (id, homeworkId, studentId, score, maxScore, answers, submittedAt)
              SELECT id, homeworkId, studentId, score, maxScore, '', CURRENT_TIMESTAMP
              FROM HomeworkResult_old
            `)
          } catch (copyErr2) {
            console.error('Copy old homework data error:', copyErr2)
          }
        }
        await db.$executeRawUnsafe('DROP TABLE HomeworkResult_old')
      } catch (rebuildErr) {
        console.error('Rebuild HomeworkResult error:', rebuildErr)
        // If rebuild failed, try to recover by renaming back
        try { await db.$executeRawUnsafe('ALTER TABLE HomeworkResult_old RENAME TO HomeworkResult') } catch (e) {}
      }
    }
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

    // ============= AI TEXT GRADING (for writing questions WITHOUT images) =============
    // Use Gemini to grade writing answers against the model answer
    for (var waIdx = 0; waIdx < writingAnswers.length; waIdx++) {
      var wa = writingAnswers[waIdx]
      var answerText = (wa.answer || '').trim()
      var mediaIds = extractImageMediaIds(answerText)

      // === IMAGE-GRADED ANSWER ===
      if (mediaIds.length > 0) {
        // Run AI grading on the image
        try {
          var gradeData = await gradeImageAnswer({
            mediaId: mediaIds[0],
            question: wa.question,
            modelAnswer: wa.modelAnswer,
            acceptedAnswers: wa.acceptedAnswers,
            maxPoints: wa.points,
          })
          if (gradeData.extractedAnswer || gradeData.error === undefined) {
            writingAnswers[waIdx].aiExtractedAnswer = gradeData.extractedAnswer
            writingAnswers[waIdx].aiIsCorrect = gradeData.isCorrect === true
            writingAnswers[waIdx].aiFeedback = gradeData.feedback || ''
            writingAnswers[waIdx].aiAwardedPoints = gradeData.awardedPoints || 0
            writingAnswers[waIdx].needsGrading = false
            writingAnswers[waIdx].isCorrect = gradeData.isCorrect === true
            writingAnswers[waIdx].awardedPoints = gradeData.awardedPoints || 0
          }
        } catch (gradeErr) {
          console.error('[HW Submit] AI grade image error for mediaId', mediaIds[0], ':', gradeErr)
        }
        continue
      }

      // === TEXT-BASED AI GRADING (no image) ===
      // Skip if empty
      if (!answerText || answerText === '[📷 صورة مرفقة]') {
        continue
      }
      // Skip if no model answer (admin will grade manually)
      if (!wa.modelAnswer) {
        continue
      }

      // First try quick text match (fast)
      var quickMatched = false
      var cleanStudent = answerText.toLowerCase().replace(/\s+/g, ' ').trim()
      var cleanModel = (wa.modelAnswer || '').toLowerCase().replace(/\s+/g, ' ').trim()

      // Match against acceptedAnswers
      if (wa.acceptedAnswers && wa.acceptedAnswers.length > 0) {
        for (var ai = 0; ai < wa.acceptedAnswers.length; ai++) {
          var acc = (wa.acceptedAnswers[ai] || '').trim().toLowerCase().replace(/\s+/g, ' ')
          if (acc && (cleanStudent === acc || cleanStudent.includes(acc) || acc.includes(cleanStudent))) {
            quickMatched = true
            break
          }
        }
      }
      if (quickMatched) {
        writingAnswers[waIdx].needsGrading = false
        writingAnswers[waIdx].isCorrect = true
        writingAnswers[waIdx].awardedPoints = wa.points
        writingAnswers[waIdx].aiExtractedAnswer = answerText
        writingAnswers[waIdx].aiIsCorrect = true
        writingAnswers[waIdx].aiFeedback = 'إجابة صحيحة (تطابق نصي)'
        writingAnswers[waIdx].aiAwardedPoints = wa.points
        continue
      }

      // Match against model answer final answer (after '=')
      if (cleanModel) {
        var modelParts = cleanModel.split('=')
        var studentParts = cleanStudent.split('=')
        var modelFinal = (modelParts[modelParts.length - 1] || '').trim()
        var studentFinal = (studentParts[studentParts.length - 1] || '').trim()
        if (modelFinal && studentFinal && (modelFinal === studentFinal || modelFinal.includes(studentFinal) || studentFinal.includes(modelFinal))) {
          writingAnswers[waIdx].needsGrading = false
          writingAnswers[waIdx].isCorrect = true
          writingAnswers[waIdx].awardedPoints = wa.points
          writingAnswers[waIdx].aiExtractedAnswer = answerText
          writingAnswers[waIdx].aiIsCorrect = true
          writingAnswers[waIdx].aiFeedback = 'إجابة صحيحة (الإجابة النهائية مطابقة)'
          writingAnswers[waIdx].aiAwardedPoints = wa.points
          continue
        }
      }

      // Run AI text grading (slower but more accurate)
      try {
        var textGradeData = await gradeTextAnswer({
          question: wa.question,
          studentAnswer: answerText,
          modelAnswer: wa.modelAnswer,
          acceptedAnswers: wa.acceptedAnswers,
          maxPoints: wa.points,
        })
        if (textGradeData) {
          writingAnswers[waIdx].needsGrading = false
          writingAnswers[waIdx].isCorrect = textGradeData.isCorrect === true
          writingAnswers[waIdx].awardedPoints = textGradeData.awardedPoints || 0
          writingAnswers[waIdx].aiExtractedAnswer = answerText  // Student's original text
          writingAnswers[waIdx].aiIsCorrect = textGradeData.isCorrect === true
          writingAnswers[waIdx].aiFeedback = textGradeData.feedback || ''
          writingAnswers[waIdx].aiAwardedPoints = textGradeData.awardedPoints || 0
        }
      } catch (textGradeErr) {
        console.error('[HW Submit] AI text grading error:', textGradeErr)
        // Fallback: mark as wrong
        writingAnswers[waIdx].needsGrading = false
        writingAnswers[waIdx].isCorrect = false
        writingAnswers[waIdx].awardedPoints = 0
        writingAnswers[waIdx].aiExtractedAnswer = answerText
        writingAnswers[waIdx].aiIsCorrect = false
        writingAnswers[waIdx].aiFeedback = 'تعذر التصحيح - اعتبر خطأ'
        writingAnswers[waIdx].aiAwardedPoints = 0
      }
    }

    // Save result with score
    var resultId = 'hwr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var answersJson = ''
    if (answers !== undefined && answers !== null) {
      try { answersJson = JSON.stringify(answers) } catch(e) { answersJson = '' }
    }

    try {
      await db.$executeRawUnsafe(
        'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore, answers, submittedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        resultId, studentId, homeworkId, score, maxScore, answersJson
      )
    } catch (insertErr) {
      console.error('Insert homework result error:', insertErr)
      // Retry without answers column (older schema)
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore, submittedAt) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          resultId, studentId, homeworkId, score, maxScore
        )
      } catch (retryErr) {
        console.error('Retry insert homework result error:', retryErr)
        return NextResponse.json({ error: 'حصلت مشكلة في حفظ النتيجة' }, { status: 500 })
      }
    }

    // Build gradedWriting from writingAnswers (now all are graded by the new AI logic above)
    var writingScore = 0
    var gradedWriting: any[] = []
    var aiGraded = false
    if (writingAnswers.length > 0) {
      for (var wi = 0; wi < writingAnswers.length; wi++) {
        var wa = writingAnswers[wi]
        var pts = wa.points || 5
        var studentAns = (wa.answer || '').trim()
        var modelAns = (wa.modelAnswer || '').trim()

        // === AI-GRADED ANSWER (image or text) - already done above ===
        if (wa.needsGrading === false) {
          gradedWriting[wi] = {
            question: wa.question,
            answer: wa.answer || '',
            modelAnswer: modelAns,
            awardedPoints: wa.aiAwardedPoints || wa.awardedPoints || 0,
            maxPoints: pts,
            isCorrect: wa.aiIsCorrect === true || wa.isCorrect === true,
            feedback: wa.aiFeedback || '',
            aiExtractedAnswer: wa.aiExtractedAnswer,
            imageGraded: !!extractImageMediaIds(studentAns).length,
            textGraded: !extractImageMediaIds(studentAns).length && !!wa.aiExtractedAnswer,
          }
          writingScore += (gradedWriting[wi].awardedPoints || 0)
          continue
        }

        // === UN-GRADED (no model answer, or empty) ===
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

        // No model answer — admin will grade manually
        gradedWriting[wi] = {
          question: wa.question,
          answer: studentAns,
          modelAnswer: modelAns,
          awardedPoints: 0,
          maxPoints: pts,
          isCorrect: false,
          feedback: 'لا توجد إجابة نموذجية - يحتاج تصحيح يدوي',
          needsGrading: true,
        }
      }
      aiGraded = true
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
