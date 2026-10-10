import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** قائمة الدروس — عامة (للصفحة الرئيسية) */
export async function GET() {
  try {
    const lessons = await db.lesson.findMany({
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ lessons });
  } catch {
    return NextResponse.json({ error: "تعذّر تحميل الدروس" }, { status: 500 });
  }
}

/** إضافة درس — للمشرف فقط */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
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

    const lesson = await db.lesson.create({
      data: { title, grade, description, url: url || null },
    });
    return NextResponse.json({ ok: true, lesson });
  } catch {
    return NextResponse.json({ error: "تعذّر حفظ الدرس" }, { status: 500 });
  }
}
