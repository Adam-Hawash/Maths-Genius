// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const homeworkId = formData.get('homeworkId') as string | null;
    const examId = formData.get('examId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }
    if (!homeworkId && !examId) {
      return NextResponse.json({ error: 'يجب تحديد واجب أو امتحان' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يجب رفع ملف PDF فقط' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الملف كبير جداً (الحد الأقصى 20 ميجابايت)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'مفتاح Gemini API غير موجود. أضف GEMINI_API_KEY في متغيرات البيئة.' }, { status: 500 });
    }

    const prompt = `You are an expert mathematics teacher assistant. Analyze this solved exam/homework PDF carefully.

Your task:
1. Identify ALL multiple-choice questions in the document
2. For each question, extract:
   - The complete question text (preserve original language - Arabic or English)
   - All answer options labeled as A, B, C, D
   - The correct answer (determined from the solution shown in the PDF)
   - A detailed step-by-step explanation of how to solve the question and WHY the answer is correct

IMPORTANT RULES:
- Each question MUST have exactly 4 options (A, B, C, D). If fewer exist, put empty string for missing ones
- correctAnswer must be exactly one letter: "A", "B", "C", or "D"
- The explanation must be educational
- Keep the ORIGINAL language of the questions
- For mathematical expressions and equations, use clear readable text
- If the PDF has solutions marked, use them to determine correct answers
- If a question has no clear solution in the PDF, make your best educational judgment

Return ONLY a valid JSON array. No extra text, no markdown, no code blocks.
Example format:
[{"text":"سؤال","optionA":"أ","optionB":"ب","optionC":"ج","optionD":"د","correctAnswer":"B","explanation":"الشرح هنا"}]`;

    var apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    var geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'application/pdf', data: base64 } }
            ]
          }
        ]
      })
    });

    if (!geminiRes.ok) {
      var errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      if (geminiRes.status === 401 || geminiRes.status === 403) {
        return NextResponse.json({ error: 'مفتاح Gemini API غير صالح' }, { status: 401 });
      }
      if (geminiRes.status === 429) {
        return NextResponse.json({ error: 'تم تجاوز حصة API. حاول لاحقاً.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'خطأ من Gemini API: ' + errText.substring(0, 200) }, { status: 500 });
    }

    var geminiData = await geminiRes.json();
    var responseText = geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts && geminiData.candidates[0].content.parts[0] && geminiData.candidates[0].content.parts[0].text;

    if (!responseText) {
      return NextResponse.json({ error: 'لم يتم الحصول على رد من الذكاء الاصطناعي' }, { status: 500 });
    }

    var jsonStr = responseText.trim();
    var codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      var arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    var questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Gemini response:', responseText.substring(0, 500));
      return NextResponse.json({ error: 'فشل في تحليل استجابة الذكاء الاصطناعي. حاول ملف PDF آخر.' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على أسئلة في الملف.' }, { status: 400 });
    }

    var validQuestions = questions.map(function(q, index) {
      return {
        text: String(q.text || 'سؤال ' + (index + 1)),
        optionA: String(q.optionA || ''),
        optionB: String(q.optionB || ''),
        optionC: String(q.optionC || ''),
        optionD: String(q.optionD || ''),
        correctAnswer: ['A', 'B', 'C', 'D'].indexOf(String(q.correctAnswer || '').toUpperCase()) !== -1 ? String(q.correctAnswer).toUpperCase() : 'A',
        explanation: String(q.explanation || ''),
      };
    });

    return NextResponse.json({
      success: true,
      count: validQuestions.length,
      questions: validQuestions,
    });
  } catch (error) {
    console.error('AI extraction error:', error);
    var msg = error && error.message || '';
    return NextResponse.json({ error: 'حدث خطأ أثناء تحليل الملف: ' + (msg || 'خطأ غير معروف') }, { status: 500 });
  }
}
