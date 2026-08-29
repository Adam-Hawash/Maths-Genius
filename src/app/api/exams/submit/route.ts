// @ts-nocheck
// POST /api/exams/submit - Submit exam answers, auto-grade, save result with answers

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

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

    // Parse questions
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

    // Grade
    var score = 0
    var maxScore = 0
    questions.forEach(function(q, i) {
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
      }
    })
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
