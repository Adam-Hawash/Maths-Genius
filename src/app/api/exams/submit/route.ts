import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/exams/submit - Auto-grade exam submission
export async function POST(request: NextRequest) {
  try {
    const { studentId, examId, answers } = await request.json() // answers: { [questionIndex]: selectedOptionIndex }

    if (!studentId || !examId) {
      return NextResponse.json({ error: 'studentId and examId required' }, { status: 400 })
    }

    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

    // Check if already submitted
    const existing = await db.examResult.findFirst({ where: { examId, studentId } })
    if (existing) {
      return NextResponse.json({ error: 'لقد قدمت هذا الامتحان بالفعل', alreadySubmitted: true }, { status: 400 })
    }

    let score = 0
    let maxScore = 100
    let details: { question: string; correct: boolean; points: number }[] = []

    if (exam.questions) {
      try {
        const questions = JSON.parse(exam.questions)
        let totalPoints = 0
        let earnedPoints = 0

        questions.forEach((q: any, idx: number) => {
          const points = q.points || Math.floor(100 / questions.length)
          totalPoints += points
          const selectedAnswer = answers?.[String(idx)] ?? answers?.[idx]
          const isCorrect = selectedAnswer === q.correct
          if (isCorrect) earnedPoints += points
          details.push({ question: q.q, correct: isCorrect, points })
        })

        maxScore = totalPoints
        score = earnedPoints
      } catch {
        // If questions JSON is invalid, score stays 0
      }
    }

    const result = await db.examResult.create({
      data: {
        examId,
        studentId,
        score,
        maxScore,
        submittedAt: new Date(),
      },
    })

    // Log activity
    await db.studentActivity.create({
      data: {
        studentId,
        action: 'exam_submit',
        details: `قدم امتحان "${exam.title}" - الدرجة: ${score}/${maxScore}`,
      },
    })

    return NextResponse.json({
      result: { id: result.id, score, maxScore, submittedAt: result.submittedAt },
      passed: score >= (exam.passScore || 50),
      details,
    })
  } catch (error) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
  }
}
