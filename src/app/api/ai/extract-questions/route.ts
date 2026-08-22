import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/ai/extract-and-save
// Saves AI-extracted questions as an exam or homework
export async function POST(request: NextRequest) {
  try {
    var formData = await request.formData()
    var type = formData.get('type') as string || 'exam' // 'exam' or 'homework'
    var grade = formData.get('grade') as string || ''
    var title = formData.get('title') as string || ''
    var questionsJson = formData.get('questions') as string || '[]'

    if (!grade || !title) {
      return NextResponse.json({ error: 'Grade and title are required' }, { status: 400 })
    }

    var questions = []
    try {
      questions = JSON.parse(questionsJson)
    } catch {
      return NextResponse.json({ error: 'Invalid questions JSON' }, { status: 400 })
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'No valid questions provided' }, { status: 400 })
    }

    if (type === 'homework') {
      var hw = await db.homework.create({
        data: {
          title: title,
          content: '',
          grade: grade,
          questions: JSON.stringify(questions),
        },
      })
      return NextResponse.json({ success: true, message: 'تم حفظ الواجب بنجاح! (' + questions.length + ' سؤال)', id: hw.id })
    } else {
      var exam = await db.exam.create({
        data: {
          title: title,
          content: '',
          grade: grade,
          questions: JSON.stringify(questions),
        },
      })
      return NextResponse.json({ success: true, message: 'تم حفظ الامتحان بنجاح! (' + questions.length + ' سؤال)', id: exam.id })
    }
  } catch (error: any) {
    console.error('Extract and save error:', error)
    return NextResponse.json({ error: 'Save failed: ' + (error.message || 'Unknown error') }, { status: 500 })
  }
}
