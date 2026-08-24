import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, count = 5, grade = "الصف الثالث الثانوي", difficulty = "متوسط" } = body;

    if (!text && !body.image) {
      return NextResponse.json(
        { error: "يرجى تقديم نص الدرس أو المسائل للاستخراج" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const mockQuestions = [
        {
          id: "q1",
          question: `أوجد قيمة نها (س² - 4)/(س - 2) عندما س تؤول إلى 2:`,
          options: ["2", "4", "0", "غير معرفة"],
          correctAnswer: "4",
          explanation: "بالتحليل: (س - 2)(س + 2) / (س - 2) = س + 2، بالتعويض عن س = 2 ينتج 4.",
          type: "mcq",
        },
        {
          id: "q2",
          question: `إذا كانت ص = جا(3س)، فإن دص/دس تساوي:`,
          options: ["3 جتا(3س)", "-3 جتا(3س)", "جتا(3س)", "3 جا(3س)"],
          correctAnswer: "3 جتا(3س)",
          explanation: "مشتقة جا(دالة) = مشتقة الزاوية × جتا(الزاوية) = 3 جتا(3س).",
          type: "mcq",
        }
      ];

      return NextResponse.json({
        success: true,
        source: "local_smart_generator",
        questions: mockQuestions,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `أنت خبير ومصمم اختبارات لمادة الرياضيات لـ (${grade}).
استخرج عدد ${count} أسئلة اختيار من متعدد (MCQ) من النص التالي:
"""
${text}
"""
أجب بصيغة JSON فقط:
[
  {
    "id": "q1",
    "question": "نص السؤال باللغة العربية",
    "options": ["أ", "ب", "ج", "د"],
    "correctAnswer": "أ",
    "explanation": "خطوات الحل والشرح بالتفصيل",
    "type": "mcq"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const responseText = response.text || "[]";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const questions = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      source: "gemini_ai",
      questions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
