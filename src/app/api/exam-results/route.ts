// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exam-results?examId=xxx - Admin: results for a specific exam with analytics
// GET /api/exam-results?studentId=xxx - Student: all exam results for a student
// GET /api/exam-results?studentId=xxx&examId=xxx - Check if student submitted specific exam
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const examId = searchParams.get('examId')
  const studentId = searchParams.get('studentId')
  const grade = searchParams.get('grade')

  // Student mode: return all results for this student
  if (studentId && !examId) {
    try {
      var results = await db.examResult.findMany({
        where: { studentId },
        orderBy: { submittedAt: 'desc' },
      })
      return NextResponse.json({ results })
    } catch (error) {
      console.error('Student exam results error:', error)
      return NextResponse.json({ results: [] })
    }
  }

  // Admin mode: results for a specific exam with analytics
  if (!examId) {
    return NextResponse.json({ error: 'examId required' }, { status: 400 })
  }

  try {
    var whereClause: any = { examId }
    if (studentId) {
      whereClause.studentId = studentId
    }

    const results = await db.examResult.findMany({
      where: whereClause,
      include: { student: { select: { name: true, phone: true, grade: true, status: true } } },
      orderBy: { submittedAt: 'desc' },
    })

    // If studentId is provided with examId, return simple result (used for pre-submit check)
    if (studentId) {
      return NextResponse.json({ results })
    }

    // Full admin analytics
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
