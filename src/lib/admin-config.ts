/**
 * إعدادات دخول المشرفين — منصة مستر محمد صبري للغة العربية
 *
 * تسلسل الدخول:
 *  1) نموذج الدخول العام: رقم تسجيل الدخول "كلها خمسات" + كلمة السر
 *     → يفتح صفحة «دخول المشرفين»
 *  2) صفحة دخول المشرفين: البريد الإلكتروني + نفس كلمة السر
 *     → كوكي جلسة الأدمن → لوحة التحكم
 *
 * ملاحظة: المقارنة بتطبيع المسافات والتشكيل حتى يكون الدخول متسامحًا مع
 * اختلاف طريقة الكتابة (مسافات/همزات) دون المساس بالقيم الأصلية.
 */

/** رقم تسجيل الدخول العام (كلها خمسات) */
export const ADMIN_LOGIN_ID = "55555555555";

/** كلمة السر الموحّدة (للدخول العام وصفحة المشرفين) */
export const ADMIN_PASSWORD_RAW = "محمد صبري#";

/** بريد دخول المشرفين (كما طلبه المستر + صيغة لاتينية مكافئة) */
export const ADMIN_EMAILS = ["محمد صبري عربي26", "mohamedsabryarabi26"];

/** كوكي جلسة الأدمن */
export const SESSION_COOKIE = "ms_admin_session";
export const SESSION_TOKEN = "ms-admin-session-7f3a92c1";

/** إزالة المسافات والتشكيل وتوحيد الحروف اللاتينية */
export function squash(input: string): string {
  return (input ?? "")
    .replace(/\s+/g, "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .toLowerCase();
}

/** التحقق من رقم الدخول العام (كلها خمسات — من 10 إلى 14 خمسة احتياطًا لأخطاء الكتابة) */
export function isAllFives(id: string): boolean {
  const digits = String(id ?? "").replace(/\D/g, "");
  return /^5{10,14}$/.test(digits);
}

/** التحقق من كلمة السر */
export function isPasswordValid(password: string): boolean {
  return squash(String(password ?? "")) === squash(ADMIN_PASSWORD_RAW);
}

/** التحقق من بريد المشرف */
export function isAdminEmail(email: string): boolean {
  const normalized = squash(String(email ?? ""));
  return ADMIN_EMAILS.map(squash).includes(normalized);
}
