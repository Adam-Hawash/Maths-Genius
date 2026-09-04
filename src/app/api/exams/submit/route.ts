// @ts-nocheck
// POST /api/exams/submit - Submit exam answers, auto-grade, save result with answers

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gradeImageAnswer, gradeTextAnswer, extractImageMediaIds } from '@/lib/ai-image-grader'

export const runtime = 'nodejs'
export const maxDuration = 120

async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ExamResult (
        id TEXT PRIMARY KEY,
        examId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        maxScore REAL NOT NULL DEFAULT 100,
        answers TEXT DEFAULT '',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN answers TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP') } catch(e) {}
  } catch (e) {
    console.error('Ensure ExamResult table error:', e)
  }
}

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var examId = body.examId
    var answers = body.answers

    if (!studentId || !examId || answers === undefined || answers === null) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    await ensureTable()

    // Check double submission
    try {
      var existing = await db.$queryRawUnsafe(
        'SELECT id FROM ExamResult WHERE studentId = ? AND examId = ? LIMIT 1',
        studentId, examId
      )
      if (existing && existing.length > 0) {
        return NextResponse.json({ alreadySubmitted: true, submitted: true, blocked: true }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing exam result error:', e)
    }

    // Fetch exam
    var exam = null
    try {
      var examRows = await db.$queryRawUnsafe(
        'SELECT id, title, questions, passScore FROM Exam WHERE id = ? LIMIT 1',
        examId
      )
      exam = examRows && examRows.length > 0 ? examRows[0] : null
    } catch (e) {
      console.error('Fetch exam error:', e)
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }
    if (!exam) {
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }

    // Parse questions - separate MCQ from writing
    var questions = []
    if (exam.questions) {
      try {
        var raw = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions
        if (Array.isArray(raw)) { questions = raw }
      } catch (e) {
        console.error('Parse exam questions error:', e)
      }
    }
    if (questions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة في هذا الامتحان' }, { status: 400 })
    }

    // Separate MCQ from writing questions
    var mcqQuestions = []
    var writingQuestions = []
    questions.forEach(function(q) {
      var isWriting = q.type === 'writing' || q.type === 'essay'
      if (!isWriting && Array.isArray(q.options)) {
        var allNA = q.options.length > 0 && q.options.every(function(o) { return !o || o === 'N/A' || o === 'لا يوجد' || String(o).trim() === '' })
        if (allNA) isWriting = true
      }
      if (!isWriting && (!q.options || q.options.length === 0)) isWriting = true
      if (isWriting) writingQuestions.push(q)
      else mcqQuestions.push(q)
    })

    // Grade MCQ
    var score = 0
    var maxScore = 0
    var mcqWrong = []
    mcqQuestions.forEach(function(q, i) {
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts
      var opts = Array.isArray(q.options) ? q.options : []
      var correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (correctIdx < 0 || correctIdx >= opts.length) { correctIdx = 0 }
      var studentAnswer = undefined
      // MCQ answers are at positions 0..mcqQuestions.length-1
      try {
        if (Array.isArray(answers)) {
          studentAnswer = answers[i]
        } else if (answers !== null && typeof answers === 'object') {
          studentAnswer = answers[i] !== undefined ? answers[i] : answers[String(i)]
        }
      } catch (e) {}
      if (studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === correctIdx) {
        score += pts
      } else {
        mcqWrong.push({
          question: q.question || q.q || '',
          studentAnswer: (typeof studentAnswer === 'number' && opts[studentAnswer])
            ? String.fromCharCode(65 + studentAnswer) + ') ' + opts[studentAnswer]
            : 'لم يتم الإجابة',
          correctAnswer: opts[correctIdx]
            ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx]
            : '',
        })
      }
    })

    // Collect writing answers + AI-grade images
    var writingAnswers: any[] = []
    var writingScore = 0
    var mcqLen = mcqQuestions.length
    for (var wi = 0; wi < writingQuestions.length; wi++) {
      var wq = writingQuestions[wi]
      var pts = (typeof wq.points === 'number' && wq.points > 0) ? wq.points : 5
      maxScore += pts
      var qText = wq.question || wq.q || ''
      var studentText = ''
      try {
        if (Array.isArray(answers)) {
          studentText = answers[mcqLen + wi] || ''
        } else if (answers && typeof answers === 'object') {
          studentText = answers[mcqLen + wi] || answers[String(mcqLen + wi)] || ''
        }
      } catch (e) {}
      studentText = typeof studentText === 'string' ? studentText : String(studentText || '')

      var wa: any = {
        question: qText,
        answer: studentText,
        points: pts,
        modelAnswer: wq.modelAnswer || wq.answer || '',
        acceptedAnswers: Array.isArray(wq.acceptedAnswers) ? wq.acceptedAnswers : [],
        needsGrading: true,
      }

      // Skip if empty answer
      if (!studentText || studentText === '[📷 صورة مرفقة]') {
        wa.needsGrading = false
        wa.isCorrect = false
        wa.awardedPoints = 0
        wa.aiExtractedAnswer = ''
        wa.aiFeedback = 'لم يجب الطالب'
        writingAnswers.push(wa)
        continue
      }

      // Skip if no modelAnswer
      if (!wa.modelAnswer) {
        writingAnswers.push(wa)
        continue
      }

      var mediaIds = extractImageMediaIds(studentText)

      // IMAGE GRADING
      if (mediaIds.length > 0) {
        try {
          var gradeData = await gradeImageAnswer({
            mediaId: mediaIds[0],
            question: qText,
            modelAnswer: wa.modelAnswer,
            acceptedAnswers: wa.acceptedAnswers,
            maxPoints: pts,
          })
          if (gradeData) {
            wa.aiExtractedAnswer = gradeData.extractedAnswer || '(تعذر الاستخراج)'
            wa.aiIsCorrect = gradeData.isCorrect === true
            wa.aiFeedback = gradeData.feedback || (gradeData.isCorrect ? 'صح' : 'غلط')
            wa.aiAwardedPoints = gradeData.awardedPoints || 0
            wa.needsGrading = false
            wa.isCorrect = gradeData.isCorrect === true
            wa.awardedPoints = gradeData.awardedPoints || 0
            writingScore += (gradeData.awardedPoints || 0)
          }
        } catch (gradeErr) {
          console.error('[Exam Submit] AI grade image error:', gradeErr)
          wa.needsGrading = false
          wa.isCorrect = false
          wa.awardedPoints = 0
          wa.aiExtractedAnswer = '(فشل الـ AI)'
          wa.aiFeedback = 'فشل التصحيح'
        }
        writingAnswers.push(wa)
        continue
      }

      // TEXT GRADING - quick match first
      var cleanStud = (studentText || '').toLowerCase().replace(/\s+/g, ' ').trim()
      var cleanMod = (wa.modelAnswer || '').toLowerCase().replace(/\s+/g, ' ').trim()
      var quickMatch = false

      if (wa.acceptedAnswers && wa.acceptedAnswers.length > 0) {
        for (var eai = 0; eai < wa.acceptedAnswers.length; eai++) {
          var eAcc = (wa.acceptedAnswers[eai] || '').trim().toLowerCase().replace(/\s+/g, ' ')
          if (eAcc && (cleanStud === eAcc || cleanStud.includes(eAcc) || eAcc.includes(cleanStud))) {
            quickMatch = true
            break
          }
        }
      }
      if (quickMatch) {
        wa.needsGrading = false
        wa.isCorrect = true
        wa.awardedPoints = pts
        wa.aiExtractedAnswer = studentText
        wa.aiIsCorrect = true
        wa.aiFeedback = 'صح (تطابق نصي)'
        wa.aiAwardedPoints = pts
        writingScore += pts
        writingAnswers.push(wa)
        continue
      }

      // Match final answer
      if (cleanMod) {
        var eMParts = cleanMod.split('=')
        var eSParts = cleanStud.split('=')
        var eMFinal = (eMParts[eMParts.length - 1] || '').trim()
        var eSFinal = (eSParts[eSParts.length - 1] || '').trim()
        if (eMFinal && eSFinal && (eMFinal === eSFinal || eMFinal.includes(eSFinal) || eSFinal.includes(eMFinal))) {
          wa.needsGrading = false
          wa.isCorrect = true
          wa.awardedPoints = pts
          wa.aiExtractedAnswer = studentText
          wa.aiIsCorrect = true
          wa.aiFeedback = 'صح (الإجابة النهائية مطابقة)'
          wa.aiAwardedPoints = pts
          writingScore += pts
          writingAnswers.push(wa)
          continue
        }
      }

      // AI text grading
      try {
        var eTextGrade = await gradeTextAnswer({
          question: qText,
          studentAnswer: studentText,
          modelAnswer: wa.modelAnswer,
          acceptedAnswers: wa.acceptedAnswers,
          maxPoints: pts,
        })
        if (eTextGrade) {
          wa.needsGrading = false
          wa.isCorrect = eTextGrade.isCorrect === true
          wa.awardedPoints = eTextGrade.awardedPoints || 0
          wa.aiExtractedAnswer = studentText
          wa.aiIsCorrect = eTextGrade.isCorrect === true
          wa.aiFeedback = eTextGrade.feedback || (eTextGrade.isCorrect ? 'صح' : 'غلط')
          wa.aiAwardedPoints = eTextGrade.awardedPoints || 0
          writingScore += (eTextGrade.awardedPoints || 0)
        }
      } catch (e) {
        console.error('[Exam Submit] AI text grading error:', e)
        wa.needsGrading = false
        wa.isCorrect = false
        wa.awardedPoints = 0
        wa.aiExtractedAnswer = studentText
        wa.aiFeedback = 'فشل التصحيح'
      }
      writingAnswers.push(wa)
    }
    score += writingScore

    if (maxScore === 0) { maxScore = questions.length }

    // Save with answers
    var resultId = 'exr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var answersJson = ''
    if (answers !== undefined && answers !== null) {
      try { answersJson = JSON.stringify(answers) } catch(e) { answersJson = '' }
    }

    try {
      await db.$executeRawUnsafe(
        'INSERT INTO ExamResult (id, studentId, examId, score, maxScore, answers) VALUES (?, ?, ?, ?, ?, ?)',
        resultId, studentId, examId, score, maxScore, answersJson
      )
    } catch (insertErr) {
      console.error('Insert exam result error:', insertErr)
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO ExamResult (id, studentId, examId, score, maxScore) VALUES (?, ?, ?, ?, ?)',
          resultId, studentId, examId, score, maxScore
        )
      } catch (retryErr) {
        console.error('Retry insert exam result error:', retryErr)
        return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, submitted: true })
  } catch (error) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان' }, { status: 500 })
  }
}
