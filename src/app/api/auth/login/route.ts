import { NextRequest, NextResponse } from "next/server";
import { isAllFives, isPasswordValid } from "@/lib/admin-config";

/**
 * الخطوة الأولى من الدخول — النموذج العام:
 * رقم تسجيل الدخول (كلها خمسات) + كلمة السر → يفتح صفحة «دخول المشرفين»
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "");
    const password = String(body?.password ?? "");

    if (isAllFives(id) && isPasswordValid(password)) {
      return NextResponse.json({ ok: true, role: "admin-gate" });
    }

    return NextResponse.json(
      { ok: false, error: "بيانات الدخول غير صحيحة" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
