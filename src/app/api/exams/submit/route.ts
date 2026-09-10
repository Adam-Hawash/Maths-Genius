// @ts-nocheck
// POST /api/exams/submit - Submit exam answers, save INSTANTLY, then AI-grade in background
//
// **(إصلاح 2026-و10 — علة «الطالب اللي بيقدم الامتحان بيختفي من عندي»)**:
//   التدفق القديم كان بيصحّح كل الأسئلة المقالية بالذكاء الاصطناعي **قبل** ما
//   يحفظ أي حاجة (كل صورة VLM بـ 35 ثانية) — والعميل بيقطع بعد 120 ثانية
//   ويقول للطالب «تم التقديم» **بالكذب** والسيرفر لسه ما حفظش → مفيش صف في
//   ExamResult → الامتحان يختفي من عند المستر خالص + حارس التسلسل يفتكر
//   إن الطالب ما خدش الامتحان → قفل كاذب على كل اللي بعده.
//   التدفق الجديد (نفس نهج الواجبات المصلح):
//   1) تصحيح الاختياري فورًا (محلي، بلا ثواني)
//   2) حفظ صف ExamResult فورًا (درجة الاختياري + الأسئلة المقالية بحالة pending)
//   3) رد 200 على الطالب في ثواني — «التسليم وصل» كلام صادق مضمون
//   4) التصحيح الذكي للمقالي كله في الخلفية (after) وبعدها UPDATE الدرجة
//   كمان: امتحانات النماذج (models) بقيت مدعومة في التسليم — نفس اختيار
//   النموذج الحتمي اللي الطالب شافه في القايمة (pickModelIdx + fixedModel)

import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { db } from '@/lib/db'
import { gradeImageAnswer, extractImageMediaIds } from '@/lib/ai-image-grader'
import { gradeWritingSmart } from '@/lib/smart-grader'
import { checkExamSequential } from '@/lib/sequential-guard'

export const runtime = 'nodejs'
export const maxDuration = 300

async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ExamResult (
        id TEXT PRIMARY KEY,
        examId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        maxScore REAL NOT NULL DEFAULT 100,
        answers TEXT DEFAULT '',
        writingGrades TEXT DEFAULT '',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN answers TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN writingGrades TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN writingResults TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN gradeOverrides TEXT DEFAULT ""') } catch(e) {}
    try { await db.$executeRawUnsafe('ALTER TABLE ExamResult ADD COLUMN submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP') } catch(e) {}
  } catch (e) {
    console.error('Ensure ExamResult table error:', e)
  }
}

/* ===== اختيار النموذج الحتمي — نسخة مطابقة لمنطق /api/exams (applyModelForStudent)
   عشان التسليم يصحّح نفس الأسئلة اللي الطالب شافها فعلًا ===== */
function pickModelIdx(examId: string, studentId: string, n: number): number {
  var s = String(examId) + '|' + String(studentId)
  var h = 5381
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return n > 0 ? h % n : 0
}
/* 2026-و11 — إصلاح باج حقيقي: الدالة كانت بتقرأ examId من برة نطاقها
   (متغير محلي في POST) → ReferenceError وقت التسليم → «لا توجد أسئلة»
   في امتحانات النماذج العشوائية، وتصحيح النموذج الغلط في المخلوطة */
function modelQuestionsForStudent(exam: any, studentId: string, examId: string): string {
  try {
    var models = exam && exam.models ? JSON.parse(exam.models) : []
    if (!Array.isArray(models) || models.length === 0) return String(exam.questions || '')
    var idx = -1
    if (exam.modelMode === 'fixed' && exam.fixedModel) {
      for (var f = 0; f < models.length; f++) {
        if (models[f] && models[f].name === exam.fixedModel) { idx = f; break }
      }
      if (idx < 0) idx = 0
    } else {
      idx = pickModelIdx(examId, studentId, models.length)
    }
    var m = models[idx]
    if (!m) return String(exam.questions || '')
    return m.questions ? (typeof m.questions === 'string' ? m.questions : JSON.stringify(m.questions)) : String(exam.questions || '')
  } catch (e) {
    return String(exam.questions || '')
  }
}

