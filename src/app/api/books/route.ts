// @ts-nocheck
// FILE: src/app/api/books/route.ts
// (2026-و40) قايمة الكتب والملازم العامة — تاب «الكتب والملازم» في بورتال الطالب.
// ?grade= اختياري → نفس المطابقة الضبابية للصف المستخدمة في /api/homework
// (gradeVariants من المرجع الموحد — توحيد الصفوف S-4a) — من غيرها بنرجّع كل الكتب.
// بنرجّع الحقول الآمنة بس (من غير أي داتا داخلية).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { gradeVariants } from '@/lib/grade-names'

export const runtime = 'nodejs'

var _bookTableReady: Promise<void> | null = null
function ensureBookTable() {
  if (!_bookTableReady) {
    _bookTableReady = (async function () {
      try {
        await db.$executeRawUnsafe("CREATE TABLE IF NOT EXISTS Book (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', filePath TEXT NOT NULL DEFAULT '', sourceUrl TEXT NOT NULL DEFAULT '', fileName TEXT NOT NULL DEFAULT '', fileType TEXT NOT NULL DEFAULT 'application/pdf', sizeBytes INTEGER NOT NULL DEFAULT 0, grade TEXT NOT NULL DEFAULT '', createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL)")
      } catch (e) {}
      /* (و43) ترميم دفاعي: عمود sourceUrl على القواعد القديمة — ALTER المتسامح بيتكرر آمن */
      try {
        await db.$executeRawUnsafe("ALTER TABLE Book ADD COLUMN sourceUrl TEXT NOT NULL DEFAULT ''")
      } catch (e2) {}
    })()
  }
  return _bookTableReady
}

/* (S-4a — توحيد الصفوف) النسخة المحلية القديمة اتحذت — المرجع الموحد
   grade-names.ts هو اللي بيطبّع (النسخة القديمة كانت بتقص أسماء الابتدائي) */

export async function GET(request: NextRequest) {
  try {
    await ensureBookTable()
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get('grade')

    const where: Record<string, unknown> = {}
    if (grade) {
      /* (2026-ص3) مطابقة تساوي حرفية — مفيش contains بأول كلمة (تسريب بين الصفوف) */
      where.OR = [
        { grade: { in: gradeVariants(grade) } },
      ]
    }

    const books = await db.book.findMany({ where, orderBy: { createdAt: 'desc' } })

    /* حقول آمنة بس */
    const safeBooks = (books || []).map(function (b: any) {
      return {
        id: b.id,
        title: b.title,
        description: b.description || '',
        filePath: b.filePath || '',
        fileName: b.fileName || '',
        fileType: b.fileType || 'application/pdf',
        sizeBytes: b.sizeBytes || 0,
        grade: b.grade || '',
        sourceUrl: b.sourceUrl || '',
        createdAt: b.createdAt,
      }
    })

    return NextResponse.json({ books: safeBooks })
  } catch (error: any) {
    console.error('Public books fetch error:', error)
    return NextResponse.json({ error: 'Server error: ' + (error.message || String(error)) }, { status: 500 })
  }
}
