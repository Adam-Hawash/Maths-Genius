import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** تعديل درس — للمشرف فقط */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const grade = String(body?.grade ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const url = body?.url ? String(body.url).trim() : null;

    if (!title || !grade) {
      return NextResponse.json(
        { error: "العنوان والصف مطلوبان" },
        { status: 400 }
      );
    }

    const existing = await db.lesson.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }

    const lesson = await db.lesson.update({
      where: { id },
      data: { title, grade, description, url: url || null },
    });
    return NextResponse.json({ ok: true, lesson });
  } catch {
    return NextResponse.json({ error: "تعذّر حفظ التعديل" }, { status: 500 });
  }
}

/** حذف درس — للمشرف فقط */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.lesson.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الدرس غير موجود" }, { status: 404 });
    }
    await db.lesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذّر الحذف" }, { status: 500 });
  }
}
