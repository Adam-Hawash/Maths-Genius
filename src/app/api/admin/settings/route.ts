// @ts-nocheck
import { NextResponse } from 'next/server'
import { db, safeWrite } from '@/lib/db'

var DEFAULT_EMAIL = 'adam7awash@gmail.com'
var DEFAULT_PASSWORD = '7awash@)!!'
var DEFAULT_NAME = 'Mr Wael Khodier'

export async function GET() {
  try {
    // محاولة البحث عن الأدمن، إذا فشل الاتصال سيذهب للـ catch
    let admin = await db.admin.findFirst()
    
    if (!admin) {
      admin = await safeWrite(async () => {
        return await db.admin.create({
          data: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD, name: DEFAULT_NAME },
        })
      })
    }
    
    var safe = { id: admin.id, email: admin.email, name: admin.name, createdAt: admin.createdAt, updatedAt: admin.updatedAt }
    return NextResponse.json({ admin: safe })
  } catch (error) {
    console.error('Admin settings fetch error:', error)
    // هنا بنرجع تفاصيل الخطأ عشان تعرف لو فيه مشكلة في الـ Connection
    return NextResponse.json({ error: 'تعذر الاتصال بقاعدة البيانات', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    var body = await request.json()
    var { oldPassword, newEmail, newPassword } = body

    if (!oldPassword) {
      return NextResponse.json({ error: 'يجب إدخال كلمة المرور الحالية' }, { status: 400 })
    }

    var admin = await db.admin.findFirst()
    if (!admin) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    // التحقق من كلمة المرور الحالية
    if (admin.password !== oldPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 })
    }

    var updateData = {}
    if (newEmail && newEmail.trim()) {
      updateData.email = newEmail.trim()
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 حروف على الأقل' }, { status: 400 })
      }
      updateData.password = newPassword.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'لم يتم تغيير أي بيانات' }, { status: 400 })
    }

    // استخدام safeWrite لضمان الكتابة الصحيحة في Turso
    var updated = await safeWrite(async () => {
      return await db.admin.update({
        where: { id: admin.id },
        data: updateData,
      })
    })

    var safe = { id: updated.id, email: updated.email, name: updated.name, createdAt: updated.createdAt, updatedAt: updated.updatedAt }
    return NextResponse.json({ message: 'تم تحديث الإعدادات بنجاح', admin: safe })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'فشل حفظ الإعدادات، يرجى المحاولة لاحقاً' }, { status: 500 })
  }
}
