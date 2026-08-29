// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students/[id]/progress - Get student's video progress + exam results + homework results with wrong questions
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

    // Get exam results with wrong questions using RAW SQL
    var examResultsEnriched: any[] = []
    try {
      var examRows = await db.$queryRawUnsafe(
        'SELECT er.id, er.examId, er.score, er.maxScore, er.submittedAt, er.answers, e.title, e.questions, e.passScore FROM ExamResult er LEFT JOIN Exam e ON er.examId = e.id WHERE er.studentId = ? ORDER BY er.submittedAt DESC',
        id
      )

      for (var i = 0; i < (examRows || []).length; i++) {
        var row = examRows[i]
        var wrongQuestions: any[] = []

        // Re-grade to find wrong questions (only if answers saved)
        try {
          var mcq = []
          if (row.questions) {
            var raw = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
            if (Array.isArray(raw)) mcq = raw
          }
          var studentAnswers: any = {}
          if (row.answers) {
            studentAnswers = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
          }

          if (mcq.length > 0 && (Array.isArray(studentAnswers) ? studentAnswers.length > 0 : Object.keys(studentAnswers).length > 0)) {
            mcq.forEach(function(q, qi) {
              var qText = q.question || q.q || ''
              var opts = Array.isArray(q.options) ? q.options : []
              var correctIdx = typeof q.correct === 'number' ? q.correct : 0
              if (correctIdx < 0 || correctIdx >= opts.length) correctIdx = 0

              var ans = undefined
              if (Array.isArray(studentAnswers)) {
                ans = studentAnswers[qi]
              } else if (studentAnswers !== null && typeof studentAnswers === 'object') {
                ans = studentAnswers[qi] !== undefined ? studentAnswers[qi] : studentAnswers[String(qi)]
              }

              if (ans === undefined || ans === null || Number(ans) !== correctIdx) {
                wrongQuestions.push({
                  question: qText,
                  studentAnswer: (typeof ans === 'number' && opts[ans])
                    ? String.fromCharCode(65 + ans) + ') ' + opts[ans]
                    : 'لم يتم الإجابة',
                  correctAnswer: opts[correctIdx]
                    ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx]
                    : '',
                })
              }
            })
          }
        } catch(gradeErr) {
          console.error('Re-grade error for exam', row.examId, ':', gradeErr)
        }

        var passScore = row.passScore || 50
        examResultsEnriched.push({
          id: row.id,
          examTitle: row.title || 'امتحان محذوف',
          examGrade: '',
          passScore: passScore,
          passed: (row.score || 0) >= passScore,
          score: row.score || 0,
          maxScore: row.maxScore || 100,
          submittedAt: row.submittedAt,
          wrongQuestions: wrongQuestions,
        })
      }
    } catch (e) {
      console.error('Exam results fetch error (progress):', e)
      // Fallback to Prisma
      try {
        const examResults = await db.examResult.findMany({ where: { studentId: id }, orderBy: { submittedAt: 'desc' } })
        const examIds = [...new Set(examResults.map(er => er.examId))]
        const exams = examIds.length > 0 ? await db.exam.findMany({ where: { id: { in: examIds } }, select: { id: true, title: true, grade: true, passScore: true } }) : []
        const examMap = Object.fromEntries(exams.map(e => [e.id, e]))
        examResultsEnriched = examResults.map(er => ({
          ...er, examTitle: examMap[er.examId]?.title || 'امتحان محذوف', examGrade: examMap[er.examId]?.grade || '',
          passScore: examMap[er.examId]?.passScore || 50, passed: er.score >= (examMap[er.examId]?.passScore || 50), wrongQuestions: [],
        }))
      } catch(e2) { examResultsEnriched = [] }
    }

    // Get homework results using RAW SQL — include answers column
    var homeworkResults: any[] = []
    try {
      var hwRows = await db.$queryRawUnsafe(
        'SELECT hr.id, hr.homeworkId, hr.score, hr.maxScore, hr.submittedAt, hr.answers, h.title, h.questions FROM HomeworkResult hr LEFT JOIN Homework h ON hr.homeworkId = h.id WHERE hr.studentId = ? ORDER BY hr.submittedAt DESC',
        id
      )

      for (var i = 0; i < (hwRows || []).length; i++) {
        var row = hwRows[i]
        var wrongQuestions: any[] = []

        // Re-grade to find wrong questions
        try {
          var mcq = []
          if (row.questions) {
            var raw = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
            if (Array.isArray(raw)) mcq = raw
          }
          var studentAnswers: any = {}
          if (row.answers) {
            studentAnswers = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
          }

          mcq.forEach(function(q, qi) {
            var qText = q.question || q.q || ''
            var opts = Array.isArray(q.options) ? q.options : []
            var correctIdx = typeof q.correct === 'number' ? q.correct : 0
            if (correctIdx < 0 || correctIdx >= opts.length) correctIdx = 0

            var ans = undefined
            if (Array.isArray(studentAnswers)) {
              ans = studentAnswers[qi]
            } else if (studentAnswers !== null && typeof studentAnswers === 'object') {
              ans = studentAnswers[qi] !== undefined ? studentAnswers[qi] : studentAnswers[String(qi)]
            }

            if (ans === undefined || ans === null || Number(ans) !== correctIdx) {
              wrongQuestions.push({
                question: qText,
                studentAnswer: (typeof ans === 'number' && opts[ans])
                  ? String.fromCharCode(65 + ans) + ') ' + opts[ans]
                  : 'لم يتم الإجابة',
                correctAnswer: opts[correctIdx]
                  ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx]
                  : '',
              })
            }
          })
        } catch(gradeErr) {
          console.error('Re-grade error for hw', row.homeworkId, ':', gradeErr)
        }

        homeworkResults.push({
          id: row.id,
          homeworkTitle: row.title || 'واجب محذوف',
          score: row.score || 0,
          maxScore: row.maxScore || 100,
          submittedAt: row.submittedAt,
          wrongQuestions: wrongQuestions,
        })
      }
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
    const avgExamScore = examResultsEnriched.length > 0
      ? Math.round(examResultsEnriched.reduce(function(s, er) { return s + er.score }, 0) / examResultsEnriched.length)
      : 0
    const examsPassed = examResultsEnriched.filter(function(er) { return er.passed }).length
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
        totalExamsTaken: examResultsEnriched.length,
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
