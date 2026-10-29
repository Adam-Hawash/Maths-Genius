import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { SESSION_COOKIE } from "@/lib/admin-config";

/** فحص الجلسة — تستخدمه الصفحة للدخول التلقائي للوحة التحكم */
export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: isAdminRequest(req) });
}

/** تسجيل الخروج — مسح كوكي الجلسة */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
