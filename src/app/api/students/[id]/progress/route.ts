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

    // Use raw SQL for student lookup (Prisma schema out of sync - isPaidAccess column missing in DB)
    var student: any = null
    try {
      var studentRows = await db.$queryRawUnsafe('SELECT id, name, grade FROM Student WHERE id = ? LIMIT 1', id)
      student = studentRows && studentRows.length > 0 ? studentRows[0] : null
    } catch (e) {
      console.error('Student lookup raw SQL error, trying Prisma:', e)
      try { student = await db.student.findUnique({ where: { id }, select: { id: true, name: true, grade: true } }) } catch(e2) {}
    }
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Get video progress using RAW SQL (avoid Prisma schema mismatches)
    var videoProgress: any[] = []
    try {
      videoProgress = await db.$queryRawUnsafe(
        'SELECT * FROM VideoProgress WHERE studentId = ? ORDER BY lastWatchedAt DESC',
        id
      ) || []
    } catch (e) {
      console.error('VideoProgress raw SQL error, trying Prisma:', e)
      try {
        videoProgress = await db.videoProgress.findMany({ where: { studentId: id }, orderBy: { lastWatchedAt: 'desc' } })
      } catch(e2) { videoProgress = [] }
    }

    const videoIds = [...new Set(videoProgress.map((vp: any) => vp.videoId))]
    var videoMap: any = {}
    try {
      if (videoIds.length > 0) {
        var placeholders = videoIds.map(function() { return '?' }).join(',')
        var videos = await db.$queryRawUnsafe(
          'SELECT id, title, grade FROM Video WHERE id IN (' + placeholders + ')',
          ...videoIds
        ) || []
        videoMap = Object.fromEntries((videos as any[]).map((v: any) => [v.id, v]))
      }
    } catch (e) {
      console.error('Video lookup error:', e)
    }

    const videoProgressEnriched = videoProgress.map((vp: any) => ({
      id: vp.id,
      studentId: vp.studentId,
      videoId: vp.videoId,
      watchedSeconds: vp.watchedSeconds || 0,
      totalSeconds: vp.totalSeconds || 0,
      completed: !!vp.completed,
      lastWatchedAt: vp.lastWatchedAt,
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
        // Build all questions review (correct + wrong)
        var allExamQuestions: any[] = []
        try {
          var mcqAll = []
          if (row.questions) {
            var rawAll = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
            if (Array.isArray(rawAll)) mcqAll = rawAll
          }
          var studentAnsAll: any = {}
          if (row.answers) {
            studentAnsAll = typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers
          }
          mcqAll.forEach(function(q, qi) {
            var qText = q.question || q.q || ''
            var opts = Array.isArray(q.options) ? q.options : []
            var correctIdx = typeof q.correct === 'number' ? q.correct : 0
            if (correctIdx < 0 || correctIdx >= opts.length) correctIdx = 0
            var ans = undefined
            if (Array.isArray(studentAnsAll)) {
              ans = studentAnsAll[qi]
            } else if (studentAnsAll !== null && typeof studentAnsAll === 'object') {
              ans = studentAnsAll[qi] !== undefined ? studentAnsAll[qi] : studentAnsAll[String(qi)]
            }
            var isCorrect = ans !== undefined && ans !== null && Number(ans) === correctIdx
            var studentAnswerText = (typeof ans === 'number' && opts[ans])
              ? String.fromCharCode(65 + ans) + ') ' + opts[ans]
              : 'Not answered'
            var correctAnswerText = opts[correctIdx]
              ? String.fromCharCode(65 + correctIdx) + ') ' + opts[correctIdx]
              : ''
            allExamQuestions.push({
              question: qText,
              studentAnswer: studentAnswerText,
              correctAnswer: correctAnswerText,
              isCorrect: isCorrect,
            })
          })
        } catch(e) {}

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
          allQuestions: allExamQuestions,
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
        var writingAnswers: any[] = []

        // Re-grade to find wrong questions + collect writing answers
        try {
          var mcq = []
          var writingQs = []
          if (row.questions) {
            var raw = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions
            if (Array.isArray(raw)) {
              raw.forEach(function(q) {
                if (q.type === 'writing' || q.type === 'essay') {
                  writingQs.push(q)
                } else {
                  mcq.push(q)
                }
              })
            }
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

          // Collect writing answers (offset by mcq length)
          writingQs.forEach(function(q, wi) {
            var qText = q.question || q.q || ''
            var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
            var studentText = ''
            var offset = mcq.length
            try {
              if (Array.isArray(studentAnswers)) {
                studentText = studentAnswers[offset + wi] || ''
              } else if (studentAnswers && typeof studentAnswers === 'object') {
                studentText = studentAnswers[offset + wi] || studentAnswers[String(offset + wi)] || ''
              }
            } catch (e) {}
            writingAnswers.push({
              question: qText,
              answer: typeof studentText === 'string' ? studentText : String(studentText || ''),
              points: pts,
              modelAnswer: q.modelAnswer || q.answer || '',
              acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : [],
              needsGrading: true,
            })
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
          writingAnswers: writingAnswers,
          hasWritingAnswers: writingAnswers.length > 0,
        })
      }
    } catch (e) {
      console.error('Homework results fetch error (progress):', e)
      homeworkResults = []
    }

    // Summary stats
    const totalVideosWatched = videoProgress.length
    const completedVideos = videoProgress.filter((vp: any) => vp.completed).length
    const avgWatchPercent = videoProgress.length > 0
      ? Math.min(100, Math.round(videoProgress.reduce((sum: number, vp: any) => sum + Math.min(100, (vp.totalSeconds > 0 ? (vp.watchedSeconds / vp.totalSeconds) * 100 : 0)), 0) / videoProgress.length))
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
