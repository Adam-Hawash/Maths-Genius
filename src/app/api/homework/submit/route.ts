// @ts-nocheck
// POST /api/homework/submit - Submit homework answers, auto-grade, save result with score + wrong answers

import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var homeworkId = body.homeworkId
    var answers = body.answers // { [questionIndex]: selectedOptionIndex }

    if (!studentId || !homeworkId || !answers) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Check double submission
    try {
      var existing = await db.homeworkResult.findUnique({
        where: { studentId_homeworkId: { studentId: studentId, homeworkId: homeworkId } },
      })
      if (existing) {
        return NextResponse.json({
          error: 'تم تقديم هذا الواجب بالفعل',
          alreadySubmitted: true,
          result: { score: existing.score, maxScore: existing.maxScore }
        }, { status: 400 })
      }
    } catch (e) {
      console.error('Check existing homework result error:', e)
    }

    // Fetch homework and parse questions
    var homework = null
    try {
      homework = await db.homework.findUnique({ where: { id: homeworkId } })
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

      if (studentAnswer !== undefined && studentAnswer === correctIdx) {
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

    // Save result using safeWrite for Turso compatibility
    var result = await safeWrite(function() {
      return db.homeworkResult.create({
        data: {
          studentId: studentId,
          homeworkId: homeworkId,
          score: score,
          maxScore: maxScore,
          answers: JSON.stringify(answers),
        },
      })
    })

    // Return result WITH score and wrong questions (student sees immediate feedback)
    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        score: result.score,
        maxScore: result.maxScore,
        submittedAt: result.submittedAt,
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
