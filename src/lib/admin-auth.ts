import { NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_TOKEN } from "@/lib/admin-config";

/** هل جلسة المشرف سارية؟ — حارس مسارات الإدارة */
export function isAdminRequest(req: NextRequest): boolean {
  return req.cookies.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}
