import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null // 'homework' or 'exam'
    const grade = formData.get('grade') as string | null
    const fileUrl = formData.get('fileUrl') as string | null

    if (!type || (!file && !fileUrl)) {
      return NextResponse.json({ error: 'الملف أو الرابط ونوع المحتوى مطلوبان' }, { status: 400 })
    }

    let base64Data = ''
    let mimeType = ''

    if (file) {
      const bytes = await file.arrayBuffer()
      base64Data = Buffer.from(bytes).toString('base64')
      mimeType = file.type || 'application/octet-stream'
    } else if (fileUrl) {
      // For URLs, pass directly to vision model
      base64Data = ''
      mimeType = ''
    }

    const typeLabel = type === 'homework' ? 'واجب' : 'امتحان'
    const prompt = `أنت مساعد تعليمي متخصص في استخراج المحتوى من الملفات. هذا ${typeLabel} للصف ${grade || 'غير محدد'}.

المطلوب:
1. استخرج عنوان مناسب لل${typeLabel}
2. استخرج كل الأسئلة الموجودة بالترتيب مع خياراتها إذا كانت اختيار من متعدد
3. حدد الإجابة الصحيحة لكل سؤال إذا كانت موجودة
4. إذا كان هناك نموذج إجابة، استخرجه بشكل منفصل

أجب بصيغة JSON التالية فقط بدون أي نص إضافي:
{
  "title": "عنوان مناسب",
  "content": "وصف مختصر للمحتوى",
  "questions": [
    {
      "question": "نص السؤال",
      "options": ["أ", "ب", "ج", "د"],
      "correct": 0,
      "points": 1
    }
  ],
  "answerKey": "نص نموذج الإجابة إذا وجد أو فارغ"
}`

    const zai = await ZAI.create()

    let content: any[] = [{ type: 'text', text: prompt }]

    if (base64Data && mimeType) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64Data}` }
      })
    } else if (fileUrl) {
      // Determine content type based on URL extension
      const isPdf = fileUrl.toLowerCase().endsWith('.pdf')
      if (isPdf) {
        content.push({
          type: 'file_url',
          file_url: { url: fileUrl }
        })
      } else {
        content.push({
          type: 'image_url',
          image_url: { url: fileUrl }
        })
      }
    }

    const response = await zai.chat.completions.createVision({
      messages: [{ role: 'user', content }],
      thinking: { type: 'disabled' }
    })

    let resultText = response.choices[0]?.message?.content || ''

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      resultText = jsonMatch[1].trim()
    }

    let extracted
    try {
      extracted = JSON.parse(resultText)
    } catch {
      // If JSON parse fails, return raw text as content
      extracted = {
        title: `${typeLabel} - مستخرج بالذكاء الاصطناعي`,
        content: resultText,
        questions: [],
        answerKey: ''
      }
    }

    return NextResponse.json({
      success: true,
      type,
      grade: grade || '',
      extracted
    })
  } catch (err: any) {
    console.error('AI extraction error:', err)
    return NextResponse.json({
      error: 'خطأ في استخراج المحتوى: ' + (err.message || 'خطأ غير معروف')
    }, { status: 500 })
  }
}
