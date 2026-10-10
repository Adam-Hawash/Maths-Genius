import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** قائمة الإعلانات — عامة (للصفحة الرئيسية) */
export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ announcements });
  } catch {
    return NextResponse.json(
      { error: "تعذّر تحميل الإعلانات" },
      { status: 500 }
    );
  }
}

/** إضافة إعلان — للمشرف فقط */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  try {
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

    const announcement = await db.announcement.create({
      data: { title, body: text, important },
    });
    return NextResponse.json({ ok: true, announcement });
  } catch {
    return NextResponse.json(
      { error: "تعذّر حفظ الإعلان" },
      { status: 500 }
    );
  }
}
