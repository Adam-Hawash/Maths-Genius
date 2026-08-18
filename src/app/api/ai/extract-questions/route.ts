import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      return NextResponse.json(
        { error: 'يجب تحديد واجب أو امتحان' },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يجب رفع ملف PDF فقط' }, { status: 400 });
    }

    // التحقق من حجم الملف (الحد الأقصى 20 ميجا)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'حجم الملف كبير جداً (الحد الأقصى 20 ميجابايت)' },
        { status: 400 }
      );
    }

    // تحويل الملف إلى base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // تهيئة Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح Gemini API غير موجود. أضف GEMINI_API_KEY في متغيرات البيئة.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
- The explanation must be educational — explain the solving steps clearly so a student can learn
- Keep the ORIGINAL language of the questions (Arabic stays Arabic, English stays English)
- For mathematical expressions and equations, use clear readable text
- If the PDF has solutions marked, use them to determine correct answers
- If a question has no clear solution in the PDF, make your best educational judgment

Return ONLY a valid JSON array. No extra text, no markdown, no code blocks.
Example format:
[{"text":"سؤال","optionA":"أ","optionB":"ب","optionC":"ج","optionD":"د","correctAnswer":"B","explanation":"الشرح هنا"}]`;

    // إرسال الملف للذكاء الاصطناعي
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // استخراج JSON من الاستجابة
    let jsonStr = responseText.trim();

    // Gemini أحياناً يحط الـ JSON داخل code block
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      const arrayMatch = responseText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    let questions: any[];
    try {
      questions = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Gemini response:', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'فشل في تحليل استجابة الذكاء الاصطناعي. حاول ملف PDF آخر.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'لم يتم العثور على أسئلة في الملف. تأكد أن الملف يحتوي على أسئلة اختيار من متعدد.' },
        { status: 400 }
      );
    }

    // تنظيف والتحقق من كل سؤال
    const validQuestions = questions.map((q: any, index: number) => ({
      text: String(q.text || `سؤال ${index + 1}`),
      optionA: String(q.optionA || ''),
      optionB: String(q.optionB || ''),
      optionC: String(q.optionC || ''),
      optionD: String(q.optionD || ''),
      correctAnswer: ['A', 'B', 'C', 'D'].includes(String(q.correctAnswer)?.toUpperCase())
        ? String(q.correctAnswer).toUpperCase()
        : 'A',
      explanation: String(q.explanation || ''),
    }));

    // حفظ الأسئلة في الداتابيز
    const createData = validQuestions.map((q) => ({
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      ...(homeworkId ? { homeworkId } : {}),
      ...(examId ? { examId } : {}),
    }));

    await prisma.question.createMany({ data: createData });

    return NextResponse.json({
      success: true,
      count: validQuestions.length,
      questions: validQuestions,
    });
  } catch (error: any) {
    console.error('AI extraction error:', error);

    if (error?.message?.includes('API_KEY') || error?.message?.includes('401')) {
      return NextResponse.json(
        { error: 'مفتاح Gemini API غير صالح. تحقق من GEMINI_API_KEY.' },
        { status: 401 }
      );
    }

    if (error?.message?.includes('QUOTA') || error?.message?.includes('429')) {
      return NextResponse.json(
        { error: 'تم تجاوز حصة API. حاول لاحقاً.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          'حدث خطأ أثناء تحليل الملف: ' +
          (error?.message || 'خطأ غير معروف'),
      },
      { status: 500 }
    );
  }
}
