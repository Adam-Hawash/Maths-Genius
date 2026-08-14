import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default credentials (only used for first-time setup)
const DEFAULT_EMAIL = 'adam7awash@gmail.com'
const DEFAULT_PASSWORD = '7awash@)!!'

export async function GET() {
  try {
    let admin = await db.admin.findFirst()
    if (!admin) {
      admin = await db.admin.create({
        data: { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD, name: 'Mr Wael Khodier' },
      })
    }
    const { password: _, ...safe } = admin
    return NextResponse.json({ admin: safe })
  } catch (error) {
    console.error('Admin settings fetch error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { oldPassword, newEmail, newPassword } = body

    if (!oldPassword) {
      return NextResponse.json({ error: 'يجب إدخال كلمة المرور الحالية' }, { status: 400 })
    }

    let admin = await db.admin.findFirst()
    if (!admin) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    // Verify old password
    if (admin.password !== oldPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غلط' }, { status: 401 })
    }

    // Build update data
    const updateData: Record<string, string> = {}
    if (newEmail && newEmail.trim()) {
      updateData.email = newEmail.trim()
    }
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'كلمة المرور الجديدة لازم 6 حروف على الأقل' }, { status: 400 })
      }
      updateData.password = newPassword.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'مفيش حاجة تتغير' }, { status: 400 })
    }

    const updated = await db.admin.update({
      where: { id: admin.id },
      data: updateData,
    })

    const { password: _, ...safe } = updated
    return NextResponse.json({ message: 'تم تحديث الإعدادات بنجاح', admin: safe })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
