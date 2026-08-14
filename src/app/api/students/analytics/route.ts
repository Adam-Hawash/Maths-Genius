import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students/analytics?grade=X - Get all students in grade with aggregated analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')

    if (!grade) {
      return NextResponse.json({ error: 'Grade is required' }, { status: 400 })
    }

    // Get all approved students in this grade
    const students = await db.student.findMany({
      where: { grade, status: 'approved' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, phone: true, grade: true, loginCount: true, lastLogin: true, createdAt: true },
    })

    if (students.length === 0) {
      return NextResponse.json({ students: [], gradeSummary: null })
    }

    const studentIds = students.map(s => s.id)

    // Get video progress for all students in this grade
    const allVideoProgress = await db.videoProgress.findMany({
      where: { studentId: { in: studentIds } },
    })

    // Get all videos for this grade
    const gradeVideos = await db.video.findMany({
      where: { grade },
      select: { id: true, title: true },
    })
    const totalGradeVideos = gradeVideos.length
    const gradeVideoIds = new Set(gradeVideos.map(v => v.id))

    // Get all exams for this grade
    const gradeExams = await db.exam.findMany({
      where: { grade },
      select: { id: true, title: true, passScore: true },
    })
    const totalGradeExams = gradeExams.length

    // Get exam results for all students
    const allExamResults = await db.examResult.findMany({
      where: { studentId: { in: studentIds } },
    })

    // Build per-student analytics
    const studentAnalytics = students.map(student => {
      const vp = allVideoProgress.filter(p => p.studentId === student.id)
      const gradeVp = vp.filter(p => gradeVideoIds.has(p.videoId))
      const watchedCount = gradeVp.length
      const completedCount = gradeVp.filter(p => p.completed).length
      const avgWatchPercent = gradeVp.length > 0
        ? Math.round(gradeVp.reduce((sum, p) => sum + (p.totalSeconds > 0 ? (p.watchedSeconds / p.totalSeconds) * 100 : 0), 0) / gradeVp.length)
        : 0

      // Only count exam results for exams in this grade
      const gradeExamIds = new Set(gradeExams.map(e => e.id))
      const er = allExamResults.filter(r => r.studentId === student.id && gradeExamIds.has(r.examId))
      const examsTaken = er.length
      const avgScore = er.length > 0 ? Math.round(er.reduce((s, r) => s + r.score, 0) / er.length) : 0
      const examsPassed = er.filter(r => {
        const exam = gradeExams.find(e => e.id === r.examId)
        return r.score >= (exam?.passScore || 50)
      }).length

      // Activity score (composite)
      const videoScore = totalGradeVideos > 0 ? (watchedCount / totalGradeVideos) * 40 : 0
      const examScore = totalGradeExams > 0 ? (examsTaken / totalGradeExams) * 30 : 0
      const qualityScore = examsTaken > 0 ? (avgScore / 100) * 20 : 0
      const loginScore = Math.min(student.loginCount, 10) * 1
      const activityScore = Math.round(videoScore + examScore + qualityScore + loginScore)

      return {
        ...student,
        watchedVideos: watchedCount,
        completedVideos: completedCount,
        totalVideos: totalGradeVideos,
        avgWatchPercent,
        examsTaken,
        examsPassed,
        totalExams: totalGradeExams,
        avgExamScore: avgScore,
        activityScore: Math.min(activityScore, 100),
      }
    })

    // Grade summary
    const gradeSummary = {
      totalStudents: students.length,
      totalVideos: totalGradeVideos,
      totalExams: totalGradeExams,
      avgWatchPercent: studentAnalytics.length > 0
        ? Math.round(studentAnalytics.reduce((s, a) => s + a.avgWatchPercent, 0) / studentAnalytics.length)
        : 0,
      avgExamScore: studentAnalytics.length > 0
        ? Math.round(studentAnalytics.reduce((s, a) => s + a.avgExamScore, 0) / studentAnalytics.length)
        : 0,
      avgActivity: studentAnalytics.length > 0
        ? Math.round(studentAnalytics.reduce((s, a) => s + a.activityScore, 0) / studentAnalytics.length)
        : 0,
    }

    // Sort by activity score descending
    studentAnalytics.sort((a, b) => b.activityScore - a.activityScore)

    return NextResponse.json({ students: studentAnalytics, gradeSummary })
  } catch (error) {
    console.error('Students analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
