    // 2) text answers → (2026-و29 + و44) تصحيح سؤال-بسؤال بتوازي محدود (اتنين مع بعض):
    //    1) مطابقة سريعة محلية (quickSmartMatch) → كاملة من غير AI
    //    2) AI لكل سؤال لوحده (gradeTextAnswer — فيه تحقق قيم مدمج STRICT VERIFY)
    //    3) فشل/عدم تأكد → فولباك حاسم للسؤال ده بس (مش الدفعة كلها)
    //    + partial persist بعد كل سؤال — اللي اتصحح مش بيضيع لو اتقطعنا
    //    + (و44) طلب المستر «تسرع التصحيح»: النصي والصور في pool واحد بعاملين
    //      مع تأخير بداية متدرجة — نفس منطق كل سؤال بالظبط، بس أسرع ~1.8x
    var textGraded: any[] = []
    var imageGraded: any[] = []
    var gradeTasks: (() => Promise<void>)[] = []
    var _tw2: number
    for (_tw2 = 0; _tw2 < textWorkload.length; _tw2++) {
      (function (tw: number) {
        gradeTasks.push(async function () {
          try {
            var twItem = textWorkload[tw]
            var twAnswer = twItem.studentText || ''
            var graded1: any = null
            if (!twAnswer.trim() || twAnswer.trim() === '[📷 صورة مرفقة]') {
              graded1 = {
                question: twItem.question, answer: twAnswer, modelAnswer: twItem.modelAnswer,
                awardedPoints: 0, maxPoints: twItem.points, isCorrect: false,
                feedback: 'لم يتم الإجابة', gradingStatus: 'graded',
              }
            } else if (quickSmartMatch(twAnswer, twItem.modelAnswer || '', twItem.acceptedAnswers || []) === true) {
              /* (و24) ملاحظة شخصية زي معلم بيتكلم مع الطالب — حتى في المسار السريع */
              var stNote = (finalAnswerCandidates(twAnswer)[0] || twAnswer.trim() || '').slice(0, 40)
              graded1 = {
                question: twItem.question, answer: twAnswer, modelAnswer: twItem.modelAnswer,
                awardedPoints: twItem.points, maxPoints: twItem.points, isCorrect: true,
                feedback: 'برافو عليك ✓ الإجابة النهائية (' + stNote + ') مطابقة للإجابة الصحيحة',
                gradingStatus: 'graded',
              }
            } else {
              var tGrade1: any = null
              try {
                tGrade1 = await gradeTextAnswer({
                  question: twItem.question,
                  studentAnswer: twAnswer,
                  modelAnswer: twItem.modelAnswer || '',
                  acceptedAnswers: twItem.acceptedAnswers || [],
                  maxPoints: twItem.points,
                })
              } catch (tgErr) { console.error('[exam-submit] text grade error:', tgErr) }
              if (tGrade1 && !tGrade1.needsGrading) {
                graded1 = {
                  question: twItem.question, answer: twAnswer, modelAnswer: twItem.modelAnswer,
                  awardedPoints: tGrade1.awardedPoints || 0, maxPoints: twItem.points,
                  isCorrect: tGrade1.isCorrect === true,
                  feedback: tGrade1.feedback || (tGrade1.isCorrect ? 'إجابة صحيحة' : 'إجابة مختلفة عن الإجابة الصحيحة'),
                  gradingStatus: 'graded',
                }
              } else {
                /* AI فشل أو مش متأكد في السؤال ده بس → فولباك حاسم —
                   تكافؤ القيم → كاملة، علاقة بالحل → نص درجة + مراجعة */
                graded1 = gradeFallbackDecisive({
                  question: twItem.question, answer: twAnswer,
                  modelAnswer: twItem.modelAnswer || '',
                  acceptedAnswers: twItem.acceptedAnswers || [],
                  points: twItem.points,
                })
              }
            }
            textGraded[tw] = graded1
            await persistExamGrades()
          } catch (twErr) {
            console.error('[exam-submit] text task error:', twErr)
          }
        })
      })(_tw2)
    }
    /* (و44) الصور في نفس الـ pool — بتتقص على اتنين زي النصي بالظبط */
    var _im2: number
    for (_im2 = 0; _im2 < imageWorkload.length; _im2++) {
      (function (im: number) {
        gradeTasks.push(async function () {
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
              /* (و44) النص الكامل للإجابة — عشان «الجدول: …» المكتوب بالكيبورد
                 يتحسب مع الرسمة المصورة في نفس الحكم (المستر: التصحيح من الاثنين) */
              studentText: iw.studentText || '',
            })
          } catch (imErr) {
            console.error('Writing image grade error:', imErr)
          }
          if (gradeData && gradeData.needsGrading !== true) {
            /* حكم الـ AI الواثق على الإجابة النهائية — نهائي: صح/غلط */
            var imAwarded = Math.min(Math.max(Math.round(Number(gradeData.awardedPoints) || (gradeData.isCorrect ? iw.points : 0)), 0), iw.points)
            var imGrade = {
              question: iw.question,
              answer: iw.studentText,
              modelAnswer: iw.modelAnswer,
              awardedPoints: imAwarded,
              maxPoints: iw.points,
              isCorrect: imAwarded >= Math.ceil(iw.points * 0.5) && imAwarded > 0,
              feedback: gradeData.feedback || (imAwarded > 0 ? 'تم تصحيح صورة الحل' : 'الحل مش مطابق'),
              gradingStatus: 'graded',
              aiExtractedAnswer: gradeData.extractedAnswer || '',
            }
            imageGraded.push(imGrade)
            writingScore += Number(imGrade.awardedPoints) || 0
            gradesByOrig[iw.origIdx] = imGrade
          } else {
            /* الحسم الحاسم (نفس decisiveImageFallback بتاع الواجب):
               الـ VLM فشل أو مش متأكد ← مفيش needsGrading معلقة خالص —
               درجة مؤقتة عادلة (نص درجة المحاولة) والمستر يعدّلها من لوحته */
            var hasRealWork = iw.studentText.replace(/\[📷[^\]]*\]/g, '').trim().length > 0
            var fbGrade = {
              question: iw.question,
              answer: iw.studentText,
              modelAnswer: iw.modelAnswer,
              awardedPoints: hasRealWork ? Math.ceil(iw.points / 2) : 0,
              maxPoints: iw.points,
              isCorrect: false,
              feedback: hasRealWork ? 'صورة الحل اترفعت — درجة مؤقتة والمستر هيراجعها ويعدّلها' : 'لم يتم الإجابة',
              gradingStatus: 'graded',
              aiExtractedAnswer: hasRealWork ? '(صورة الحل مقدرناش نقراها بدقة)' : '',
            }
            imageGraded.push(fbGrade)
            writingScore += Number(fbGrade.awardedPoints) || 0
            gradesByOrig[iw.origIdx] = fbGrade
          }
          // persist بعد كل سؤال صورة
          await persistExamGrades()
        })
      })(_im2)
    }
    /* (و44) تشغيل الـ pool — عاملين بالظبط مع بداية متدرجة */
    try {
      await runGradePool(gradeTasks, 2, 400)
    } catch (grErr) {
      console.error('Exam writing grade error:', grErr)
    }
    /* شبكة أمان (و44): أي سؤال نصي ماحصلش حكم ليه → فولباك حاسم (مفيش pending) */
    for (var twF = 0; twF < textWorkload.length; twF++) {
      if (!textGraded[twF]) {
        try {
          textGraded[twF] = gradeFallbackDecisive({
            question: textWorkload[twF].question,
            answer: textWorkload[twF].studentText,
            modelAnswer: textWorkload[twF].modelAnswer || '',
            acceptedAnswers: textWorkload[twF].acceptedAnswers || [],
            points: textWorkload[twF].points,
          })
        } catch (fbErr) {
          textGraded[twF] = {
            question: textWorkload[twF].question, answer: textWorkload[twF].studentText,
            modelAnswer: textWorkload[twF].modelAnswer,
            awardedPoints: 0, maxPoints: textWorkload[twF].points, isCorrect: false,
            feedback: 'لم يتم الإجابة', gradingStatus: 'graded',
          }
        }
      }
    }
    for (var tx = 0; tx < textWorkload.length; tx++) {
      var tGrade = textGraded[tx] || null
      if (!tGrade) {
        try {
          tGrade = gradeFallbackDecisive({
            question: textWorkload[tx].question, answer: textWorkload[tx].studentText,
            modelAnswer: textWorkload[tx].modelAnswer, acceptedAnswers: textWorkload[tx].acceptedAnswers,
            points: textWorkload[tx].points,
          })
        } catch (fbErr2) {
          tGrade = {
            question: textWorkload[tx].question, answer: textWorkload[tx].studentText, modelAnswer: textWorkload[tx].modelAnswer,
            awardedPoints: 0, maxPoints: textWorkload[tx].points, isCorrect: false,
            feedback: 'لم يتم الإجابة', gradingStatus: 'graded',
          }
        }
      }
      writingScore += Number(tGrade.awardedPoints) || 0
      gradesByOrig[textWorkload[tx].origIdx] = tGrade
    }
    // persist بعد مرحلة النصوص
    await persistExamGrades()
