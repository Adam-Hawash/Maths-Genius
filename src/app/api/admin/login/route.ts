// @ts-nocheck
import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

export var maxDuration = 10

/* (2026-ص4-ر) بيانات المشرف الرئيسية — رجّعناها زي ما كانت الأصل:
   math genius / wael2026# — طلب المستر: «ماث جينيس ما تلعبش في الباسورد بتاعتها»
   لو صف القاعدة اتزامن بالبيانات القديمة الغلط → أول دخول بالبيانات الأصلية
   بيرجّع صف القاعدة عليها (مصدر حقيقة واحد) */
var DEFAULT_EMAIL = 'math genius'
var DEFAULT_PASSWORD = 'wael2026#'
var ADMIN_NAME = 'Mr.Wael Khodair'

export async function POST(request) {
  var body
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  var email = body.email
  var password = body.password

  if (!email || !password) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبين' }, { status: 400 })
  }

  // squash = strip ALL whitespace from both sides before comparing — the DB
  // may hold values like "sherif math@2026" / "mr sherif2026#" and the admin
  // may type them without (or with different) spaces. Never fail on spaces.
  var squash = function (v: any) { return String(v || '').replace(/\s+/g, '').toLowerCase() }
  var cleanEmail = squash(email)
  var cleanPassword = squash(password)

  try {
    var admin = await db.admin.findFirst()

    if (!admin) {
      if (cleanEmail !== squash(DEFAULT_EMAIL) || cleanPassword !== squash(DEFAULT_PASSWORD)) {
        return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
      }
      admin = await safeWrite(function() {
        return db.admin.create({
          data: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD, name: ADMIN_NAME },
        })
      })
    } else {
      if (cleanEmail !== squash(admin.email) || cleanPassword !== squash(admin.password)) {
        /* (2026-ص4-ر) بيانات القاعدة مختلفة → اللي بيكتب البيانات الأصلية بيدخل
           ومزامنة صف القاعدة عليها — وغير كده رفض زي ما هو */
        if (cleanEmail !== squash(DEFAULT_EMAIL) || cleanPassword !== squash(DEFAULT_PASSWORD)) {
          return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
        }
        var synced = await safeWrite(function() {
          return db.admin.update({
            where: { id: admin.id },
            data: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD },
          })
        })
        if (synced) admin = synced
      }
    }

    var adminWithoutPassword = { id: admin.id, email: admin.email, name: admin.name, createdAt: admin.createdAt, updatedAt: admin.updatedAt }

    return NextResponse.json({
      message: 'تم تسجيل الدخول',
      admin: adminWithoutPassword,
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 })
  }
}
