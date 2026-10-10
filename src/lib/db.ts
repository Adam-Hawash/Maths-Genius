import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * تحديد مسار قاعدة البيانات بذكاء حسب البيئة:
 *
 * 1) محلي/ساندبوكس: فيه DATABASE_URL في .env بيأشر على الملف الحقيقي → نستخدمه زي ما هو.
 * 2) Vercel (Serverless): مفيش DATABASE_URL، والملف المرفوع مع الريبو للقراءة فقط
 *    → ننسخ القاعدة المرفقة (db/custom.db) إلى /tmp ونشتغل عليها،
 *    عشان عمليات الكتابة (إضافة إعلان/درس) تشتغل من غير أخطاء.
 */
function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl) {
    const filePath = envUrl.replace(/^file:/, "");
    try {
      if (filePath && fs.existsSync(filePath)) return envUrl;
    } catch {
      /* تجاهل — نكمل للبديل */
    }
  }

  const bundled = path.join(process.cwd(), "db", "custom.db");
  if (fs.existsSync(bundled)) {
    try {
      const writable = path.join("/tmp", "mr-sabry-db.sqlite");
      if (!fs.existsSync(writable)) fs.copyFileSync(bundled, writable);
      return `file:${writable}`;
    } catch {
      return `file:${bundled}`;
    }
  }

  return envUrl ?? "file:./db/custom.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
