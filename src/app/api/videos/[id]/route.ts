import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const video = await db.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "الفيديو غير موجود" }, { status: 404 });
    }

    // 1. إذا كان الفيديو مجانياً للجميع (سعره 0)
    if (!video.price || video.price === 0) {
      return NextResponse.json({
        ...video,
        isLocked: false,
      });
    }

    // 2. إذا لم يكن الطالب مسجل دخول، يتم قفل الفيديو فوراً
    if (!studentId) {
      return NextResponse.json({
        id: video.id,
        title: video.title,
        grade: video.grade,
        price: video.price,
        thumbnail: video.thumbnail,
        url: null, // حجب الرابط
        isLocked: true,
      });
    }

    // 3. التحقق من صلاحية الطالب في قاعدة البيانات
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    // إذا كان الطالب مفعلاً بالاشتراك الشامل المجاني (✓)
    if (student?.isPaidAccess) {
      return NextResponse.json({
        ...video,
        isLocked: false,
      });
    }

    // 4. إذا كان نظام الطالب هو الدفع ($)، نتحقق هل اشترى هذا الفيديو تحديداً
    const purchase = await db.purchase.findFirst({
      where: {
        studentId: studentId,
        videoId: id,
        status: "approved",
      },
    });

    if (purchase) {
      return NextResponse.json({
        ...video,
        isLocked: false,
      });
    }

    // غير ذلك: الفيديو مقفل برقم سري وسعر
    return NextResponse.json({
      id: video.id,
      title: video.title,
      grade: video.grade,
      price: video.price,
      thumbnail: video.thumbnail,
      url: null, // حجب الرابط الحقيقي تماماً
      isLocked: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
