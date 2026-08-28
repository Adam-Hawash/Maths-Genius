// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exam-results?studentId=xxx&examId=yyy - Student pre-submit check (raw SQL)
// GET /api/exam-results?studentId=xxx - Student: all exam results
// GET /api/exam-results?examId=xxx - Admin: results for exam with analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const examId = searchParams.get('examId')
  const studentId = searchParams.get('studentId')

  // Student mode: all exam results for this student (raw SQL)
  if (studentId && !examId) {
    try {
      var rows = await db.$queryRawUnsafe(
        'SELECT id, examId, studentId, score, maxScore FROM ExamResult WHERE studentId = ?',
        studentId
      )
      return NextResponse.json({ results: rows || [] })
    } catch (error) {
      console.error('Student exam results error:', error)
      return NextResponse.json({ results: [] })
    }
  }

  // Student pre-submit check: specific exam + student (raw SQL)
  if (studentId && examId) {
    try {
      var rows = await db.$queryRawUnsafe(
        'SELECT id FROM ExamResult WHERE studentId = ? AND examId = ? LIMIT 1',
        studentId, examId
      )
      return NextResponse.json({ results: rows || [] })
    } catch (error) {
      console.error('Exam result check error:', error)
      return NextResponse.json({ results: [] })
    }
  }

  // Admin mode: results for a specific exam with analytics (Prisma OK here - admin page)
  if (!examId) {
    return NextResponse.json({ error: 'examId required' }, { status: 400 })
  }

  try {
    var whereClause: any = { examId }
    const results = await db.examResult.findMany({
      where: whereClause,
      include: { student: { select: { name: true, phone: true, grade: true, status: true } } },
      orderBy: { submittedAt: 'desc' },
    })

    // Full admin analytics
    const exam = await db.exam.findUnique({ where: { id: examId } })
    const submittedStudentIds = new Set(results.map((r: any) => r.studentId))
    const notTaken = exam ? await db.student.findMany({
      where: { grade: exam.grade, status: 'approved', id: { not: { in: Array.from(submittedStudentIds) } } },
      select: { id: true, name: true, phone: true },
    }) : []

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

    const avgScore = results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1) : '—'

    return NextResponse.json({ results, notTaken, mostMissed, avgScore })
  } catch (error) {
    console.error('Exam results error:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
