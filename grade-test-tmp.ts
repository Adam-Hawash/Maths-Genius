// اختبار مؤقت — حذف بعد التشغيل
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { gradeImageAnswer, gradeTextAnswer } from './src/lib/ai-image-grader'

var db = new PrismaClient()

async function caseImage(name: string, file: string, modelAnswer: string) {
  var b64 = readFileSync(file).toString('base64')
  var m = await db.media.create({
    data: { filename: name + '.jpg', filePath: 'gradetest/' + name + '.jpg', fileType: 'image/jpeg', fileSize: String(b64.length), data: b64, category: 'gradetest' },
  })
  var r = await gradeImageAnswer({
    mediaId: m.id,
    question: 'Solve, then find x: 125^(x+1) = 625^(x-1)',
    modelAnswer: modelAnswer,
    maxPoints: 5,
  })
  console.log('=== ' + name + ' ===')
  console.log('  isCorrect:', r.isCorrect, '| points:', r.awardedPoints + '/' + r.maxPoints, '| needsGrading:', r.needsGrading)
  console.log('  finalAnswer:', r.finalAnswer, '| confidence:', r.confidence)
  console.log('  feedback:', r.feedback)
  await db.media.delete({ where: { id: m.id } })
  return r
}

async function main() {
  console.log('--- صورة حل صح (x = 7) — زي حالتك بالظبط ---')
  var r1 = await caseImage('correct', '/tmp/sol-correct.jpg', 'x = 7')
  console.log('')
  console.log('--- صورة حل غلط (كتب x = 3 بدل 7) ---')
  var r2 = await caseImage('wrong', '/tmp/sol-wrong.jpg', 'x = 7')

  console.log('')
  console.log('--- نص مقالي: الطالب فاهم لكن بصياغة مختلفة تماماً ---')
  var t = await gradeTextAnswer({
    question: 'اشرح ليه أي عدد مرفوع للأس صفر يساوي 1؟',
    studentAnswer: 'لأن لما تنزل في الأسس ب تقسم على الأساس كل مرة: 2^3=8 يعني 8÷2=4، 4÷2=2، 2÷2=1، فالخطوة الجاية 2^0 = 1÷2÷1 = 1. يعني الأس صفر معناه مفيش ضرب خالص فتبقى الوحدة الحيادية',
    modelAnswer: 'لأن الأس صفر يعني عدم وجود عوامل، والقيمة تبقى الوحدة الحيادية 1 — ويمكن إثباتها بنمط القسمة المتتالية: 2^3=8 ثم القسمة على 2 في كل خطوة تصل إلى 2^0=1',
    maxPoints: 5,
  })
  console.log('  isCorrect:', t?.isCorrect, '| points:', t?.awardedPoints + '/' + t?.maxPoints, '| needsGrading:', t?.needsGrading)
  console.log('  feedback:', t?.feedback)

  var pass = r1.isCorrect && r1.awardedPoints === 5 && !r2.isCorrect && r2.awardedPoints === 0 && t?.isCorrect
  console.log('')
  console.log(pass ? '🏆 النتيجة النهائية: الـ AI بيصحح بفهم — PASS' : '❌ في حاجة مش مظبوطة — FAIL')
}
main().finally(() => db.$disconnect())
