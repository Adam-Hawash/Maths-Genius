import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exam-results?examId=xxx - Get results for an exam with analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const examId = searchParams.get('examId')

  if (!examId) {
    return NextResponse.json({ error: 'examId required' }, { status: 400 })
  }

  try {
    const results = await db.examResult.findMany({
      where: { examId },
      include: { student: { select: { name: true, phone: true, grade: true, status: true } } },
      orderBy: { submittedAt: 'desc' },
    })

    // Get all approved students in the exam's grade who haven't submitted
    const exam = await db.exam.findUnique({ where: { id: examId } })
    const submittedStudentIds = new Set(results.map((r: any) => r.studentId))
    const notTaken = exam ? await db.student.findMany({
      where: { grade: exam.grade, status: 'approved', id: { not: { in: Array.from(submittedStudentIds) } } },
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

    const avgScore = results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1) : '—'

    return NextResponse.json({ results, notTaken, mostMissed, avgScore })
  } catch (error) {
    console.error('Exam results error:', error)
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}
