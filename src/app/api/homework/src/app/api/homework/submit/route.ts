import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/homework/submit - Submit and auto-grade homework
export async function POST(request: NextRequest) {
  try {
    const { studentId, homeworkId, answers } = await request.json()

    if (!studentId || !homeworkId) {
      return NextResponse.json({ error: 'studentId and homeworkId required' }, { status: 400 })
    }

    const hw = await db.homework.findUnique({ where: { id: homeworkId } })
    if (!hw) return NextResponse.json({ error: 'Homework not found' }, { status: 404 })

    // Check if already submitted
    const existing = await db.homeworkResult.findFirst({ where: { homeworkId, studentId } })
    if (existing) {
      return NextResponse.json({ error: 'لقد قدمت هذا الواجب بالفعل', alreadySubmitted: true }, { status: 400 })
    }

    let score = 0
    let maxScore = 100
    let details: { question: string; correct: boolean; points: number; studentAnswer: number; correctAnswer: number }[] = []

    if (hw.questions) {
      try {
        const questions = JSON.parse(hw.questions)
        let totalPoints = 0
        let earnedPoints = 0

        questions.forEach((q: any, idx: number) => {
          const points = q.points || Math.floor(100 / questions.length)
          totalPoints += points
          const selectedAnswer = answers?.[String(idx)] ?? answers?.[idx]
          const isCorrect = selectedAnswer === q.correct
          if (isCorrect) earnedPoints += points
          details.push({
            question: q.q || q.question,
            correct: isCorrect,
            points,
            studentAnswer: selectedAnswer ?? -1,
            correctAnswer: q.correct,
          })
        })

        maxScore = totalPoints
        score = earnedPoints
      } catch {
        // If questions JSON is invalid, score stays 0
      }
    }

    const result = await db.homeworkResult.create({
      data: {
        homeworkId,
        studentId,
        score,
        maxScore,
        answers: JSON.stringify(answers),
        details: JSON.stringify(details),
        submittedAt: new Date(),
      },
    })

    // Log activity
    await db.studentActivity.create({
      data: {
        studentId,
        action: 'homework_submit',
        details: `قدم واجب "${hw.title}" - الدرجة: ${score}/${maxScore}`,
      },
    })

    return NextResponse.json({
      result: { id: result.id, score, maxScore, submittedAt: result.submittedAt },
      details,
    })
  } catch (error) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'Failed to submit homework' }, { status: 500 })
  }
}

// GET /api/homework/submit?homeworkId=xxx - Get results for a homework
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const homeworkId = searchParams.get('homeworkId')

  if (!homeworkId) {
    return NextResponse.json({ error: 'homeworkId required' }, { status: 400 })
  }

  try {
    const results = await db.homeworkResult.findMany({
      where: { homeworkId },
      include: { student: { select: { name: true, phone: true, grade: true, status: true } } },
      orderBy: { submittedAt: 'desc' },
    })

    // Get all students in the homework's grade who haven't submitted
    const hw = await db.homework.findUnique({ where: { id: homeworkId } })
    const submittedStudentIds = new Set(results.map((r: any) => r.studentId))
    const notTaken = hw ? await db.student.findMany({
      where: { grade: hw.grade, status: 'approved', id: { not: { in: Array.from(submittedStudentIds) } } },
      select: { id: true, name: true, phone: true },
    }) : []

    // Analyze most-missed questions
    const questionMisses: Record<number, { question: string; total: number; wrong: number }> = {}
    results.forEach((r: any) => {
      if (r.details) {
        try {
          const dets = JSON.parse(r.details)
          dets.forEach((d: any, idx: number) => {
            if (!questionMisses[idx]) {
              questionMisses[idx] = { question: d.question, total: 0, wrong: 0 }
            }
            questionMisses[idx].total++
            if (!d.correct) questionMisses[idx].wrong++
          })
        } catch {}
      }
    })
    const mostMissed = Object.values(questionMisses)
      .filter(q => q.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong)

    return NextResponse.json({ results, notTaken, mostMissed })
  } catch (error) {
    console.error('Homework results error:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
