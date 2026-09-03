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
            if (q.type === 'writing' || q.type === 'essay') {
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
        writingAnswers: writingAnswers,
        hasWritingQuestions: writingAnswers.length > 0,
      },
    })
  } catch (error) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'حصلت مشكلة في تسليم الواجب' }, { status: 500 })
  }
}
