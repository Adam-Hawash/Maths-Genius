import { NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_TOKEN } from "@/lib/admin-config";

/** هل جلسة المشرف سارية؟ — حارس مسارات الإدارة */
export function isAdminRequest(req: NextRequest): boolean {
  return req.cookies.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}

/* ============================================================
   (Z-30) توافق مسارات إدارة الصيدلية — كانت بتعمل import لأنشاء
   مش موجودين في الملف ده فكان بيكسر الـ build بالكامل:
     - hashPassword / makeToken تعريفهم الحقيقي في lib/pharmacy/auth.ts
     - getAdminEmailFromRequest كان مش موجود أصلًا — اتضاف هنا
       (قراءة كوكي ph_admin بصيغة email.hmac والتحقق من التوقيع)
   ============================================================ */
export { hashPassword, makeToken } from "@/lib/pharmacy/auth";

export function getAdminEmailFromRequest(req: NextRequest): string | null {
  try {
    var raw = req.cookies.get("ph_admin")?.value || "";
    var idx = raw.lastIndexOf(".");
    if (idx < 1) return null;
    var email = raw.slice(0, idx);
    var token = raw.slice(idx + 1);
    return makeTokenLocal(email) === token ? email : null;
  } catch (e) {
    return null;
  }
}

import { makeToken as makeTokenLocal } from "@/lib/pharmacy/auth";
