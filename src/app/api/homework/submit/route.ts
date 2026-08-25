import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

// POST /api/homework/submit - Submit homework answers and auto-grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, homeworkId, answers, shuffledQuestions } = body

    if (!studentId || !homeworkId || !answers) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Prevent double submission
    const existing = await db.homeworkResult.findUnique({
      where: { studentId_homeworkId: { studentId, homeworkId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'تم تقديم هذا الواجب بالفعل', alreadySubmitted: true }, { status: 400 })
    }

    // Fetch homework
    const homework = await db.homework.findUnique({ where: { id: homeworkId } })
    if (!homework) {
      return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 })
    }

    // Parse questions
    let questions: any[] = []
    if (shuffledQuestions && Array.isArray(shuffledQuestions) && shuffledQuestions.length > 0) {
      questions = shuffledQuestions
    } else if (homework.questions) {
      try {
        questions = typeof homework.questions === 'string' ? JSON.parse(homework.questions) : homework.questions
      } catch { questions = [] }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة في هذا الواجب' }, { status: 400 })
    }

    // Auto-grade
    let score = 0
    questions.forEach(function(q: any, i: number) {
      const studentAnswer = Array.isArray(answers) ? answers[i] : (answers[i] !== undefined ? answers[i] : answers[String(i)])
      const correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (studentAnswer !== undefined && studentAnswer === correctIdx) {
        score++
      }
    })

    const maxScore = questions.length
    const passed = score >= Math.ceil(maxScore * 0.5)
    const resultMessage = passed ? 'شاطر' : 'عايز مراجعة على الدروس'

    // Save result
    const result = await safeWrite(function() {
      return db.homeworkResult.create({
        data: {
          studentId: studentId,
          homeworkId: homeworkId,
          score: score,
          maxScore: maxScore,
        },
      })
    })

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        studentId: result.studentId,
        homeworkId: result.homeworkId,
        score: result.score,
        maxScore: result.maxScore,
        passed: passed,
        resultMessage: resultMessage,
        submittedAt: result.submittedAt,
      },
    })
  } catch (error: any) {
    console.error('Homework submit error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الواجب: ' + (error.message || '') }, { status: 500 })
  }
}
