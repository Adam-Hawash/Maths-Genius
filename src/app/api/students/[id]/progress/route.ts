// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students/[id]/progress - Get student's video progress + exam results + homework results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const student = await db.student.findUnique({ where: { id } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Get video progress
    const videoProgress = await db.videoProgress.findMany({
      where: { studentId: id },
      orderBy: { lastWatchedAt: 'desc' },
    })

    // Get video details separately
    const videoIds = [...new Set(videoProgress.map(vp => vp.videoId))]
    const videos = videoIds.length > 0
      ? await db.video.findMany({ where: { id: { in: videoIds } }, select: { id: true, title: true, grade: true } })
      : []
    const videoMap = Object.fromEntries(videos.map(v => [v.id, v]))

    const videoProgressEnriched = videoProgress.map(vp => ({
      ...vp,
      percent: vp.totalSeconds > 0 ? Math.min(100, Math.round((vp.watchedSeconds / vp.totalSeconds) * 100)) : 0,
      videoTitle: videoMap[vp.videoId]?.title || 'فيديو محذوف',
      videoGrade: videoMap[vp.videoId]?.grade || '',
    }))

    // Get exam results
    const examResults = await db.examResult.findMany({
      where: { studentId: id },
      orderBy: { submittedAt: 'desc' },
    })

    // Get exam details separately
    const examIds = [...new Set(examResults.map(er => er.examId))]
    const exams = examIds.length > 0
      ? await db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true, grade: true, passScore: true } })
      : []
    const examMap = Object.fromEntries(exams.map(e => [e.id, e]))

    const examResultsEnriched = examResults.map(er => ({
      ...er,
      examTitle: examMap[er.examId]?.title || 'امتحان محذوف',
      examGrade: examMap[er.examId]?.grade || '',
      passScore: examMap[er.examId]?.passScore || 50,
      passed: er.score >= (examMap[er.examId]?.passScore || 50),
    }))

    // Get homework results using RAW SQL
    var homeworkResults: any[] = []
    try {
      var hwRows = await db.$queryRawUnsafe(
        'SELECT h.id, h.title, hr.score, hr.maxScore, hr.submittedAt FROM HomeworkResult hr LEFT JOIN Homework h ON hr.homeworkId = h.id WHERE hr.studentId = ? ORDER BY hr.submittedAt DESC',
        id
      )
      homeworkResults = (hwRows || []).map(function(row: any) {
        return {
          id: row.id,
          homeworkTitle: row.title || 'واجب محذوف',
          score: row.score || 0,
          maxScore: row.maxScore || 100,
          submittedAt: row.submittedAt,
        }
      })
    } catch (e) {
      console.error('Homework results fetch error (progress):', e)
      homeworkResults = []
    }

    // Summary stats
    const totalVideosWatched = videoProgress.length
    const completedVideos = videoProgress.filter(vp => vp.completed).length
    const avgWatchPercent = videoProgress.length > 0
      ? Math.min(100, Math.round(videoProgress.reduce((sum, vp) => sum + Math.min(100, (vp.totalSeconds > 0 ? (vp.watchedSeconds / vp.totalSeconds) * 100 : 0)), 0) / videoProgress.length))
      : 0
    const avgExamScore = examResults.length > 0
      ? Math.round(examResults.reduce((sum, er) => sum + er.score, 0) / examResults.length)
      : 0
    const examsPassed = examResults.filter(function(er) { return er.score >= (examMap[er.examId]?.passScore || 50) }).length
    const avgHwScore = homeworkResults.length > 0
      ? Math.round(homeworkResults.reduce(function(s, r) { return s + r.score }, 0) / homeworkResults.length)
      : 0

    return NextResponse.json({
      student: { id: student.id, name: student.name, grade: student.grade },
      videoProgress: videoProgressEnriched,
      examResults: examResultsEnriched,
      homeworkResults: homeworkResults,
      summary: {
        totalVideosWatched,
        completedVideos,
        avgWatchPercent,
        totalExamsTaken: examResults.length,
        examsPassed,
        avgExamScore,
        totalHomeworkDone: homeworkResults.length,
        avgHwScore,
      },
    })
  } catch (error) {
    console.error('Student progress error:', error)
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
  }
}
