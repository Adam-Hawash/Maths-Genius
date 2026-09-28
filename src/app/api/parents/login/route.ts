import { NextRequest, NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

/* (2026-و38) شفاء ذاتي لجدول Parent — نفس حماية مسار التسجيل */
var parentDdlDone: Promise<void> | null = null
function ensureParentTable(): Promise<void> {
  if (!parentDdlDone) {
    parentDdlDone = (async function () {
      try {
        await db.$executeRawUnsafe("CREATE TABLE IF NOT EXISTS Parent (id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL UNIQUE, password TEXT NOT NULL DEFAULT '', studentId TEXT NOT NULL, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)")
        try { await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_parent_student ON Parent(studentId)') } catch (e) {}
      } catch (e) {
        parentDdlDone = null
      }
    })()
  }
  return parentDdlDone
}

// ============================================================
// (2026-و37) دخول ولي الأمر — برقم تليفونه الشخصي وباسورده هو
// (مفيش ربط جهاز للأولياء — الربط دي للطلاب بس عشان منع مشاركة الحسابات)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    var body: any = null
    try { body = await request.json() } catch (e) { body = null }
    var phone = body ? String(body.phone || '').trim() : ''
    var password = body ? String(body.password || '') : ''

    var normPhone = function (v: string): string {
      var t = String(v || '')
      t = t.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)) })
      t = t.replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) })
      var digits = t.replace(/[^0-9]/g, '')
      if (digits.length === 12 && digits.indexOf('20') === 0) digits = '0' + digits.slice(2)
      else if (digits.length > 11) digits = digits.slice(digits.length - 11)
      else if (digits.length === 10 && digits.indexOf('1') === 0) digits = '0' + digits
      return digits
    }
    /* (و90) + تطبيع الحروف العربية المتشابهة (أ/ا، ى/ي، ة/ه…) — نفس تطبيع التسجيل */
    var foldArabic = function (t: string): string {
      return t
        .replace(/[أإآ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
    }
    var normPwd = function (v: string): string {
      var t = String(v || '')
      t = t.replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)) })
      t = t.replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) })
      return foldArabic(t.replace(/\s+/g, '')).trim().toLowerCase()
    }

    var phoneNorm = normPhone(phone)
    if (!phoneNorm || !password) {
      return NextResponse.json({ error: 'اكتب رقم تليفونك وباسوردك' }, { status: 400 })
    }

    try { await ensureParentTable() } catch (eDdl) {}

    /* (و90) بحث بكل صيغ الرقم (المطبّع + الدولي 20xx + الأرقام الخام)
       عشان أي اختلاف تخزين قديم ما يمنعش ولي الأمر من دخوله */
    var parent = null as any
    var digitsOnly = phone.replace(/[^0-9]/g, '')
    var phoneVariants: string[] = []
    var pushVariant = function (v: string) { if (v && phoneVariants.indexOf(v) === -1) phoneVariants.push(v) }
    pushVariant(phoneNorm)
    if (digitsOnly.length === 12 && digitsOnly.indexOf('20') === 0) pushVariant('0' + digitsOnly.slice(2))
    if (phoneNorm.length === 11 && phoneNorm.indexOf('0') === 0) pushVariant('20' + phoneNorm.slice(1))
    pushVariant(digitsOnly)
    for (var vi = 0; vi < phoneVariants.length; vi++) {
      try {
        parent = await safeWrite(function () { var pp = phoneVariants[vi]; return db.parent.findFirst({ where: { phone: pp } }) })
      } catch (e1) {
        try { var pp2 = phoneVariants[vi]; parent = await db.parent.findFirst({ where: { phone: pp2 } }) } catch (e2) {}
      }
      if (parent) break
    }
    if (!parent || normPwd(parent.password) !== normPwd(password)) {
      return NextResponse.json({ error: 'الباسورد أو الرقم بتاعك غلط' }, { status: 401 })
    }

    var student: any = null
    try { student = await db.student.findUnique({ where: { id: parent.studentId } }) } catch (sErr) {}

    return NextResponse.json({
      success: true,
      parent: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone,
        studentId: parent.studentId,
        student: student
          ? { id: student.id, name: student.name, grade: student.grade, status: student.status, isPaidAccess: !!student.isPaidAccess }
          : null,
      },
    })
  } catch (err: any) {
    console.error('Parent login error:', err)
    return NextResponse.json({ error: 'حدث خطأ مؤقت في السيرفر — جرب تاني بعد لحظات' }, { status: 500 })
  }
}
