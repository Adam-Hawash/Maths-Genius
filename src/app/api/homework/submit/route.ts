import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ===== POST: تسليم واجب + تصحيح تلقائي =====
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, homeworkId, answers } = body;

    if (!studentId || !homeworkId || !answers) {
      return NextResponse.json(
        { error: 'بيانات مفقودة' },
        { status: 400 }
      );
    }

    // منع التسليم مرتين
    const existing = await prisma.homeworkResult.findUnique({
      where: {
        studentId_homeworkId: { studentId, homeworkId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'تم تقديم هذا الواجب بالفعل' },
        { status: 400 }
      );
    }

    // جلب الأسئلة
    const questions = await prisma.question.findMany({
      where: { homeworkId },
      orderBy: { id: 'asc' },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد أسئلة في هذا الواجب' },
        { status: 400 }
      );
    }

    // التصحيح التلقائي
    let score = 0;
    const questionDetails = questions.map((q) => {
      const studentAnswer = answers[q.id] || null;
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) score++;

      return {
        questionId: q.id,
        questionText: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        studentAnswer,
        isCorrect,
        explanation: q.explanation || null,
      };
    });

    // حفظ النتيجة
    const result = await prisma.homeworkResult.create({
      data: {
        studentId,
        homeworkId,
        score,
        totalQuestions: questions.length,
        questionDetails: JSON.stringify(questionDetails),
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        studentId: result.studentId,
        homeworkId: result.homeworkId,
        score: result.score,
        totalQuestions: result.totalQuestions,
        questionDetails,
        createdAt: result.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Homework submit error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسليم الواجب' },
      { status: 500 }
    );
  }
}

// ===== GET: نتائج الطلاب + التحليلات =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const homeworkId = searchParams.get('homeworkId');

    if (!homeworkId) {
      return NextResponse.json(
        { error: 'homeworkId مطلوب' },
        { status: 400 }
      );
    }

    // جلب النتائج
    const results = await prisma.homeworkResult.findMany({
      where: { homeworkId },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });

    // الطلاب اللي لم يسلموا بعد
    const takenStudentIds = results.map((r) => r.studentId);
    const allStudents = await prisma.user.findMany({
      where: { role: 'student' },
    });
    const notTaken = allStudents.filter(
      (s) => !takenStudentIds.includes(s.id)
    );

    // الأسئلة الأكثر خطأ
    const questions = await prisma.question.findMany({
      where: { homeworkId },
    });

    const questionStats: Record<
      string,
      {
        wrongCount: number;
        totalAttempts: number;
        questionText: string;
        correctAnswer: string;
      }
    > = {};

    questions.forEach((q) => {
      questionStats[q.id] = {
        wrongCount: 0,
        totalAttempts: 0,
        questionText: q.text,
        correctAnswer: q.correctAnswer,
      };
    });

    results.forEach((result) => {
      try {
        const details: any[] = JSON.parse(result.questionDetails);
        details.forEach((d) => {
          if (questionStats[d.questionId]) {
            questionStats[d.questionId].totalAttempts++;
            if (!d.isCorrect) {
              questionStats[d.questionId].wrongCount++;
            }
          }
        });
      } catch {}
    });

    const mostMissed = Object.values(questionStats)
      .filter((s) => s.totalAttempts > 0)
      .sort(
        (a, b) =>
          b.wrongCount / b.totalAttempts - a.wrongCount / a.totalAttempts
      );

    return NextResponse.json({ results, notTaken, mostMissed });
  } catch (error: any) {
    console.error('Homework results error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب النتائج' },
      { status: 500 }
    );
  }
}
