import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const grade = searchParams.get('grade')

    if (examId) {
      // Get results for a specific exam + list of students who haven't taken it
      const exam = await db.exam.findUnique({ where: { id: examId } })
      if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

      const results = await db.examResult.findMany({
        where: { examId },
        include: { student: { select: { name: true, phone: true, grade: true, status: true } } },
        orderBy: { submittedAt: 'desc' },
      })

      // Students who haven't taken this exam
      const takenStudentIds = results.map((r) => r.studentId)
      const notTaken = await db.student.findMany({
        where: { grade: exam.grade, status: 'approved', id: { notIn: takenStudentIds } },
        orderBy: { name: 'asc' },
      })

      return NextResponse.json({ exam, results, notTaken })
    }

    if (grade) {
      // Get all exam results for a grade (for student view)
      const exams = await db.exam.findMany({ where: { grade } })
      const examIds = exams.map((e) => e.id)
      const results = examIds.length > 0
        ? await db.examResult.findMany({
            where: { examId: { in: examIds } },
            orderBy: { submittedAt: 'desc' },
          })
        : []
      return NextResponse.json({ results })
    }

    return NextResponse.json({ error: 'examId or grade required' }, { status: 400 })
  } catch (error) {
    console.error('Exam results fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam results' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, studentId, score, maxScore } = body

    if (!examId || !studentId || score === undefined) {
      return NextResponse.json({ error: 'examId, studentId, and score are required' }, { status: 400 })
    }

    // Upsert: update if exists, create if not
    const result = await db.examResult.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: { score: parseFloat(score), maxScore: parseFloat(maxScore || '100'), submittedAt: new Date() },
      create: { examId, studentId, score: parseFloat(score), maxScore: parseFloat(maxScore || '100') },
    })

    // Track activity
    await db.studentActivity.create({
      data: { studentId, action: 'exam_submitted', details: `Exam: ${examId}, Score: ${score}/${maxScore || 100}` },
    })

    return NextResponse.json({ result }, { status: 201 })
  } catch (error) {
    console.error('Exam result create error:', error)
    return NextResponse.json({ error: 'Failed to save exam result' }, { status: 500 })
  }
}
