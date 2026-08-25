import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// جلب الفيديو وفحص هل هو مقفل أم مفتوح
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const video = await db.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "الفيديو غير موجود" }, { status: 404 });
    }

    let isUnlocked = Number(video.price || 0) <= 0;
    if (studentId) {
      const student = await db.student.findUnique({ where: { id: studentId } });
      if (student?.isPaidAccess) {
        isUnlocked = true;
      } else {
        const access = await db.videoAccess.findUnique({
          where: { videoId_studentId: { videoId: id, studentId } },
        });
        if (access) isUnlocked = true;
      }
    }

    return NextResponse.json({
      ...video,
      url: isUnlocked ? video.url : null, // إخفاء الرابط تماماً عن غير المشتركين
      filePath: isUnlocked ? video.filePath : "",
      isUnlocked,
      isLocked: !isUnlocked,
      // The client components read `isPurchased`, so expose it under that name too.
      isPurchased: isUnlocked,
      isPaid: Number(video.price || 0) > 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// تعديل الفيديو
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const video = await db.video.update({
      where: { id },
      data: {
        ...body,
        price: body.price !== undefined ? Number(body.price) : undefined,
      },
    });
    return NextResponse.json(video);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// حذف الفيديو بنجاح 100%
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // حذف العمليات المرتبطة بالفيديو أولاً لمنع تعارض قاعدة البيانات
    try {
      await db.videoAccess.deleteMany({ where: { videoId: id } });
      await db.videoProgress.deleteMany({ where: { videoId: id } });
    } catch (e) {}

    await db.video.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف الفيديو بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
