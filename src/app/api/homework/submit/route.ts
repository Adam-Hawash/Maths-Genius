// @ts-nocheck
// Submit homework - reads MCQ from homework.questions JSON, grades, saves result

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var homeworkId = body.homeworkId
    var answers = body.answers // { [questionIndex]: selectedOptionIndex }

    if (!studentId || !homeworkId || !answers) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Check double submission
    var existing = await db.homeworkResult.findUnique({
      where: { studentId_homeworkId: { studentId, homeworkId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'تم تقديم هذا الواجب بالفعل', alreadySubmitted: true, result: { score: existing.score, maxScore: existing.maxScore } }, { status: 400 })
    }

    // Fetch homework and parse questions
    var homework = await db.homework.findUnique({ where: { id: homeworkId } })
    if (!homework) return NextResponse.json({ error: 'الواجب مش موجود' }, { status: 404 })

    var mcq = []
    try { mcq = JSON.parse(homework.questions || '[]') } catch {}
    if (mcq.length === 0) {
      return NextResponse.json({ error: 'مفيش أسئلة في الواجب' }, { status: 400 })
    }

    // Grade with points support
    var score = 0
    var maxScore = 0
    var wrongQuestions: { question: string; studentAnswer: string; correctAnswer: string }[] = []

    mcq.forEach(function(q, i) {
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts
      var studentAnswer = Array.isArray(answers) ? answers[i] : (answers[i] !== undefined ? answers[i] : answers[String(i)])
      var correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (studentAnswer !== undefined && studentAnswer === correctIdx) {
        score += pts
      } else {
        var opts = Array.isArray(q.options) ? q.options : []
        wrongQuestions.push({
          question: q.question || q.q || '',
          studentAnswer: (typeof studentAnswer === 'number' && opts[studentAnswer]) ? String.fromCharCode(65 + studentAnswer) + ') ' + opts[studentAnswer] : 'لم يتم الإجابة',
          correctAnswer: opts[correctIdx] ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx] : '',
        })
      }
    })

    // Save
    var result = await db.homeworkResult.create({
      data: {
        studentId,
        homeworkId,
        score,
        maxScore,
        answers: JSON.stringify(answers),
      },
    })

    return NextResponse.json({
      result: {
        id: result.id,
        score: result.score,
        maxScore: result.maxScore,
        submittedAt: result.submittedAt,
        wrongQuestions: wrongQuestions,
      },
    })
  } catch (error: any) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'حصلت مشكلة في تسليم الواجب' }, { status: 500 })
  }
}
