// @ts-nocheck
// POST /api/homework/submit - Submit homework answers, auto-grade, save result
// Uses raw SQL to bypass Prisma RETURN clause issues with missing DB columns

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// Ensure table exists with only the columns we actually use
async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS HomeworkResult (
        id TEXT PRIMARY KEY,
        homeworkId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        maxScore REAL NOT NULL DEFAULT 100
      )
    `)
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

    if (!studentId || !homeworkId || answers === undefined || answers === null) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Ensure table exists before anything else
    await ensureTable()

    // Check double submission using raw SQL
    try {
      var existing = await db.$queryRawUnsafe(
        'SELECT score, maxScore FROM HomeworkResult WHERE studentId = ? AND homeworkId = ? LIMIT 1',
        studentId, homeworkId
      )
      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          alreadySubmitted: true,
          result: { score: existing[0].score, maxScore: existing[0].maxScore, wrongQuestions: [] },
        }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing hw error:', e)
    }

    // Fetch homework using raw SQL (safer than Prisma if columns mismatch)
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

    // Parse questions - handle both string JSON and raw array, both 'q' and 'question' fields
    var mcq = []
    if (homework.questions) {
      try {
        var raw = typeof homework.questions === 'string' ? JSON.parse(homework.questions) : homework.questions
        if (Array.isArray(raw)) { mcq = raw }
      } catch (e) {
        console.error('Parse homework questions error:', e)
      }
    }
    if (mcq.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة في الواجب' }, { status: 400 })
    }

    // Grade with points support
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

    // Save result using raw SQL — only insert columns that definitely exist
    var resultId = 'hwr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    try {
      await db.$executeRawUnsafe(
        'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore) VALUES (?, ?, ?, ?, ?)',
        resultId, studentId, homeworkId, score, maxScore
      )
    } catch (insertErr) {
      console.error('Insert homework result error:', insertErr)
      // If INSERT fails, try creating table with more columns then retry
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
        await db.$executeRawUnsafe(
          'INSERT INTO HomeworkResult (id, studentId, homeworkId, score, maxScore) VALUES (?, ?, ?, ?, ?)',
          resultId, studentId, homeworkId, score, maxScore
        )
      } catch (retryErr) {
        console.error('Retry insert homework result error:', retryErr)
        return NextResponse.json({
          error: 'حصلت مشكلة في حفظ النتيجة: ' + (retryErr && retryErr.message ? retryErr.message : 'Unknown')
        }, { status: 500 })
      }
    }

    // Return result WITH score and wrong questions
    return NextResponse.json({
      success: true,
      result: {
        id: resultId,
        score: score,
        maxScore: maxScore,
        submittedAt: new Date().toISOString(),
        wrongQuestions: wrongQuestions,
      },
    })
  } catch (error) {
    console.error('Homework submit error:', error)
    return NextResponse.json({
      error: 'حصلت مشكلة في تسليم الواجب: ' + (error && error.message ? error.message : 'Unknown')
    }, { status: 500 })
  }
}
