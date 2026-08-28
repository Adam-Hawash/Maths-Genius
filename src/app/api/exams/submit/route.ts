// @ts-nocheck
// POST /api/exams/submit - Submit exam answers, auto-grade, save result (no score returned to student)

import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var examId = body.examId
    var answers = body.answers

    if (!studentId || !examId || answers === undefined || answers === null) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Prevent double submission - check DB first (fallback to findFirst if unique constraint missing)
    try {
      var existing = null
      try {
        existing = await db.examResult.findUnique({
          where: { studentId_examId: { studentId: studentId, examId: examId } },
        })
      } catch (_) {
        existing = await db.examResult.findFirst({
          where: { studentId: studentId, examId: examId },
        })
      }
      if (existing) {
        return NextResponse.json({ 
          alreadySubmitted: true,
          submitted: true,
          blocked: true
        }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing exam result error:', e)
    }

    // Fetch exam
    var exam = null
    try {
      exam = await db.exam.findUnique({ where: { id: examId } })
    } catch (e) {
      console.error('Fetch exam error:', e)
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }
    if (!exam) {
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }

    // Parse questions - handle both string JSON and raw array, both 'q' and 'question' fields
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
    var wrongQuestions = []

    questions.forEach(function(q, i) {
      // Handle both 'q' and 'question' field names
      var qText = q.question || q.q || ''
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts
      var opts = Array.isArray(q.options) ? q.options : []
      var correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (correctIdx < 0 || correctIdx >= opts.length) { correctIdx = 0 }

      // Get student answer - support both array and object formats
      var studentAnswer = undefined
      if (Array.isArray(answers)) {
        studentAnswer = answers[i]
      } else if (answers !== null && typeof answers === 'object') {
        studentAnswer = answers[i] !== undefined ? answers[i] : answers[String(i)]
      }

      // Compare: student answer index vs correct answer index
      // Both should be the original DB option indices (frontend remaps shuffled options)
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

    if (maxScore === 0) { maxScore = questions.length }
    var passScore = exam.passScore || 50
    var passCount = Math.ceil(maxScore * passScore / 100)
    var passed = score >= passCount

    // Save result to DB using safeWrite for Turso compatibility
    var result = await safeWrite(function() {
      return db.examResult.create({
        data: {
          studentId: studentId,
          examId: examId,
          score: score,
          maxScore: maxScore,
        },
      })
    })

    // Return success WITHOUT score details (student must wait for teacher)
    return NextResponse.json({
      success: true,
      submitted: true,
    })
  } catch (error) {
    console.error('Exam submit error:', error)
    return NextResponse.json({
      error: 'حدث خطأ أثناء تسليم الامتحان: ' + (error && error.message ? error.message : 'Unknown')
    }, { status: 500 })
  }
}
