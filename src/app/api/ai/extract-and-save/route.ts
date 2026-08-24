import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var type = formData.get('type') as string || 'homework'
    var grade = formData.get('grade') as string || ''
    var title = formData.get('title') as string || ''
    var questionsJson = formData.get('questions') as string || '[]'

    if (!title.trim() || !grade) {
      return NextResponse.json({ error: 'العنوان والصف مطلوبين' }, { status: 400 })
    }

    var questions = JSON.parse(questionsJson)
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'لا يوجد أسئلة للحفظ' }, { status: 400 })
    }

    if (type === 'exam') {
      var exam = await db.exam.create({
        data: {
          title: title.trim(),
          grade: grade,
          questions: JSON.stringify(questions),
          passScore: 50,
        },
      })
      return NextResponse.json({ success: true, message: 'تم حفظ الامتحان بنجاح! (' + questions.length + ' سؤال)', examId: exam.id })
    } else {
      var homework = await db.homework.create({
        data: {
          title: title.trim(),
          grade: grade,
          questions: JSON.stringify(questions),
        },
      })
      return NextResponse.json({ success: true, message: 'تم حفظ الواجب بنجاح! (' + questions.length + ' سؤال)', homeworkId: homework.id })
    }
  } catch (error: any) {
    console.error('AI extract and save error:', error)
    return NextResponse.json({ error: 'خطأ في الحفظ: ' + (error.message || 'Unknown') }, { status: 500 })
  }
}
