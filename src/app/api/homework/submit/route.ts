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

    // Grade
    var score = 0
    mcq.forEach(function(q, i) {
      if (answers[i] === q.correct) score++
    })
    var maxScore = mcq.length

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
      },
    })
  } catch (error: any) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'حصلت مشكلة في تسليم الواجب' }, { status: 500 })
  }
}