function parseQuestions(rawQ: any): any[] {
  try {
    var raw = typeof rawQ === 'string' ? JSON.parse(rawQ) : rawQ
    if (Array.isArray(raw)) return raw
  } catch (e) {}
  return []
}

export async function POST(request) {
  try {
    var body = await request.json()
    var studentId = body.studentId
    var examId = body.examId
    var answers = body.answers

    if (!studentId || !examId || answers === undefined || answers === null) {
      return NextResponse.json({ error: 'بيانات مفقودة' }, { status: 400 })
    }

    await ensureTable()

    // Check double submission
    try {
      var existing = await db.$queryRawUnsafe(
        'SELECT id FROM ExamResult WHERE studentId = ? AND examId = ? LIMIT 1',
        studentId, examId
      )
      if (existing && existing.length > 0) {
        return NextResponse.json({ alreadySubmitted: true, submitted: true, blocked: true }, { status: 200 })
      }
    } catch (e) {
      console.error('Check existing exam result error:', e)
    }

    // الترتيب التسلسلي (نفس نظام الفيديوهات — طلب المستر)
    try {
      var seqCheck = await checkExamSequential(examId, studentId)
      if (!seqCheck.ok) {
        return NextResponse.json({ error: seqCheck.reason, sequentialLocked: true }, { status: seqCheck.code || 423 })
      }
    } catch (e) {}

    // Fetch exam (مع النماذج عشان نعرف أسئلة الطالب الفعلية)
    var exam = null
    try {
      var examRows = await db.$queryRawUnsafe(
        'SELECT id, title, questions, passScore, models, modelMode, fixedModel FROM Exam WHERE id = ? LIMIT 1',
        examId
      )
      exam = examRows && examRows.length > 0 ? examRows[0] : null
    } catch (e) {
      console.error('Fetch exam error:', e)
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }
    if (!exam) {
      return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 })
    }

    // Parse questions — (2026-و11) نفس منطق /api/exams بالظبط: لو الامتحان
    // فيه نماذج ← أسئلة نموذج الطالب هو هي الأصل للتصحيح (حتى لو فيه أسئلة
    // أساس — الطالب شاف النموذج بتاعه فلازم يتصحح عليه)، والأساس بوابه احتياط
    var hasModels = false
    try {
      var pModels = exam && exam.models ? JSON.parse(exam.models) : []
      hasModels = Array.isArray(pModels) && pModels.length > 0
    } catch (e) {}
    var questions = hasModels
      ? parseQuestions(modelQuestionsForStudent(exam, studentId, examId))
      : parseQuestions(exam.questions)
    if (questions.length === 0) {
      questions = parseQuestions(exam.questions)
    }
    if (questions.length === 0) {
      questions = parseQuestions(modelQuestionsForStudent(exam, studentId, examId))
    }
    if (questions.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة في هذا الامتحان' }, { status: 400 })
    }

    // Helper: look up student answer by original index
    function lookupAnswer(ans: any, idx: number): any {
      try {
        if (Array.isArray(ans)) return ans[idx]
        if (ans !== null && typeof ans === 'object') {
          return ans[idx] !== undefined ? ans[idx] : ans[String(idx)]
        }
      } catch (e) {}
      return undefined
    }

    // Separate MCQ from writing questions - track original index
    var mcqQuestions: any[] = []
    var writingQuestions: any[] = []
    questions.forEach(function(q, idx) {
      var isWriting = q.type === 'writing' || q.type === 'essay'
      if (!isWriting && Array.isArray(q.options)) {
        var allNA = q.options.length > 0 && q.options.every(function(o) { return !o || o === 'N/A' || o === 'لا يوجد' || String(o).trim() === '' })
        if (allNA) isWriting = true
      }
      if (!isWriting && (!q.options || q.options.length === 0)) isWriting = true
      if (isWriting) writingQuestions.push({ q: q, origIdx: idx })
      else mcqQuestions.push({ q: q, origIdx: idx })
    })

    // ===== المرحلة 1: تصحيح الاختياري فورًا (محلي — مفيش انتظار) =====
    var score = 0
    var maxScore = 0
    /* 2026-و11 — أسئلة اختيارية من غير مفتاح مؤكد: صفر درجة + مراجعة مستر — مش (A) بالحر */
    var keylessMcq: any[] = []
    mcqQuestions.forEach(function(item, i) {
      var q = item.q
      var origIdx = item.origIdx
      var pts = (typeof q.points === 'number' && q.points > 0) ? q.points : 1
      maxScore += pts
      var opts = Array.isArray(q.options) ? q.options : []
      var correctIdx = typeof q.correct === 'number' ? q.correct : -1
      if (correctIdx < 0 || correctIdx >= opts.length) {
        keylessMcq.push({
          index: origIdx,
          question: String(q.question || q.q || ('السؤال ' + (origIdx + 1))),
          points: pts,
          studentAnswer: lookupAnswer(answers, origIdx),
        })
        return /* صفر درجة — مفيش تخمين */
      }
      var studentAnswer = lookupAnswer(answers, origIdx)
      if (studentAnswer !== undefined && studentAnswer !== null && Number(studentAnswer) === correctIdx) {
        score += pts
      }
    })

    // بناء مصفوفة أسئلة المقالي بحالة pending (التصحيح الذكي في الخلفية)
    var textWorkload: any[] = []
    var imageWorkload: any[] = []
    var pendingGrades: any[] = []
    var ptsByOrig: Record<number, number> = {}

    for (var wi = 0; wi < writingQuestions.length; wi++) {
      var wItem = writingQuestions[wi]
      var wq = wItem.q
      var wOrigIdx = wItem.origIdx
      var pts = (typeof wq.points === 'number' && wq.points > 0) ? wq.points : 5
      maxScore += pts
      ptsByOrig[wOrigIdx] = pts

      var lookedUp = lookupAnswer(answers, wOrigIdx)
      var studentText = lookedUp !== undefined && lookedUp !== null ? String(lookedUp) : ''

      var wEntry = {
        origIdx: wOrigIdx,
        question: wq.question || wq.q || '',
        modelAnswer: wq.modelAnswer || wq.answer || '',
        acceptedAnswers: Array.isArray(wq.acceptedAnswers) ? wq.acceptedAnswers : [],
        points: pts,
        studentText: studentText,
      }

      pendingGrades.push({
        origIdx: wOrigIdx,
        question: wEntry.question,
        answer: studentText,
        modelAnswer: wEntry.modelAnswer,
        awardedPoints: 0,
        maxPoints: pts,
        isCorrect: false,
        feedback: 'التصحيح الذكي جاري — هتظهر درجتك كاملة بعد لحظات',
        gradingStatus: 'pending',
      })

      var mediaIds = extractImageMediaIds(studentText)
      if (mediaIds.length > 0) imageWorkload.push(wEntry)
      else textWorkload.push(wEntry)
    }

    /* 2026-و11 — أسئلة المفتاح الناقص بتتحط في المراجعة بحالة graded
       (مش pending عشان إعادة التصحيح الذاتي متحاولش تصححها بالـ AI)
       — صفر درجة صادق + رسالة واضحة للطالب والمستر */
    for (var ki = 0; ki < keylessMcq.length; ki++) {
      var km = keylessMcq[ki]
      pendingGrades.push({
        origIdx: km.index,
        question: km.question,
        answer: km.studentAnswer !== undefined && km.studentAnswer !== null ? String(km.studentAnswer) : '',
        modelAnswer: '⚠ السؤال ده من غير إجابة مؤكدة في مفتاح الدرجات — المستر هيحدد الإجابة الصحيحة ويعيد التصحيح',
        awardedPoints: 0,
        maxPoints: km.points,
        isCorrect: false,
        feedback: '⚠ السؤال ده محتاج مراجعة المستر — إجابته مش مؤكدة في مفتاح الدرجات',
        gradingStatus: 'graded',
        needsManualKey: true,
      })
    }

    if (maxScore === 0) { maxScore = questions.length }

    // ===== المرحلة 2: **حفظ فوري** — الصف موجود من اللحظة دي في عند المستر =====
    var resultId = 'exr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    var answersJson = ''
    if (answers !== undefined && answers !== null) {
      try { answersJson = JSON.stringify(answers) } catch(e) { answersJson = '' }
    }
    var writingGradesJson = ''
    try { writingGradesJson = JSON.stringify(pendingGrades) } catch(e) { writingGradesJson = '' }

    try {
      await db.$executeRawUnsafe(
        'INSERT INTO ExamResult (id, studentId, examId, score, maxScore, answers, writingGrades) VALUES (?, ?, ?, ?, ?, ?, ?)',
        resultId, studentId, examId, score, maxScore, answersJson, writingGradesJson
      )
    } catch (insertErr) {
      console.error('Insert exam result error:', insertErr)
      try {
        await db.$executeRawUnsafe(
          'INSERT INTO ExamResult (id, studentId, examId, score, maxScore, answers) VALUES (?, ?, ?, ?, ?, ?)',
          resultId, studentId, examId, score, maxScore, answersJson
        )
      } catch (retryErr) {
        console.error('Retry insert exam result error:', retryErr)
        return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان' }, { status: 500 })
      }
    }

    // ===== المرحلة 3: رد فوري صادق — التسليم وصل مضمون =====
    // (التصحيح الذكي للمقالي بيكمل في after() وبعدها UPDATE الدرجة)
    after(async () => {
      try {
        // 3أ) نص → التصحيح الذكي (مطابقة سريعة + دفعة AI واحدة + fallback)
        var textGraded: any[] = []
        try {
          var textResult = await gradeWritingSmart(textWorkload.map(function(w) {
            return {
              question: w.question,
              answer: w.studentText,
              modelAnswer: w.modelAnswer,
              acceptedAnswers: w.acceptedAnswers,
              points: w.points,
            }
          }))
          textGraded = textResult.graded || []
        } catch (grErr) {
          console.error('Exam writing smart grade error:', grErr)
          textGraded = textWorkload.map(function(w) {
            return {
              question: w.question, answer: w.studentText, modelAnswer: w.modelAnswer,
              awardedPoints: 0, maxPoints: w.points, isCorrect: false,
              feedback: 'تعذر التصحيح — راجع مع المستر', gradingStatus: 'graded',
            }
          })
        }

        // 3ب) صور → VLM لكل سؤال
        var imageGraded: any[] = []
        for (var im = 0; im < imageWorkload.length; im++) {
          var iw = imageWorkload[im]
          var mediaIds2 = extractImageMediaIds(iw.studentText)
          var gradeData: any = null
          try {
            gradeData = await gradeImageAnswer({
              mediaId: mediaIds2[0],
              question: iw.question,
              modelAnswer: iw.modelAnswer,
              acceptedAnswers: iw.acceptedAnswers,
              maxPoints: iw.points,
            })
          } catch (imErr) {
            console.error('Exam writing image grade error:', imErr)
          }
          if (gradeData && gradeData.needsGrading !== true) {
            /* حكم الـ AI الواثق — نهائي: صح/جزئي/غلط (زي الواجب بالظبط) */
            var imAwarded = Math.min(Math.max(Math.round(Number(gradeData.awardedPoints) || (gradeData.isCorrect ? iw.points : 0)), 0), iw.points)
            imageGraded.push({
              question: iw.question,
              answer: iw.studentText,
              modelAnswer: iw.modelAnswer,
              awardedPoints: imAwarded,
              maxPoints: iw.points,
              isCorrect: imAwarded >= Math.ceil(iw.points * 0.5) && imAwarded > 0,
              feedback: gradeData.feedback || (imAwarded > 0 ? 'تم تصحيح صورة الحل' : 'الحل مش مطابق'),
              gradingStatus: 'graded',
              aiExtractedAnswer: gradeData.extractedAnswer || '',
            })
          } else {
            /* 2026-و13 — طلب المستر الحرفي: الامتحان يتصرف زي الواجب بالظبط —
               مفيش حالة «محتاجة مراجعة» معلقة وخالص: الـ AI مش متأكد من قراية
               الصورة ← درجة مؤقتة عادلة (نص درجة المحاولة) والمستر يقدر يعدلها
               بضغطة من لوحته — مفيش صفر ظالم ومفيش بادج معلق */
            var hasRealWork = iw.studentText.replace(/\[📷[^\]]*\]/g, '').trim().length > 0
            imageGraded.push({
              question: iw.question,
              answer: iw.studentText,
              modelAnswer: iw.modelAnswer,
              awardedPoints: hasRealWork ? Math.ceil(iw.points / 2) : 0,
              maxPoints: iw.points,
              isCorrect: false,
              feedback: hasRealWork
                ? 'صورة الحل اترفعت — درجة مؤقتة لحد ما تراجعها وعدّلها من لوحتك'
                : 'لم يتم الإجابة',
              gradingStatus: 'graded',
              aiExtractedAnswer: hasRealWork ? '(صورة الحل مقدرناش نقراها بدقة)' : '',
            })
          }
        }

        // 3ج) دمج بترتيب الأسئلة الأصلي + جمع الدرجة النهائية
        var gradesByOrig: Record<number, any> = {}
        for (var tx = 0; tx < textWorkload.length; tx++) {
          var tg = textGraded[tx]
          if (tg) gradesByOrig[textWorkload[tx].origIdx] = tg
        }
        for (var ix = 0; ix < imageWorkload.length; ix++) {
          var ig = imageGraded[ix]
          if (ig) gradesByOrig[imageWorkload[ix].origIdx] = ig
        }
        var writingScore = 0
        var finalGrades: any[] = []
        for (var pi = 0; pi < pendingGrades.length; pi++) {
          var pg = pendingGrades[pi]
          var gr = gradesByOrig[pg.origIdx]
          if (gr) {
            writingScore += Number(gr.awardedPoints) || 0
            finalGrades.push({
              origIdx: pg.origIdx,
              question: gr.question || pg.question,
              answer: gr.answer !== undefined ? gr.answer : pg.answer,
              modelAnswer: gr.modelAnswer || pg.modelAnswer,
              awardedPoints: gr.awardedPoints,
              maxPoints: gr.maxPoints || pg.maxPoints,
              isCorrect: gr.isCorrect,
              feedback: gr.feedback,
              gradingStatus: gr.gradingStatus || 'graded',
              needsGrading: gr.needsGrading === true ? true : undefined,
              aiExtractedAnswer: gr.aiExtractedAnswer || '',
            })
          } else {
            // السؤال ده اتسلّم من غير نص ولا صورة → صفر صريح مش pending
            finalGrades.push({
              origIdx: pg.origIdx,
              question: pg.question,
              answer: pg.answer,
              modelAnswer: pg.modelAnswer,
              awardedPoints: 0,
              maxPoints: pg.maxPoints,
              isCorrect: false,
              feedback: 'لم يتم الإجابة',
              gradingStatus: 'graded',
            })
          }
        }

        var finalScore = score + writingScore
        var finalJson = ''
        try { finalJson = JSON.stringify(finalGrades) } catch(e) { finalJson = writingGradesJson }

        await db.$executeRawUnsafe(
          'UPDATE ExamResult SET score = ?, writingGrades = ? WHERE id = ?',
          finalScore, finalJson, resultId
        )
        console.log('[exam-submit] background AI grading done:', resultId, 'score', finalScore + '/' + maxScore)
      } catch (bgErr) {
        // فشل التصحيح الخلفي ≠ فقدان التسليم — الصف محفوظ والدرجة الاختيارية موجودة،
        // ولوحة المستر فيها إعادة تصحيح ذاتية هتكمّل
        console.error('Exam background grading error:', bgErr)
      }
    })

    /* 2026-و12 — طلب المستر الصريح: الطالب ميشوفش أي نتيجة خالص
       (لا درجة ولا تصحيح ولا إجابة نموذجية) — رسالة واحدة بس.
       التصحيح كله بيحصل في الخلفية وبيوصل لمستر وائل من الأدمن. */
    return NextResponse.json({
      success: true,
      submitted: true,
      message: 'تم تسليم الامتحان بنجاح — نتيجتك هتظهر لمستر وائل',
    })
  } catch (error) {
    console.error('Exam submit error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء تسليم الامتحان' }, { status: 500 })
  }
}
