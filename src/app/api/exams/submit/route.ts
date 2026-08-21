import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { safeWrite } from '@/lib/db'

// POST /api/exams/submit - Submit exam answers and auto-grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, examId, answers } = body

    if (!studentId || !examId || !answers) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    // Prevent double submission
    const existing = await db.examResult.findUnique({
      where: { studentId_examId: { studentId, examId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'تم تقديم هذا الامتحان بالفعل' }, { status: 400 })
    }

    // Fetch exam with questions (stored as JSON string in Exam.questions field)
    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }

    // Parse MCQ questions from the exam's JSON questions field
    var questions: any[] = []
    if (exam.questions) {
      try {
        questions = JSON.parse(exam.questions)
      } catch {
        // questions field is not valid JSON
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة MCQ في هذا الامتحان' }, { status: 400 })
    }

    // Auto-grade: compare each answer to the correct option index
    var score = 0
    var wrongQuestions: { question: string; studentAnswer: string; correctAnswer: string }[] = []

    questions.forEach(function(q: any, i: number) {
      var studentAnswer = answers[i]
      var correctIdx = typeof q.correct === 'number' ? q.correct : 0
      if (studentAnswer === correctIdx) {
        score++
      } else {
        var opts = Array.isArray(q.options) ? q.options : []
        wrongQuestions.push({
          question: q.question || q.q || '',
          studentAnswer: typeof studentAnswer === 'number' && opts[studentAnswer] ? String.fromCharCode(65 + studentAnswer) + ') ' + opts[studentAnswer] : 'لم يتم الإجابة',
          correctAnswer: opts[correctIdx] ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx] : '',
        })
      }
    })

    var maxScore = questions.length
    var passScore = exam.passScore || 50
    // passScore is stored as percentage (0-100), calculate actual passing score count
    var passCount = Math.ceil(maxScore * passScore / 100)
    var passed = score >= passCount

    // Save result
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

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        studentId: result.studentId,
        examId: result.examId,
        score: result.score,
        maxScore: result.maxScore,
        passed: passed,
        passScore: passScore,
        wrongQuestions: wrongQuestions,
        submittedAt: result.submittedAt,
      },
    })
  } catch (error: any) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان: ' + (error.message || '') }, { status: 500 })
  }
}
