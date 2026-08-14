import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

var DEFAULT_EMAIL = 'adam7awash@gmail.com'
var DEFAULT_PASSWORD = '7awash@)!!'
var ADMIN_NAME = 'Maths Genius'

export async function POST(request) {
  var body
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  var email = body.email || ''
  var password = body.password || ''

  if (!email || !password) {
    return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبين' }, { status: 400 })
  }

  var cleanEmail = email.trim().toLowerCase()
  var cleanPassword = password

  // Check hardcoded credentials FIRST — works even if DB is down
  if (cleanEmail === DEFAULT_EMAIL && cleanPassword === DEFAULT_PASSWORD) {
    var adminData = {
      id: 'admin-001',
      email: DEFAULT_EMAIL,
      name: ADMIN_NAME,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json({
      message: 'تم تسجيل الدخول',
      admin: adminData,
    })
  }

  // If not default creds, try DB (if available)
  try {
    var dbModule = await import('@/lib/db')
    var db = dbModule.db
    var admin = await db.admin.findFirst()

    if (admin) {
      if (cleanEmail !== admin.email || cleanPassword !== admin.password) {
        return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
      }
      var password2 = admin.password
      var adminWithoutPassword = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      }
      return NextResponse.json({
        message: 'تم تسجيل الدخول',
        admin: adminWithoutPassword,
      })
    }
  } catch (dbError) {
    console.error('[Admin Login] DB error (non-fatal):', dbError)
  }

  return NextResponse.json({ error: 'البريد أو كلمة المرور غلط' }, { status: 401 })
}
