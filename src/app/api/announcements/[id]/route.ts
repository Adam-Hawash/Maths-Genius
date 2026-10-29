import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** تعديل إعلان — للمشرف فقط */
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
    const text = String(body?.body ?? "").trim();
    const important = Boolean(body?.important);

    if (!title || !text) {
      return NextResponse.json(
        { error: "العنوان والنص مطلوبان" },
        { status: 400 }
      );
    }

    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }

    const announcement = await db.announcement.update({
      where: { id },
      data: { title, body: text, important },
    });
    return NextResponse.json({ ok: true, announcement });
  } catch {
    return NextResponse.json(
      { error: "تعذّر حفظ التعديل" },
      { status: 500 }
    );
  }
}

/** حذف إعلان — للمشرف فقط */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الإعلان غير موجود" }, { status: 404 });
    }
    await db.announcement.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذّر الحذف" }, { status: 500 });
  }
}
