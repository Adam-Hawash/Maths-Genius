// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

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
      return NextResponse.json({ error: 'تم تقديم هذا الامتحان بالفعل ولا يمكنك إعادته' }, { status: 400 })
    }

    // Fetch exam with questions
    const exam = await db.exam.findUnique({ where: { id: examId } })
    if (!exam) {
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }

    // Parse MCQ questions safely
    let questions: any[] = []
    if (exam.questions) {
      try {
        questions = typeof exam.questions === 'string' ? JSON.parse(exam.questions) : exam.questions
      } catch (e) {
        console.error('Failed to parse exam questions JSON:', e)
        questions = []
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة صالحة في هذا الامتحان' }, { status: 400 })
    }

    // Auto-grade with robust format handling (supports both 'q', 'question', and index formats)
    let score = 0
    let maxScore = 0
    const wrongQuestions: { question: string; studentAnswer: string; correctAnswer: string }[] = []

    questions.forEach(function(q: any, i: number) {
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts

      // استخراج الإجابة المرسلة من الطالب بأكثر من طريقة لضمان التوافق
      const studentAnswer = Array.isArray(answers) 
        ? answers[i] 
        : (answers[i] !== undefined ? answers[i] : (answers[String(i)] !== undefined ? answers[String(i)] : undefined))
      
      const correctIdx = typeof q.correct === 'number' ? q.correct : 0

      if (studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === Number(correctIdx)) {
        score += pts
      } else {
        const opts = Array.isArray(q.options) ? q.options : []
        const parsedStudentAns = (studentAnswer !== undefined && studentAnswer !== null && opts[Number(studentAnswer)]) 
          ? String.fromCharCode(65 + Number(studentAnswer)) + ') ' + opts[Number(studentAnswer)] 
          : 'لم يتم الإجابة'

        wrongQuestions.push({
          question: q.question || q.q || ('السؤال ' + (i + 1)),
          studentAnswer: parsedStudentAns,
          correctAnswer: opts[correctIdx] ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx] : '',
        })
      }
    })

    if (maxScore === 0) maxScore = questions.length
    const passScore = exam.passScore || 50
    const passCount = Math.ceil(maxScore * passScore / 100)
    const passed = score >= passCount

    // Save result safely with Prisma
    const result = await safeWrite(function() {
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
    return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
