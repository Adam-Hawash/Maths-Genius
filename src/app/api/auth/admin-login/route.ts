import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TOKEN,
  isAdminEmail,
  isPasswordValid,
} from "@/lib/admin-config";

/**
 * الخطوة الثانية — صفحة «دخول المشرفين»:
 * البريد الإلكتروني + نفس كلمة السر → كوكي جلسة → لوحة التحكم
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "");
    const password = String(body?.password ?? "");

    if (isAdminEmail(email) && isPasswordValid(password)) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(SESSION_COOKIE, SESSION_TOKEN, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // أسبوع
      });
      return res;
    }

    return NextResponse.json(
      { ok: false, error: "البريد الإلكتروني أو كلمة السر غير صحيحة" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
